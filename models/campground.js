var mongoose = require("mongoose");

//Schema database setup
var campgroundSchema = new mongoose.Schema({
  name: String,
  image: String,
  description: String,
  price: String,
  coordinates: {
    long: { type: String, default: "-119.538330" },
    lat: { type: String, default: "37.865101" }
  },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }] //associate comments to campground
});
var Campground = mongoose.model("Campground", campgroundSchema); //compile schema into to a model

module.exports = Campground; //send "out" Campground model
