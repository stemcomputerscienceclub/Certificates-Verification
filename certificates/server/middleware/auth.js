import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No access token provided',
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
      if (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'TokenExpired',
            message: 'Access token has expired',
          });
        }
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid access token',
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action',
      });
    }

    next();
  };
};

export const authorizePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

export const generateToken = (user, expiresIn = '24h') => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET + 'refresh',
    { expiresIn: '7d' }
  );
};
