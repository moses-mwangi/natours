const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const tour = await Model.findByIdAndDelete(req.params.id);

    if (!tour) {
      return next(new AppError("No tour found with that ID :IvalidId", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No doc found with that ID :IvalidId", 404));
    }

    res.status(201).json({
      status: "success",
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: { data: doc },
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption)
      query = Model.findById(req.params.id).populate(populateOption);

    // const doc = await Model.findById(req.params.id).populate("reviews");
    const doc = await query;

    if (!doc) {
      return next(
        new AppError("No document found with that ID :IvalidId", 404)
      );
    }

    if (doc) {
      res.status(200).json({
        status: "success",
        data: { data: doc },
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "The InvalidId",
      });
    }
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    // const docs = await features.query.explain();
    const docs = await features.query;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: { data: docs },
    });
  });
