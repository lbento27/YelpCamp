var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1537815749002-de6a533c64db?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=545&q=80"
  },
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, require: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: { type: Boolean, default: false }
});

UserSchema.plugin(passportLocalMongoose); //this adds methods to our user

module.exports = mongoose.model("User", UserSchema);
