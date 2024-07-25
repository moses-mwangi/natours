///THE GLOBAL CLASS TO HANDLE ALL ERRORS

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOptional = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
