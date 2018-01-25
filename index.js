const express = require("express");
const app = express();
//npm install node-sass-middleware (req node-sass?)
//npm install path?, mongo, 
//const sass = require("node-sass-middleware");
const path = require("path");

// app.use(
//     sass({
//         src: __dirname + "/public",
//         dest: __dirname +"/public",
//         debug: true
//     })
// );

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.sendfile("index.html");
});

app.listen(process.argv[2], function() {
    console.log("URL Shortener running on port " + process.argv[2]);;
});