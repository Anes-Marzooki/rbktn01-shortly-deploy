var request = require("request");
var crypto = require("crypto");
var bcrypt = require("bcrypt-nodejs");
var util = require("../lib/utility");

var dbConfig = require("../app/config");
var db = dbConfig.db;
var Link = dbConfig.Link;
var User = dbConfig.User;
// { db, Link, User }
// var Users = require("../app/collections/users");
// var Links = require("../app/collections/links");

exports.renderIndex = function(req, res) {
  res.render("index");
};

exports.signupUserForm = function(req, res) {
  res.render("signup");
};

exports.loginUserForm = function(req, res) {
  res.render("login");
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect("/login");
  });
};

exports.fetchLinks = function(req, res) {
  Link.find().exec(values => {
    res.status(200).send(values);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log("Not a valid url: ", uri);
    return res.sendStatus(404);
  }

  Link.find({ url: uri }).then(function(found) {
    if (found.length) {
      res.status(200).send(found[0]);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log("Error reading URL heading: ", err);
          return res.sendStatus(404);
        }
        var shasum = crypto.createHash("sha1");
        shasum.update(uri);
        Link.save(
          {
            url: uri,
            title: title,
            baseUrl: req.headers.origin,
            code: shasum.digest("hex").slice(0, 5)
          },
          value => {
            console.log("value of save callback", value);
            res.status(200).send(value);
          }
        );
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({ username: username }).then(function(user) {
    if (!user.length) {
      res.redirect("/login");
    } else {
      user.comparePassword(password, user[0].password, function(match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect("/login");
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({ username: username }).then(function(user) {
    if (!user.length) {
      bcrypt.hash(password, null, hash => {
        var newUser = new User({
          username: username,
          password: hash
        });
        newUser.save(function() {
          util.createSession(req, res, newUser);
        });
      });
    } else {
      console.log("Account already exists");
      res.redirect("/signup");
    }
  });
};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] }).then(function(link) {
    if (!link) {
      res.redirect("/");
    } else {
      link.visits++;
      Link.update({ _id: link._id }, link).then(function() {
        return res.redirect(link.get("url"));
      });
    }
  });
};
