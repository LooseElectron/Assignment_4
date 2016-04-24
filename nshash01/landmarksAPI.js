var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

var mongoUri = "mongodb://localhost/assignment_3";
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
        db = databaseConnection;
});

app.set('port', (process.env.PORT || 5000));

app.use('/static', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(request, response, next) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
});

app.post('/sendLocation', function(request, response) {
        if ('login' in request.body && 'lat' in request.body && 'lng' in request.body) {
                var long = parseFloat(request.body.lng);
                var latt = parseFloat(request.body.lat);
                var date = new Date();

                var person = {
                        login: request.body.login,
                        lat: latt,
                        lng: long,
                        created_at: date
                }
                if (long != 0 && latt != 0) {
                        db.collection('checkins', function(err, collection) {
                                collection.insert(person, function(err, saved) {
                                        if (err) {
                                                error_state = 1
                                        }
                                });
                        });
                }

                var nearquery = {
                        "$near": {
                                "$geometry": {
                                        "type": "Point",
                                        "coordinates": [long, latt]
                                },
                                "$maxDistance": 1600,
                                "$minDistance": 0
                        }
                };

                set_landmarks = [];
                set_people = [];
                var error_state = 0;

                db.collection('landmarks').createIndex({'geometry': '2dsphere'}, null);
                db.collection('landmarks').find({"geometry": nearquery}).toArray(function(err, cursor) {
                        if (!err) {
                                for (var i = 0; i < cursor.length; i++) {
                                        set_landmarks[i] = cursor[i];
                                }
                        } else {
                                error_state = 1;
                        }
                        getPeople();
                });

                function getPeople() {
                        db.collection('checkins').find().toArray(function(err, cursor) {
                                if (!err) {
                                        for (var i = 0; i < cursor.length; i++) {
                                                set_people[i] = cursor[i];
                                        }
                                } else {
                                        error_state = 1;
                                }
                                sendResponse();
                        });
                }

                function sendResponse() {
                        if (error_state == 0) {
                                response.send({'people': set_people, 'landmarks': set_landmarks});
                        } else if (error_state == 1) {
                                response.send(500);
                        }
                }
        } else {
                response.send({"error": "Whoops, something is wrong with your data!"});
        }
});

app.get('/checkins.json', function(request, response) {
        if ('login' in request.query) {
                var set_people = [];
                console.log(request.query.login);
                db.collection('checkins').find(request.query.login).toArray(function(err, cursor) {
                        if (!err) {
                                for (var i = 0; i < cursor.length; i++) {
                                        set_people[i] = cursor[i];
                                }
                                response.send(set_people);
                        } else {
                                response.send(500)
                        }
                });
        } else {
                response.send({"error": "Whoops, something is wrong with your data!"});
        }
});

app.get('/', function(request, response) {
        var set_people = [];
        var index_page = "<!DOCTYPE html><html><head><title>Landmark Check-ins</title><meta charset='utf-8' /><body><h1>Landmark Check-ins:</h1>";
        db.collection('checkins').find().toArray(function(err, cursor) {
                if (!err) {
                        for (var i = 0; i < cursor.length; i++) {
                                set_people[cursor[cursor.length - i - 1].created_at.toString()] = cursor[cursor.length - i - 1];
                        }

                        for (var j in set_people) {
                                if (set_people.hasOwnProperty(j)) {
                                        index_page += "<p>" + set_people[j].login + " checked in at " + set_people[j].lat + ", " + set_people[j].lng + " on " + set_people[j].created_at.toString() + "</p>";
                                }
                        }
                        index_page += "</body></html>";
                        sendCheckins(index_page);
                }
        });

        function sendCheckins(data) {
                response.send(data);
        }
});

app.get('/landmarks', function(request, response) {
        html = fs.readFileSync(__dirname + "/public/index.html", "utf8");
        response.send(html);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});