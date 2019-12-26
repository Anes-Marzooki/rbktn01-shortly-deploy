// var path = require("path");
var mongoose = require("mongoose");

var bcrypt = require("bcrypt-nodejs");
var Schema = mongoose.Schema;

mongoose.connect(
  process.env.dbLink ? process.env.dbLink : "mongodb://localhost:27017/",
  { useMongoClient: true }
);

var urlSchema = new Schema({
  url: String,
  baseUrl: String,
  code: String,
  title: String,
  visits: Number
});

var Link = mongoose.model("Url", urlSchema);

var userSchema = new Schema({
  username: String,
  password: String
});

var User = mongoose.model("User", userSchema);

User.comparePassword = function(attemptedPassword, password, callback) {
  bcrypt.compare(attemptedPassword, password, (err, isMatch) => {
    callback(isMatch);
  });
};

module.exports = { Link, User };
