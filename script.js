var mqtt;
var reconnectTimeout = 4000;
var host = "test.mosquitto.org";
var port = 8080;
var connection_flag = 0;
var message = "";

function onConnectionLost() {
    console.log("Connection lost");
    connection_flag = 0;
}

function onConnect() {
    var tmpStr = "Connected to " + host + " on port " + port;
    document.getElementById("constatus").innerHTML = "Successfully Connected.";
    document.getElementById("status").innerHTML = tmpStr;
    console.log(tmpStr);
    connection_flag = 1;
}

function onConnected(recon, url){
    console.log("onConnected");
}

function onFailure(){
    var tmpStr = "Connection Attempt to Host " + host + " on port " + port + " Failed. Attempting to Reconnect.";
    document.getElementById("constatus").innerHTML = tmpStr;
    console.log(tmpStr);
    setTimeout(MQTTconnect, reconnectTimeout);
}

function isJson(item) {
    try {
        item = JSON.stringify(item);
        item = JSON.parse(item);
    } catch (e) {
        console.log(e);
        return false;
    }
    console.log("true");
    return true;
}

function onMessageArrived(msg){
    debugger;
    if(isJson(msg)){
        console.log("Received JSON: " + msg);
        updateMap(msg);
    } else {
        message = msg.payloadString;
        document.getElementById("messages").innerHTML = message;
        console.log("Received: " + message);
    }
}

function MQTTconnect() {
    if(connection_flag == 1){
        var tmpStr = "Already Connected to " + host + "|" + port + ". Click end for new session.";
        document.getElementById("constatus").innerHTML = tmpStr;
        console.log(tmpStr);
        return;
    }
    document.getElementById("messages").innerHTML = "";
    var s = document.forms["con"]["sname"].value;
    var p = document.forms["con"]["pname"].value;

    if(s != "") {
        host = s;
        console.log("host = " + host);
    }

    if(p != "") {
        port = parseInt(p);
        console.log("port = " + port)
    }

    console.log("Connecting to " + host + " " + port);

    var x = Math.floor(Math.random() * 10000);
    var cname = "clientId-" + x;

    mqtt = new Paho.MQTT.Client(host, port, cname);
    var options = {
        timeout: 4000,
        onSuccess: onConnect,
        onFailure: onFailure,
    };

    mqtt.onMessageArrived = onMessageArrived;
    mqtt.onConnectionLost = onConnectionLost;
    mqtt.connect(options);

}

function closeConnection(){
    if(connection_flag == 0){
        var tmpStr = "Not connected to any session.";
        document.getElementById("constatus").innerHTML = tmpStr;
        console.log(tmpStr);
        return;
    }
    mqtt.disconnect();
    var tmpStr = "Disconnected from " + host + " | " + port;
    document.getElementById("constatus").innerHTML = tmpStr;
    document.getElementById("status").innerHTML = "Not Connected";
    console.log(tmpStr);
    connection_flag = 0;
}

function subscribeTopic(){
    document.getElementById("substatus").innerHTML = "";
    if(connection_flag == 0){
        var tmpStr = "Not connected to any session.";
        document.getElementById("substatus").innerHTML = tmpStr;
        console.log(tmpStr);
        return;
    }

    var subtopic = document.forms["sub"]["tname"].value;
    mqtt.subscribe(subtopic);
    console.log("Subbed to topic: " + subtopic);
    document.getElementById("substatus").innerHTML = "Subbed to topic: " + subtopic;
}

function sendMessage(){
    document.getElementById("msgstatus").innerHTML = "";
    if(connection_flag == 0){
        var tmpStr = "Not connected to any session.";
        document.getElementById("msgstatus").innerHTML = tmpStr;
        console.log(tmpStr);
        return;
    }

    var messageText = document.forms["msg"]["msgtext"].value;
    var topic = document.forms["msg"]["mtname"].value;

    message = new Paho.MQTT.Message(messageText);

    if (topic != "") {
        message.destinationName = topic;
    } else {
        message.destinationName = "default-topic";
    }
    mqtt.send(message);
    console.log("Message: " + messageText + " sent.")
    document.getElementById("msgstatus").innerHTML = "Message sent.";
}

// Create map
var map = L.map('map').setView([51.049999, -114.066666], 10);

var tiles = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1
}).addTo(map);

function updateMap() {
    
}

function shareStatus() {

    const status = document.querySelector('#mstatus');
  
    function success(position) {
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        status.textContent = '';
        var temperature = Math.floor((Math.random() * 60) - 40);

        var la = latitude.toString();
        var lo = longitude.toString();
        var t = temperature.toString();

        var geojson = '{"latitude": ' + la + ', "longitude": ' + lo + ', "temperature": ' + t + '}';

        document.getElementById("mstatus").innerHTML = "";
        if(connection_flag == 0){
            var tmpStr = "Not connected to any session.";
            document.getElementById("msgstatus").innerHTML = tmpStr;
            console.log(tmpStr);
            return;
        }

        var name = document.forms["stat"]["yrname"].value;
        if(name == ""){
            name = "michael_shi";
        }
        var course = document.forms["stat"]["crsname"].value;
        if(course == ""){
            course = "ENGO651";
        }
        var topic = course + "/" + name + "/my_temperature";
        var msgjson = new Paho.MQTT.Message(geojson);
        msgjson.destinationName = topic;

        mqtt.send(msgjson);
        console.log("Message: " + msgjson + " sent to " + topic)
        document.getElementById("mstatus").innerHTML = "GeoJSON sent to " + topic;
    }
  
    function error() {
        status.textContent = 'Unable to retrieve your location';
    }
  
    if(!navigator.geolocation) {
        status.textContent = 'Geolocation is not supported by your browser';
    } else {
        status.textContent = 'Locating…';
        navigator.geolocation.getCurrentPosition(success, error);
    }

}
  
