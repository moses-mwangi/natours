const AppError = require("../utils/appError");

//////MOONGOOSEERROR:HANDLER === to handle unknow endPoint of an api eg: /api/v1/tours/23 (23)is unknown
const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

//////MOONGOOSEERROR:HANDLER === to handle the unique/dupicate unit field error response
const handleDuplicateFieldsDb = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate fields ${value}:please try another value`;
  return new AppError(message, 400);
};

//////MOONGOOSEERROR:HANDLER === to handle the required input field error response in moongose model
const handleValidationErrorDb = (err) => {
  const value = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${value.join(". ")}`;
  return new AppError(message, 400);
};

//////JWTERRROR:HANDLER IF SIGNATURE ERROR ITS CORRECT
const handleJwtError = (err) =>
  new AppError("Invalid token. Please login again!", 401);

const handleJwtExpireError = (err) =>
  new AppError("Your token has expired. Please try to login again!", 401);

//////GLOBAL--ERROR FROM APP(expressError):to handle all global error response that a developer might encounter in development
const sendErrorDEv = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

//////GLOBAL--ERROR FROM APP(expressError)::to handle all global error response that a user might encouter in production
const sendErrorProduction = (err, res) => {
  ///////OPERATIONAL ERROR: trusted error that we send to client
  if (err.isOptional) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //////PROGGRAMING or UNKNOWN ERRORS: eg The package u used might have problem
  } else {
    console.error("ERROR", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDEv(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") err = handleCastErrorDb(err);
    if (err.code === 11000) err = handleDuplicateFieldsDb(err);
    if (err.name === "ValidationError") err = handleValidationErrorDb(err);
    if (err.name === "JsonWebTokenError") err = handleJwtError(err);
    if (err.name === "TokenExpiredError") err = handleJwtExpireError(err);
    sendErrorProduction(err, res);
  }
};
