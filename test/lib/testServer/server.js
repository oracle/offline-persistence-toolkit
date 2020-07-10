
var express = require('express');

// var bodyParser = require('body-parser');
// var multer = require('multer');
// var upload = multer({dest: './uploads'});

var app = express();

// app.use(bodyParser.urlencoded({extended: true}));
// app.use(bodyParser.json());
//app.use(upload);

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Request-ID");
  res.header("Access-Control-Expose-Headers", "Oracle-Mobile-Sync-Resource-Type, ETag");
  next();
});

// POST or PUT for inventory items
app.post('/testOPT', function(req,res){
  setTimeout(function(){
    res.send("testComplete");
  },5000);
});
var port = 3003
app.listen(port, "0.0.0.0");
console.log('Listening on port:' + port);
