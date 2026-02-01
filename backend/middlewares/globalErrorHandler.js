const { ExpressError, BadRequestError } = require("../utils/ExpressError");

const globalErrorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message).join(", ");
    err = new BadRequestError(message);
  }

  if (err.name === "CastError") {
    err = new BadRequestError(`Invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const friendlyMessage = `This ${field} is already registered: ${value}`;
    err = new BadRequestError(friendlyMessage);
  }

  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong";

  // LOG FOR DEBUGGING
  console.log(`[API ERROR] Status: ${statusCode}, Message: ${message}`);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message, // This MUST be the field 'message' for react-toastify
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;