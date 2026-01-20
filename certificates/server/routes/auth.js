import express from 'express';
import { body, validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLog.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 * @security Rate limited to 5 attempts per 15 minutes
 */
router.post(
  '/login',
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Invalid username'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Invalid password'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Find admin with password field
      const admin = await Admin.findOne({ username: username.toLowerCase() })
        .select('+passwordHash');

      if (!admin) {
        await AuditLog.create({
          action: 'LOGIN',
          entityType: 'ADMIN',
          ipAddress: clientIP,
          status: 'FAILED',
          errorMessage: 'Admin not found',
        });

        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid username or password',
        });
      }

      // Check if account is locked
      if (admin.isLocked()) {
        return res.status(429).json({
          error: 'Account Locked',
          message: 'Account is locked due to too many failed login attempts',
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'This admin account is inactive',
        });
      }

      // Compare passwords
      const isValidPassword = await admin.comparePassword(password);

      if (!isValidPassword) {
        await admin.recordFailedLogin(clientIP);

        await AuditLog.create({
          action: 'LOGIN',
          entityType: 'ADMIN',
          performedByUsername: username,
          ipAddress: clientIP,
          status: 'FAILED',
          errorMessage: 'Invalid password',
        });

        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid username or password',
        });
      }

      // Record successful login
      await admin.recordSuccessfulLogin(clientIP);

      // Generate tokens
      const accessToken = generateToken(admin);
      const refreshToken = generateRefreshToken(admin);

      await AuditLog.create({
        action: 'LOGIN',
        entityType: 'ADMIN',
        performedBy: admin._id,
        performedByUsername: admin.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
      });

      res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login Failed',
        message: 'An error occurred during login',
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const jwt = require('jsonwebtoken');
      let decoded;

      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET + 'refresh');
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid Token',
          message: 'Refresh token is invalid or expired',
        });
      }

      // Find admin and generate new token
      const admin = await Admin.findById(decoded.id);

      if (!admin || !admin.isActive) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Admin account is not active',
        });
      }

      const newAccessToken = generateToken(admin);

      res.json({
        message: 'Token refreshed',
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Refresh Failed',
        message: 'Failed to refresh token',
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (log audit trail)
 * @access  Private
 */
router.post('/logout', async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (req.user) {
      await AuditLog.create({
        action: 'LOGOUT',
        entityType: 'ADMIN',
        performedBy: req.user.id,
        performedByUsername: req.user.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
      });
    }

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout Failed',
      message: 'An error occurred during logout',
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.post(
  '/change-password',
  body('currentPassword')
    .isLength({ min: 8 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from current password'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Find admin with password
      const admin = await Admin.findById(req.user.id).select('+passwordHash');

      if (!admin) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Admin not found',
        });
      }

      // Verify current password
      const isValid = await admin.comparePassword(currentPassword);

      if (!isValid) {
        await AuditLog.create({
          action: 'UPDATE',
          entityType: 'ADMIN',
          entityId: admin._id,
          performedBy: admin._id,
          performedByUsername: admin.username,
          ipAddress: clientIP,
          status: 'FAILED',
          errorMessage: 'Invalid current password',
        });

        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Current password is incorrect',
        });
      }

      // Update password
      admin.passwordHash = newPassword;
      await admin.save();

      await AuditLog.create({
        action: 'UPDATE',
        entityType: 'ADMIN',
        entityId: admin._id,
        performedBy: admin._id,
        performedByUsername: admin.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
        details: { action: 'Password changed' },
      });

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Password Change Failed',
        message: 'Failed to change password',
      });
    }
  }
);

export default router;
