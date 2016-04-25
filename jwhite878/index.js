var express = require('express');

var app = express();

var bodyParser = require('body-parser'); // Required if we need to use HTTP query or post parameters
var validator = require('validator'); // See documentation at https://github.com/chriso/validator.js

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Mongo initialization and connect to database
// process.env.MONGOLAB_URI is the environment variable on Heroku for the MongoLab add-on
// process.env.MONGOHQ_URL is the environment variable on Heroku for the MongoHQ add-on
// If environment variables not found, fall back to mongodb://localhost/nodemongoexample
// nodemongoexample is the name of the database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://heroku_2rr0xf4v:st8ojv3gcganuh1kdut79paq28@ds019970.mlab.com:19970/heroku_2rr0xf4v';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
  db = databaseConnection;
});

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.set('Content-Type', 'text/html');
  var indexPage = '';
  db.collection('checkins', function(er, collection) {
    collection.find().toArray(function(err, cursor) {
      if(!err) {
        indexPage += '<!DOCTYPE HTML><html><head><title>Checkins</title></head><body><h1>Checkins</h1>';
        for (var count = cursor.length - 1; count >=0; count--) {
          indexPage += '<p>' + cursor[count].login + ' checked in at ' + cursor[count].lat + ', ' + cursor[count].lng + ' on ' + cursor[count].created_at + '</p>'; 
        }
        indexPage += '</body></html>';
        response.send(indexPage);
      }
      else {
         response.send('<!DOCTYPE HTML><html><head><title>Checkins</title></head><body><h1>Whoops, something went terribly wrong!</h1></body></html>');
      }
    });
  });
});

app.get('/checkins.json', function(request, response) {
  var loginQuery = request.query.login;
  if (!loginQuery) {
    response.send('[]');
  }

  db.collection('checkins', function(er, coll){
    coll.find({'login': loginQuery}).toArray(function(err, cursor) {
      if (!err) {
        response.status(200).send(cursor);
      }
      else {
        response.sendStatus(500);
      }
    });
  });
});

app.post('/sendLocation', function(request, response) {
  var today = new Date();
  var dateString = today.toString();
  var login = request.body.login;
  var lat = parseFloat(request.body.lat);
  var lng = parseFloat(request.body.lng);
  var toInsert = {
    "login": login,
    "lat": lat,
    "lng": lng,
    "created_at": dateString
  };
  if(!login||!lat||!lng){
    response.send('{"error":"Whoops, something is wrong with your data!"}');
    return;
  } 

  db.collection('checkins', function(error, coll) {
    var id = coll.insert(toInsert, function(error, saved) {
      if (error) {
        response.sendStatus(500);
      }
      else {
        peopleArr = coll.find().toArray(function(err, checkinCursor) { 
          if(!err) {
            db.collection('landmarks').createIndex({'geometry':"2dsphere"}, function() {
              db.collection('landmarks').find({geometry:{$near:{$geometry:{type:"Point",coordinates:[parseFloat(lng),parseFloat(lat)]},$minDistance: 0,$maxDistance: 1609.34}}}).toArray(function (err, landmarksCursor) {
                if(!err) {
                  var toReturn = {
                    "people": checkinCursor,
                    "landmarks": landmarksCursor,
                  };
                  response.status(200).send(toReturn);
                }
                else {
                  response.sendStatus(500);
                }
              });
            });
          }
          else {
            response.sendStatus(500);
          }
        });
      }
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
