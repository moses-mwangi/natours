const Review = require("./../model/reviewsModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handleFactory");

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const review = await Review.find(filter);
//   res.status(200).json({
//     status: "success",
//     results: review.length,
//     data: {
//       review,
//     },
//   });
// });

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.users) req.body.user = req.user.id;

  next();
};

exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
