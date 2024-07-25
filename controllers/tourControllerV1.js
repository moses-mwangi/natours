const Tour = require("../model/tourModel");

exports.getAllTour = async (req, res) => {
  try {
    ///filetr
    const queryObj = { ...req.query };
    const excludeFields = ["sort", "page", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    ///Advance filter
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Tour.find(JSON.parse(queryStr));

    ///sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    ///limiting fields
    if (req.query.fields) {
      const field = req.query.fields.split(",").join(" ");
      query = query.select(field);
    } else {
      query = query.select("-__v");
    }

    ////// pagination
    const pageNum = req.query.page * 1 || 1;
    const limitNum = req.query.limit * 1 || 100;
    const skip = (pageNum - 1) * limitNum;
    console.log(skip);

    query = query.skip(skip).limit(limitNum);

    if (req.query.page) {
      const count = await Tour.countDocuments();
      if (skip > count) throw new Error("This page does nt exist");
    }

    const tours = await query;

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: { tours: tours },
    });
  } catch (err) {
    res.status(404).json({
      status: "Failed",
      message: "Invalid request",
    });
  }
};

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,summary,ratingsAverage,difficulty";
  next();
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (tour) {
      res.status(200).json({
        status: "success",
        data: { tour: tour },
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "The InvalidId",
      });
    }
  } catch (err) {
    res.status(404).json({
      status: "failed",
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({ status: "success", data: { tour: newTour } });
  } catch (err) {
    res.status(400).json({ status: "Failed", message: err });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(201).json({
      status: "success",
      data: tour,
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    res.status(201).json();
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};
