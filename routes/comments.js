//!requires
var express = require("express");
//var router = express.Router(); ///now with routes separate in files instead of using app.get will use router.get and in the end export router
var router = express.Router({ mergeParams: true }); //this will make so de :id from app.js will pass truth here

var Campground = require("../models/campground");
var Comment = require("../models/comment");

//*require middleware
//if we require a folder automatic node requires index.js file in that folder so--- var middleware= require("../middleware/index.js"); can be
var middleware = require("../middleware");

//!====================
//!COMMENTS ROUTES
//!====================

//!NEW - show form to creat new
//this isLoggedIn middleware function, define bellow,  will run and check if we are login, if we are then will run next()"function(req....)","keep going" otherwise the following code never run
router.get("/new", middleware.isLoggedIn, function(req, res) {
  //find campground by id
  Campground.findById(req.params.id, function(err, campground) {
    if (err || !campground) {
      req.flash("error", "Campground not found");
      res.redirect("/campgrounds");
      //console.log(err);
    } else {
      res.render("comments/new", { campground: campground });
    }
  });
});

//!CREAT
router.post("/", middleware.isLoggedIn, function(req, res) {
  //lookup campground using ID
  Campground.findById(req.params.id, function(err, campground) {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds");
    } else {
      //creat new comment
      Comment.create(req.body.comment, function(err, comment) {
        //req.body.comment its because te text ao author are nested inside comment see new from comments "comment[text], comment[author]" this helps so we don t need to do var text = req.body.text and var author....
        if (err) {
          req.flash("error", "Something went wrong");
          //console.log(err);
        } else {
          //*add username and id to comment- req.user- this contains username and id(req.user.username and req.user._id) and its not null because we can only access this page if we are login
          //console.log("username will be: " + req.user.username);
          comment.author.id = req.user._id; //comment.author.id-comes from the model
          comment.author.username = req.user.username;
          //*save comment
          comment.save();
          //connect new comment to campground
          campground.comments.push(comment);
          campground.save();

          //console.log(comment);
          req.flash("success", "Successfully added comment");
          //redirect campground show page
          res.redirect("/campgrounds/" + campground._id);
        }
      });
    }
  });
});

//!Edit- show edit form
//route tha comes from app.js "/campgrounds/:id/comment"
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Campground.findById(req.params.id, function(err, foundCampground) {
    //make sure that we found campground and its valid
    if (err || !foundCampground) {
      req.flash("error", "Campground not found");
      res.redirect("/campgrounds");
    } else {
      Comment.findById(req.params.comment_id, function(err, foundComment) {
        if (err || !foundComment) {
          console.log(err);
          res.redirect("/campgrounds");
        } else {
          //id of campground is pass trough in app.js on routes so here we can do req.params.id= "campground id"
          res.render("comments/edit", {
            campground_id: req.params.id,
            comment: foundComment
          });
        }
      });
    }
  });
});

//!Update- update comment DB
router.put("/:comment_id", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(
    err,
    updatedComment
  ) {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds");
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

//!Delete -remove comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(
  req,
  res
) {
  Comment.findByIdAndRemove(req.params.comment_id, function(
    err,
    deletedComment
  ) {
    if (err) {
      console.log(err);
      res.redirect("back");
    } else {
      req.flash("success", "Comment deleted");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
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

// //this middleware function will check before run the next code if the user is log in and if he is the owner of that campground
// function checkCommentOwnership(req, res, next) {
//   //is user logged in?
//   if (req.isAuthenticated()) {
//     Comment.findById(req.params.comment_id, function(err, foundComment) {
//       if (err) {
//         console.log(err);
//         res.redirect("back"); //will take user back the previous page
//       } else {
//         //if logged in, does user own the comment?, note: foundComment is an object and req.user._id is a string so we cant use === we uses equals()-give by mongoose
//         if (foundComment.author.id.equals(req.user._id)) {
//           next(); //continue the code where this middleware is call
//         } else {
//           //otherwise redirect
//           res.redirect("back");
//         }
//       }
//     });
//   } else {
//     //if not, redirect
//     res.redirect("back"); //will take user back the previous page
//   }
// }

//!export router
module.exports = router;
