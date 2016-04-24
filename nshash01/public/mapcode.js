var lat = 0, lng = 0;
var login = "DEMO";
var data = null, info = null, map = null, poly_line = null;
var person_array = null, landmark_array = null, marker = null;
var people_shown = true, landmarks_shown = true;
var user_image = {
        url: "/static/images/user_icon.png",
        scaledSize: new google.maps.Size(64, 72),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(32, 72)
};
var person_image = {
        url: "/static/images/person_icon.png",
        scaledSize: new google.maps.Size(36, 72),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(18, 72)
};
var landmark_image = {
        url: "/static/images/landmark_icon.png",
        scaledSize: new google.maps.Size(36, 72),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(18, 72)
};

getLocation();

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            initializeMap();
        });
    } else {
        alert("Geolocation is not supported by your web browser");
    }
}

function initializeMap() {

    var my_position = new google.maps.LatLng(lat, lng);

    map = new google.maps.Map(document.getElementById("map"),
                {center: my_position, zoom: 15});
    marker = new google.maps.Marker({
        position: my_position,
        animation: google.maps.Animation.DROP,
        map: map,
        icon: user_image,
        title: login +": Here I am!"
    });

    marker.addListener("click", function() {
        return showInfo(marker);
    });

    getLandmarks();
}

function getLandmarks() {
    var source = "http://immense-cove-70122.herokuapp.com/sendLocation";

    var post = "login=" + login + "&lat=" + lat + "&lng=" + lng;

    var request = new XMLHttpRequest();
    request.open("POST", source, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var raw = request.responseText;
            data = JSON.parse(raw);
            initializeLandmarks();
            initializePeople();
        }
    };

    request.send(post);
}

function initializeLandmarks() {
    landmark_array = new Array(data.landmarks.length);
    for (i = 0; i < data.landmarks.length; i++) {
        var this_lat = data.landmarks[i].geometry.coordinates[1];
        var this_lng = data.landmarks[i].geometry.coordinates[0];
        landmark_array[i] = new google.maps.Marker({
            position: new google.maps.LatLng(this_lat, this_lng),
            animation: google.maps.Animation.DROP,
            icon: landmark_image,
            map: map,
            title: data.landmarks[i].properties.Details
        });
        landmark_array[i].addListener("click", function() {
            return showInfo(this);
        });
    }
    findNearestLandmark();
}

function initializePeople() {
    person_array = new Array(data.people.length);
    var this_lat, this_lng;
    for (i = 0; i < data.people.length; i++) {
        this_lat = data.people[i].lat;
        this_lng = data.people[i].lng;
        person_array[i] = new google.maps.Marker({
            position: new google.maps.LatLng(this_lat, this_lng),
            animation: google.maps.Animation.DROP,
            icon: person_image,
            title: data.people[i].login + "<br/>Distance from you: " +
                Haversine(this_lat, this_lng, lat, lng) + "miles"
        });
        person_array[i].addListener("click", function() {
            return showInfo(this);
        });
        if (person_array[i].title.split("<br/>")[0] == login) {
            person_array[i].setMap(null);
        }
    }
    togglePeople();
}

function showInfo(curr_marker) {
    if (info != null) {
        info.close();
    }

    info = new google.maps.InfoWindow({content: curr_marker.title});
    info.open(map, curr_marker);
}

function findNearestLandmark() {
    var nearest_distance = Infinity;
    var this_lat, this_lng, this_distance, near_lat, near_lng;
    for (i = 0; i < data.landmarks.length; i++) {
        this_lat = data.landmarks[i].geometry.coordinates[1];
        this_lng = data.landmarks[i].geometry.coordinates[0];
        this_distance = Haversine(this_lat, this_lng, lat, lng);
        if (this_distance <= nearest_distance) {
            nearest_distance = this_distance;
            near_lat = this_lat;
            near_lng = this_lng;
            marker.title = login + "<br>Nearest landmark is: " +
                data.landmarks[i].properties.Location_Name +
                "<br/>" + this_distance + " miles away";
        }
    }
    var poly_line_coords = [
    new google.maps.LatLng(lat, lng),
    new google.maps.LatLng(near_lat, near_lng)];

    poly_line = new google.maps.Polyline({
        path: poly_line_coords,
        geodesic: true,
        strokeColor: "#0000FF",
        strokeWeight: 3,
        map: map
    });
}

function togglePeople() {
    for (i = 0; i < person_array.length; i++) {
        if (people_shown) {
            person_array[i].setMap(null);
        } else if (person_array[i].title.split("<br/>")[0] != login) {
            person_array[i].setMap(map);
        }
    }
    people_shown = !people_shown;
}

function toggleLandmarks() {
    for (i = 0; i < landmark_array.length; i++) {
        if (landmarks_shown) {
            landmark_array[i].setMap(null);
            poly_line.setMap(null);
        } else {
            landmark_array[i].setMap(map);
            poly_line.setMap(map);
        }
    }
    landmarks_shown = !landmarks_shown;
}

function toRad(deg) {
    return (deg*Math.PI)/180;
}

function Haversine(lat1, lng1, lat2, lng2) {
    var R = 3959;
    var φ1 = toRad(lat1);
    var λ1 = toRad(lng1);
    var φ2 = toRad(lat2);
    var λ2 = toRad(lng2);

    var a = Math.pow(Math.sin((φ2 - φ1) / 2), 2) +
            (Math.cos(φ1) * Math.cos(φ2) *
                Math.pow(Math.sin((λ2 - λ1) / 2), 2));
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}