//!requires
var express = require("express");
var router = express.Router(); ///now with routs separetein files insted of usin app.get will use router.get and in the end export router

var passport = require("passport");
var User = require("../models/user");

var Campground = require("../models/campground");
//password reset
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto"); //doesn't need install

//*require middleware
//if we require a folder automatic node requires index.js file in that folder so--- var middleware= require("../middleware/index.js"); can be
var middleware = require("../middleware");

//!====================
//! ROUTES
//!====================

router.get("/", function(req, res) {
  //res.send("this will be the landing page soon");
  res.render("landing");
});

//!====================
//!======Auth ROUTES====
//!====================

//?show register form
router.get("/register", function(req, res) {
  res.render("register", { page: "register" });
});

//? handle sign up logic
router.post("/register", function(req, res) {
  //res.send("signing you up!");
  //*added firstname lastname email and avatar
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  });

  //?make user admin, note: code is better move to ENV variable
  if (req.body.adminCode === "secretcode123") {
    newUser.isAdmin = true;
  }

  User.register(newUser, req.body.password, function(err, user) {
    // create a new user object and pass in only username, the reason we do not pass password is that we do not save password to the database, so we pass the password as a second argument and userregister will hash, encode password
    if (err) {
      //console.log(err);
      req.flash("error", err.message);
      //return res.render("register");
      return res.redirect("/register");
    }
    //authenticate user
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

//?show login form
router.get("/login", function(req, res) {
  res.render("login", { page: "login" });
});

//?handle login logic
//middleware code that runs before callback function, this example passport.authen.. app.post("/login", middleware, callback) where this middleware func is given by the passportlocalmongoose, and then automatic taker re.body.username, amd req.body.password, and check if  works redirect if it doesn t redirects to other place
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }),
  function(req, res) {}
);

//?logout route
router.get("/logout", function(req, res) {
  req.logOut();
  req.flash("success", "Logout Success!");
  res.redirect("/campgrounds");
});

//!====================
//!======USERS profiles ROUTES====
//!====================
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err) {
      req.flash("error", "Something went wrong");
      res.redirect("/");
    } else {
      //find all campgrounds form that user and pass campgrounds info as well user inf
      Campground.find()
        .where("author.id")
        .equals(foundUser._id)
        .exec(function(err, campgrounds) {
          if (err) {
            req.flash("error", "Something went wrong");
            res.redirect("/");
          } else {
            res.render("users/show", {
              user: foundUser,
              campgrounds: campgrounds
            });
          }
        });
    }
  });
});

//!====================
//!===PASSWORD RESET====
//!====================
//? show forgot form (EMAIL)
router.get("/forgot", function(req, res) {
  res.render("forgot");
});

//? handle EMAIL send  for password reset logic
router.post("/forgot", function(req, res, next) {
  //array of func that will run one after another
  async.waterfall(
    [
      //creat a token
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      //find the email and if exists
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists");
            return res.redirect("/forgot");
          }
          //if the user exit
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function(err) {
            done(err, token, user); //this will continue (done), but if theres an error will to to err function button
          });
        });
      },
      //send email with nodemailer
      //NOTE: in order to send mail with Gmail account need to enable "access to application less secure" for that account, link=https://myaccount.google.com/lesssecureapps?pli=1
      function(token, user, done) {
        //my email, email that will send email to user, put password to a ENV
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "yelpcamppt@gmail.com",
            pass: process.env.GMAILPW //password to ENV set up localy and on heroku
          }
        });
        //what the user will see on their email
        var mailOptions = {
          to: user.email, //user email
          from: "yelpcamppt@gmail.com",
          subject: "YelpCamp Password Reset",
          //, in where put link that will redirect to form to reset password
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        //send email
        smtpTransport.sendMail(mailOptions, function(err) {
          //console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      }
    ],
    function(err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

//!middleware -know all middleware are in a different file
//middleware function/ function to check if we are login if true keep going, next(), otherwise redirect to login page
//we can use this middleware func where we want the user to only access if its login!
// function isLoggedIn(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect("/login");
// }

//!export router
module.exports = router;
