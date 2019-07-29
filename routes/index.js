//!requires
var express = require("express");
var router = express.Router(); ///now with routs separetein files insted of usin app.get will use router.get and in the end export router

var passport = require("passport");
var User = require("../models/user");

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
  var newUser = new User({ username: req.body.username });

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
