//!requires
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
var expressSession = require("express-session");
var methodOverride = require("method-override");
var flash = require("connect-flash");
//! models
var Campground = require("./models/campground"); //"import" Campground model/schema
var Comment = require("./models/comment");
var User = require("./models/user");

//!require routes
var commentsRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");

//!require files
var seedDB = require("./seeds"); //require seeds.js

//! app configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride("_method")); //use method-override and look for _method
app.use(flash()); //use connect-flash need to come before the passport config

//! Passport configuration
app.use(
  expressSession({
    secret: "Luna wins for cutest dog!",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate())); //this comes from passport local mongoose from user.js
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//! CONNECT DB
//?connect local, not necessary if using ENV
// mongoose.connect("mongodb://localhost:27017/yelp_camp", { //if doesn't exit will creat db wit name yelp_camp
//   useNewUrlParser: true,
//   useFindAndModify: false
// });
//?connect to mongoDB Atlas, define env in heroku with $heroku config:set DATABASEURL= link(see in mongodb atlas website)    , for local set in terminal $export DATABASEURL=mongodb://localhost:27017/yelp_camp
//*this way we can work local with our local DB and when deploy use with cloud DB
// mongoose.connect(process.env.DATABASEURL, {
//   useNewUrlParser: true,
//   useFindAndModify: false
// });
//*instead of setting up env every time we close VSCODE make a backup like
var urlDB = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp";
mongoose.connect(urlDB, {
  useNewUrlParser: true,
  useFindAndModify: false
});

//!Server public directory, "connect stylesheets"
app.use(express.static(__dirname + "/public")); // __dirname refer to where the script lives in

//!seed DB,(local DB)
//seedDB(); // execute seeds.js

//!pass req.user to every route and pass flash to
//this function(middleware) will be called in every route and will be pass to every single template
//this will prevent us from needing to pass req.user manually in every route
// req.user that contains user inf (id an username), and if its not login will be undefined, we have access to this variable on header because header is include
app.use(function(req, res, next) {
  res.locals.currentUser = req.user; //what we put inside res.locals is what is available inside every template
  //res.locals.message = req.flash("error"); // this way we have access to flash on template under the name message
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success"); //define to message types
  next(); //move on
});
//!

//!tell app to use routes
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes); //this will make so the routes/paths inside campgrounds.js have a prefix of /campgrounds this way inside that file we dont need to put /campgrounds anymore
app.use("/campgrounds/:id/comments", commentsRoutes);

//!for local use
//not necessary if using ENV and set process-env.PORT=3000 and process.env.IP=localhost ->local use terminal $export PORT=3000
// app.listen(3000, "localhost", function() {
//   console.log("YelpCamp server has started!!");
// });
//!for heroku deploy(leave like this), and local(set env PORT=3000 and IP=localhost)
// app.listen(process.env.PORT, process.env.IP, function() {
//   console.log("YelpCamp server has started!!");
// });

//*instead of setting up env every time we close VSCODE make a backup like
var port = process.env.PORT || 3000;
var ip = process.env.IP || "localhost";

app.listen(port, ip, function() {
  console.log("YelpCamp server has started!!");
});
