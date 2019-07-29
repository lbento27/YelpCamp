//!require
var Campground = require("../models/campground");
var Comment = require("../models/comment");

//*all the middleware goes here
var middlewareObj = {}; //add all functions to an object so we can export all on one time

//!Check LOGIN
//middleware function/ function to check if we are login if true keep going, next(), otherwise redirect to login page
//we can use this middleware func where we want the user to only access if its login!
middlewareObj.isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "You need to be logged in to do that"); // this is always before redirect because flash only show on next page but this line do not display, only gives us a way to access this on the next request
  res.redirect("/login");
};

//!Check login and ownership of CAMPGROUND
//this middleware function will check before run the next code if the user is log in and if he is the owner of that campground
middlewareObj.checkCampgroundOwnership = function(req, res, next) {
  //is user logged in?
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, function(err, foundCampground) {
      if (err || !foundCampground) {
        // ||!foundCampground this handle in case the id is valid but doesn't exist in DB
        req.flash("error", "Campground not found");
        //console.log(err);
        res.redirect("back"); //will take user back the previous page
      } else {
        //if logged in, does user own the campground?, note: foundCampground is an object and req.user._id is a string so we cant use === we uses equals()-give by mongoose
        if (
          foundCampground.author.id.equals(req.user._id) ||
          req.user.isAdmin
        ) {
          next(); //continue the code where this middleware is call
        } else {
          //otherwise redirect
          req.flash("error", "You don't have permission to do that");
          res.redirect("back");
        }
      }
    });
  } else {
    //if not, redirect
    req.flash("error", "You need to be logged in to do that");
    res.redirect("back"); //will take user back the previous page
  }
};

//!Check login and ownership of COMMENT
//this middleware function will check before run the next code if the user is log in and if he is the owner of that campground
middlewareObj.checkCommentOwnership = function(req, res, next) {
  //is user logged in?
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function(err, foundComment) {
      if (err || !foundComment) {
        //console.log(err);
        req.flash("error", "Comment not found");
        res.redirect("back"); //will take user back the previous page
      } else {
        //if logged in, does user own the comment?, note: foundComment is an object and req.user._id is a string so we cant use === we uses equals()-give by mongoose
        if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next(); //continue the code where this middleware is call
        } else {
          //otherwise redirect
          req.flash("error", "You don't have permission to do that");
          res.redirect("back");
        }
      }
    });
  } else {
    //if not, redirect
    req.flash("error", "You need to be logged in to do that");
    res.redirect("back"); //will take user back the previous page
  }
};

//!export
module.exports = middlewareObj;
