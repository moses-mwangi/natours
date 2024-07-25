const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const Tour = require("../model/tourModel");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      max: 5,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      require: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: [true, "Review must have  a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});
/////// its only allow one user to send one review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/// (this === current model)
reviewSchema.statics.calculateRatingAverage = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });

  console.log(stats);
  console.log(tourId);
};

/// (this === current document that is being saved)
reviewSchema.post("save", function () {
  // this.Review.calculateRatingAverage(this.tour);
  this.constructor.calculateRatingAverage(this.tour);
});

//////////////////// I HAVENT STUDIEED ///////////////////////////
////// LESSON 166-168
/// findByIdAndUpdate
/// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  /// await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
///////////////////////////////////////////////////////////////////////////////
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
