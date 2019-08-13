//!requires
var express = require("express");
var router = express.Router(); ///now with routs separetein files insted of usin app.get will use router.get and in the end export router

var Campground = require("../models/campground");
//*require middleware
//if we require a folder automatic node requires index.js file in that folder so--- var middleware= require("../middleware/index.js"); can be
var middleware = require("../middleware");

//!====================
//!Campgrounds ROUTES
//!====================

//?NOTE: because in the app.js we put the prefix /campgrounds we dont need to use where anymore that will be auto add so que can remove it and insted of campgrounds/new only need /new

//! INDEX - show all campgrounds
router.get("/", function(req, res) {
  //get all campgrounds from DB
  //for the fuzzy search because we use a method=GET that way will creat an object (req.query) req.query.search instead of method=POST that makes an object (req.body)
  if (req.query.search) {
    //if exist/ if user input
    const regex = new RegExp(escapeRegex(req.query.search), "gi"); //makes a new regular expression and use the function down as so pass in flags "gi" to ignore case sensitive g-global i-ignore case
    //then do a regular search with that
    //Campground.find({ name: regex }, function(err, allCampgrounds) {
    //modify to search by author, campground if more just add
    Campground.find(
      { $or: [{ name: regex }, { "author.username": regex }] },
      function(err, allCampgrounds) {
        if (err) {
          console.log(err);
        } else {
          //if no matching campgrounds
          if (allCampgrounds < 1) {
            req.flash("error", "No matching campgrounds!");
            res.redirect("/campgrounds");
          } else {
            res.render("campgrounds/index", {
              campgrounds: allCampgrounds,
              page: "campgrounds"
              //,currentUser: req.user // pass trough req.user that contains user inf (id an username), and if its not login will be undefined, we have access to this variable on header because header is include um index.ejs, but will works on /camprgrouds so we have to pass this in every rout that uses header
            }); //render campgrounds page and pass trough campgrounds from DB
          }
        }
      }
    );
  } else {
    Campground.find({}, function(err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        res.render("campgrounds/index", {
          campgrounds: allCampgrounds,
          page: "campgrounds"
          //,currentUser: req.user // pass trough req.user that contains user inf (id an username), and if its not login will be undefined, we have access to this variable on header because header is include um index.ejs, but will works on /camprgrouds so we have to pass this in every rout that uses header
        }); //render campgrounds page and pass trough campgrounds from DB
      }
    });
  }
});

//! CREAT - add new campground tp DB
router.post("/", middleware.isLoggedIn, function(req, res) {
  //get data from from and add data to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var price = req.body.price;
  //*add username and id to created campgrounds
  var author = {
    id: req.user._id,
    username: req.user.username
  };

  var newCampground = {
    name: name,
    image: image,
    description: desc,
    author: author,
    price: price
  };

  //Creat new campground and save to DB
  Campground.create(newCampground, function(err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      //console.log(newlyCreated);
      //redirect back to campgrounds page
      res.redirect("/campgrounds");
    }
  });
});

//! NEW - show form to creat new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
  res.render("campgrounds/new.ejs");
});

//! SHOW - show info about one campground
router.get("/:id", function(req, res) {
  //find the campground with provided ID then populate comments, ate this moment only id whit actual data
  Campground.findById(req.params.id)
    .populate("comments likes")
    .exec(function(err, foundCampground) {
      if (err || !foundCampground) {
        // ||!foundCampground this handle in case the id is valid but doesn't exist in DB
        req.flash("error", "Campground not found!");
        res.redirect("/campgrounds");
        //console.log(err);
      } else {
        //console.log(foundCampground);
        //render show template with that campground
        res.render("campgrounds/show", { campground: foundCampground });
      }
    });
});

//! EDIT CAMPGROUND
//?render edit form
//this middleware function will check before run the next code if the user is log in and if he is the owner of that campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(
  req,
  res
) {
  Campground.findById(req.params.id, function(err, foundCampground) {
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

//? UPDATE campground
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
  //find and update the correct campground
  Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(
    err,
    updatedCampground
  ) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("/campgrounds");
    } else {
      req.flash("success", "Successfully Updated!");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

//!Destroy/remove campground route

router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
  Campground.findByIdAndRemove(req.params.id, function(err, deletedCampground) {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds/" + req.params.id);
    } else {
      res.redirect("/campgrounds");
    }
  });
});

//!Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function(req, res) {
  Campground.findById(req.params.id, function(err, foundCampground) {
    if (err) {
      console.log(err);
      return res.redirect("/campgrounds");
    }

    // check if req.user._id exists in foundCampground.likes
    var foundUserLike = foundCampground.likes.some(function(like) {
      //the "some" method will search if the user is in the arry of likes, will iterate and do a .equals()
      return like.equals(req.user._id);
    });

    if (foundUserLike) {
      // user already liked, then removing like
      foundCampground.likes.pull(req.user._id); //pull() remove the objectID from the array of likes
    } else {
      // adding the new user like
      foundCampground.likes.push(req.user);
    }

    foundCampground.save(function(err) {
      if (err) {
        console.log(err);
        return res.redirect("/campgrounds");
      }
      return res.redirect("/campgrounds/" + foundCampground._id);
    });
  });
});

//!Function to use in the fuzzy search
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

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
// function checkCampgroundOwnership(req, res, next) {
//   //is user logged in?
//   if (req.isAuthenticated()) {
//     Campground.findById(req.params.id, function(err, foundCampground) {
//       if (err) {
//         console.log(err);
//         res.redirect("back"); //will take user back the previous page
//       } else {
//         //if logged in, does user own the campground?, note: foundCampground is an object and req.user._id is a string so we cant use === we uses equals()-give by mongoose
//         if (foundCampground.author.id.equals(req.user._id)) {
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
