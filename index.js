const express = require("express");
const app = express();

const sass = require("node-sass-middleware");
const path = require("path");

const mongo = require("mongodb").MongoClient;
// const mongoose = require("mongoose");


app.use(
    sass({
        src: __dirname + "/public",
        dest: __dirname +"/public",
        debug: true
    })
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.sendfile("index.html");
});

app.get("/new/*", function(req, res) {
    let urlString = req.params[0];
    makeConnection(urlString, res); 
});

app.get("/:url", function(req, res) {
    let urlString = req.params.url.toString(16);
    if (urlString.match(/[0-9A-F]{6}/gi)){
        getUrl(urlString, res);
    } else {
        res.send({"err" : "Invalid request format."});
    }
});

app.listen(process.argv[2], function() {
    console.log("URL Shortener running on port " + process.argv[2]);;
});

function makeConnection(urlString, res){
    const dbName = "short-urls";
    const collName = "urls";
    const dbUrl = "mongodb://localhost:27017/";
    const maxEntries = 0x1000000;

    mongo.connect(dbUrl, function(err, db) {
        if (err) throw err;
        const urlCollection = db.db(dbName).collection(collName);
        console.log("Connected to DB: " + dbName +", Collection: " + collName);
        checkDb(db, urlCollection, maxEntries, validateUrl(urlString), res);
    });
}

function validateUrl(urlString) {
    var urlPattern = new RegExp("^(https?:\\/\\/)");
    return urlPattern.test(urlString) ? urlString : "https://" + urlString;
}

function checkDb(db, urlCollection, maxEntries, urlString, res) {
    urlCollection.count(function(err, count) {
        if (err) throw err;
        if (count >= maxEntries) {
            res.send({"err" : "DB is full"});
            db.close();
        }  else {
            generateId(db, urlCollection, maxEntries, urlString, res)
        }
    }) 
}

function generateId(db, urlCollection, maxEntries, urlString, res) {
    //Find a short, unique id that can be used to recall the url

    let newId  = Math.floor(maxEntries * Math.random()).toString(16);
    urlCollection.find({_id: newId}, {_id: 1}).limit(1).count(function(err, count){
        if (count === 0) {
            addUrl(db, urlCollection, urlString, newId, res);
        } else {
            console.log("hit repeat");
            generateId(db, urlCollection, maxEntries, urlString, res);
        }
    });
}

function addUrl(db, urlCollection, urlString, newId, res) {
    let urlObj = {
        "_id" : newId,
        "originalUrl" : urlString
    }
    urlCollection.insertOne(urlObj, function(err) {
        if (err) throw err;
        console.log("Added url to collection");
        res.send(urlObj);
        db.close();
    });
}

function getUrl(urlString, res) {
    const dbName = "short-urls";
    const collName = "urls";
    const dbUrl = "mongodb://localhost:27017/";
    const maxEntries = 0x1000000;
    mongo.connect(dbUrl, function(err, db) {
        if (err) throw err;
        const urlCollection = db.db(dbName).collection(collName);
        urlCollection.find(
            {"_id" : urlString}, 
            {"_id" : 1}
        ).toArray(function(err, data) {
            if (err) throw err;
            
            res.redirect(data[0].originalUrl);
            db.close();
        });
    });
}