import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Certificate from '../models/Certificate.js';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLog.js';
import { authorizeRole, authorizePermission } from '../middleware/auth.js';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all admin routes (already done in main server.js)
// Additional authorization checks are per-route

// ==================== Certificate Management ====================

/**
 * @route   POST /api/admin/certificates
 * @desc    Create a new certificate
 * @access  Private (admin with canCreateCertificates)
 */
router.post(
  '/certificates',
  authorizePermission('canCreateCertificates'),
  body('certificateId')
    .matches(/^\d{7}$/)
    .withMessage('Certificate ID must be 7 digits (YYSSCCC format)')
    .custom(async (value) => {
      const exists = await Certificate.exists({ certificateId: value });
      if (exists) {
        throw new Error('Certificate ID already exists');
      }
    }),
  body('recipientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Invalid characters in name'),
  body('recipientEmail')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('program')
    .isIn([
      'Web Development',
      'Mobile Development',
      'Machine Learning',
      'Algorithms & Data Structures',
      'Programming Fundamentals',
      'Full Stack Development',
      'Cloud Computing',
      'Cybersecurity',
      'Other',
    ])
    .withMessage('Invalid program'),
  body('programCategory')
    .isIn(['00', '01', '02', '03'])
    .withMessage('Invalid program category'),
  body('awardDate')
    .isISO8601()
    .withMessage('Invalid award date'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { certificateId, recipientName, recipientEmail, program, programCategory, awardDate, notes } =
        req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Create certificate
      const certificate = new Certificate({
        certificateId: certificateId.toUpperCase(),
        recipientName: sanitizeInput(recipientName),
        recipientEmail: recipientEmail.toLowerCase(),
        program,
        programCategory,
        awardDate: new Date(awardDate),
        notes: notes ? sanitizeInput(notes) : null,
        issuedBy: 'STEM CS Club',
        createdBy: req.user.username,
      });

      await certificate.save();

      // Log action
      await AuditLog.create({
        action: 'CREATE',
        entityType: 'CERTIFICATE',
        entityId: certificate._id,
        performedBy: req.user.id,
        performedByUsername: req.user.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
        details: {
          certificateId,
          recipientName,
          program,
        },
      });

      res.status(201).json({
        message: 'Certificate created successfully',
        certificate: {
          id: certificate._id,
          certificateId: certificate.certificateId,
          recipientName: certificate.recipientName,
          program: certificate.program,
          awardDate: certificate.awardDate,
        },
      });
    } catch (error) {
      console.error('Certificate creation error:', error);

      // Log failed action
      await AuditLog.create({
        action: 'CREATE',
        entityType: 'CERTIFICATE',
        performedBy: req.user.id,
        performedByUsername: req.user.username,
        ipAddress: req.ip || req.connection.remoteAddress,
        status: 'FAILED',
        errorMessage: error.message,
      });

      res.status(500).json({
        error: 'Creation Failed',
        message: 'Failed to create certificate',
      });
    }
  }
);

/**
 * @route   GET /api/admin/certificates
 * @desc    List all certificates (with pagination)
 * @access  Private (admin)
 */
router.get(
  '/certificates',
  authorizeRole(['super_admin', 'admin', 'moderator']),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid page number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const certificates = await Certificate.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-ipAddresses')
        .lean();

      const total = await Certificate.countDocuments();

      res.json({
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        certificates,
      });
    } catch (error) {
      console.error('Certificate fetch error:', error);
      res.status(500).json({
        error: 'Fetch Failed',
        message: 'Failed to fetch certificates',
      });
    }
  }
);

/**
 * @route   PUT /api/admin/certificates/:id
 * @desc    Update a certificate
 * @access  Private (admin with canEditCertificates)
 */
router.put(
  '/certificates/:id',
  authorizePermission('canEditCertificates'),
  body('recipientName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/),
  body('recipientEmail')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail(),
  body('awardDate')
    .optional()
    .isISO8601(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const clientIP = req.ip || req.connection.remoteAddress;

      const certificate = await Certificate.findById(id);

      if (!certificate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Certificate not found',
        });
      }

      // Store original for audit
      const original = certificate.toObject();

      // Update fields
      const { recipientName, recipientEmail, awardDate, notes } = req.body;

      if (recipientName) certificate.recipientName = sanitizeInput(recipientName);
      if (recipientEmail) certificate.recipientEmail = recipientEmail.toLowerCase();
      if (awardDate) certificate.awardDate = new Date(awardDate);
      if (notes !== undefined) certificate.notes = notes ? sanitizeInput(notes) : null;

      certificate.updatedBy = req.user.username;
      await certificate.save();

      // Log action
      await AuditLog.create({
        action: 'UPDATE',
        entityType: 'CERTIFICATE',
        entityId: certificate._id,
        performedBy: req.user.id,
        performedByUsername: req.user.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
        changes: {
          before: original,
          after: certificate.toObject(),
        },
      });

      res.json({
        message: 'Certificate updated successfully',
        certificate,
      });
    } catch (error) {
      console.error('Certificate update error:', error);
      res.status(500).json({
        error: 'Update Failed',
        message: 'Failed to update certificate',
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/certificates/:id
 * @desc    Delete a certificate
 * @access  Private (admin with canDeleteCertificates - super_admin only)
 */
router.delete(
  '/certificates/:id',
  authorizePermission('canDeleteCertificates'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const clientIP = req.ip || req.connection.remoteAddress;

      const certificate = await Certificate.findByIdAndDelete(id);

      if (!certificate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Certificate not found',
        });
      }

      // Log action
      await AuditLog.create({
        action: 'DELETE',
        entityType: 'CERTIFICATE',
        entityId: certificate._id,
        performedBy: req.user.id,
        performedByUsername: req.user.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
        details: {
          certificateId: certificate.certificateId,
          recipientName: certificate.recipientName,
        },
      });

      res.json({
        message: 'Certificate deleted successfully',
      });
    } catch (error) {
      console.error('Certificate deletion error:', error);
      res.status(500).json({
        error: 'Deletion Failed',
        message: 'Failed to delete certificate',
      });
    }
  }
);

/**
 * @route   POST /api/admin/certificates/:id/revoke
 * @desc    Revoke a certificate
 * @access  Private (admin with canRevokeCertificates)
 */
router.post(
  '/certificates/:id/revoke',
  authorizePermission('canRevokeCertificates'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      const certificate = await Certificate.findById(id);

      if (!certificate) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Certificate not found',
        });
      }

      if (certificate.isRevoked) {
        return res.status(400).json({
          error: 'Already Revoked',
          message: 'Certificate is already revoked',
        });
      }

      await certificate.revoke(reason);

      // Log action
      await AuditLog.create({
        action: 'REVOKE',
        entityType: 'CERTIFICATE',
        entityId: certificate._id,
        performedBy: req.user.id,
        performedByUsername: req.user.username,
        ipAddress: clientIP,
        status: 'SUCCESS',
        details: {
          certificateId: certificate.certificateId,
          reason,
        },
      });

      res.json({
        message: 'Certificate revoked successfully',
        certificate,
      });
    } catch (error) {
      console.error('Certificate revocation error:', error);
      res.status(500).json({
        error: 'Revocation Failed',
        message: 'Failed to revoke certificate',
      });
    }
  }
);

// ==================== Analytics ====================

/**
 * @route   GET /api/admin/analytics
 * @desc    Get certificate analytics
 * @access  Private (admin with canViewAnalytics)
 */
router.get('/analytics', authorizePermission('canViewAnalytics'), async (req, res) => {
  try {
    const total = await Certificate.countDocuments();
    const verified = await Certificate.countDocuments({ isVerified: true });
    const revoked = await Certificate.countDocuments({ isRevoked: true });
    const active = total - revoked;

    // Group by program
    const byProgram = await Certificate.aggregate([
      { $match: { isRevoked: false } },
      { $group: { _id: '$program', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent verifications
    const recentVerifications = await AuditLog.find({ action: 'VERIFY', status: 'SUCCESS' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      summary: {
        total,
        active,
        verified,
        revoked,
      },
      byProgram,
      recentVerifications,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Analytics Failed',
      message: 'Failed to fetch analytics',
    });
  }
});

// ==================== Audit Logs ====================

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Private (super_admin, admin)
 */
router.get(
  '/audit-logs',
  authorizeRole(['super_admin', 'admin']),
  query('action')
    .optional()
    .isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'VERIFY', 'REVOKE', 'LOGIN', 'LOGOUT']),
  query('page')
    .optional()
    .isInt({ min: 1 }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { action, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (action) filter.action = action;

      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'username email')
        .lean();

      const total = await AuditLog.countDocuments(filter);

      res.json({
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        logs,
      });
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      res.status(500).json({
        error: 'Fetch Failed',
        message: 'Failed to fetch audit logs',
      });
    }
  }
);

export default router;
