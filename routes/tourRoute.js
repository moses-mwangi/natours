const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("./../routes/reviewRoute");

const router = express.Router();

// router.param('id', tourController.checkID);
// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews

router.use("/:tourId/reviews", authController.protect, reviewRouter);

router.route("/tour-stats").get(tourController.getTourStart);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

router
  .route("/")
  .get(tourController.getAllTour)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTour, tourController.getAllTour);

// router
//   .route("/:tourId/review")
//   .post(
//     authController.protect,
//     authController.restrictTo("admin"),
//     reviewController.createReview
//   );

module.exports = router;
