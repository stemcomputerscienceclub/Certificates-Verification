const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();

  // Log error
  console.error(`[${timestamp}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp,
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    errorResponse = {
      error: 'Validation Error',
      message: 'Request validation failed',
      details,
      timestamp,
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    errorResponse = {
      error: 'Duplicate Entry',
      message: `${field} already exists in the system`,
      field,
      timestamp,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      error: 'Authentication Error',
      message: 'Invalid token',
      timestamp,
    };
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      error: 'Token Expired',
      message: 'Your session has expired. Please login again.',
      timestamp,
    };
  }

  // Mongoose not found error
  if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse = {
      error: 'Invalid ID',
      message: 'The provided ID is invalid',
      timestamp,
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.message = 'An error occurred. Please try again later.';
    delete errorResponse.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
