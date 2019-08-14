//!requires
var express = require("express");
var router = express.Router(); ///now with routs separetein files insted of usin app.get will use router.get and in the end export router
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
//!======USERS profiles ROUTES====
//!====================
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "User not found!");
      res.redirect("/campgrounds");
    } else {
      //find all campgrounds form that user and pass campgrounds info as well user inf
      Campground.find()
        .where("author.id")
        .equals(foundUser._id)
        .exec(function(err, campgrounds) {
          if (err) {
            req.flash("error", "Something went wrong");
            res.redirect("/campgrounds");
          } else {
            res.render("users/show", {
              user: foundUser,
              campgrounds: campgrounds,
              page: "user"
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
  res.render("users/forgot");
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
          done(err, token); //(done)=move on to the next function
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
            pass: process.env.GMAILPW //password to ENV set up locally($ export GMAILPW=jdfbjdg) and on heroku
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
//!===========================
//? show form to reset password
router.get("/reset/:token", function(req, res) {
  //find user token send to email and check if time(password reset on db) is greater than now
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    },
    function(err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      //render reset form and pass token
      res.render("users/reset", { token: req.params.token });
    }
  );
});

//? handle password reset (new password)

router.post("/reset/:token", function(req, res) {
  //async.water is an array of functions that will be auto call one after another
  async.waterfall(
    [
      function(done) {
        //find user by token and check date of token DB if its greater than now
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          function(err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            //if we get user back
            //check if password on the two form match
            if (req.body.password === req.body.confirm) {
              //.setPassword its from passport local mongoose that will do all the hash and encrypt auto and we only nedd to pass the password
              user.setPassword(req.body.password, function(err) {
                //reset token
                if (err) {
                  req.flash("error", "Something went wrong!");
                }
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                //save/update user and login
                user.save(function(err) {
                  if (err) {
                    req.flash("error", "Something went wrong!");
                  }
                  req.logIn(user, function(err) {
                    done(err, user); //(done)=move on to the next function
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      //send email to confirmation password reset
      //NOTE: in order to send mail with Gmail account need to enable "access to application less secure" for that account, link=https://myaccount.google.com/lesssecureapps?pli=1
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "yelpcamppt@gmail.com",
            pass: process.env.GMAILPW //password to ENV set up locally($ export GMAILPW=jdfbjdg) and on heroku
          }
        });
        var mailOptions = {
          to: user.email,
          from: "yelpcamppt@mail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      }
    ],
    function(err) {
      if (err) {
        req.flash("error", "Something went wrong!");
      }
      res.redirect("/campgrounds");
    }
  );
});

//!export router
module.exports = router;
