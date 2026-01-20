import express from 'express';
import { query, body, validationResult } from 'express-validator';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// ==================== Public Routes ====================

/**
 * @route   GET /api/certificates/verify/:certificateId
 * @desc    Verify a certificate by ID
 * @access  Public
 * @security Rate limited
 */
router.get(
  '/verify/:certificateId',
  query('certificateId')
    .trim()
    .toUpperCase()
    .matches(/^\d{7}$/)
    .withMessage('Invalid certificate ID format'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { certificateId } = req.params;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Find certificate
      const certificate = await Certificate.findByCertificateId(certificateId);

      if (!certificate) {
        // Log failed verification attempt
        await AuditLog.create({
          action: 'VERIFY',
          entityType: 'CERTIFICATE',
          entityId: certificateId,
          ipAddress: clientIP,
          status: 'FAILED',
          errorMessage: 'Certificate not found',
        });

        return res.status(404).json({
          error: 'Not Found',
          message: 'Certificate not found in the system',
          verified: false,
        });
      }

      // Check if revoked
      if (certificate.isRevoked) {
        await AuditLog.create({
          action: 'VERIFY',
          entityType: 'CERTIFICATE',
          entityId: certificateId,
          ipAddress: clientIP,
          status: 'FAILED',
          errorMessage: 'Certificate revoked',
        });

        return res.status(410).json({
          error: 'Revoked',
          message: 'This certificate has been revoked',
          verified: false,
          revokedAt: certificate.revokedAt,
          revocationReason: certificate.revocationReason,
        });
      }

      // Verify and track
      certificate.verify();
      certificate.trackIP(clientIP);
      await certificate.save();

      // Log successful verification
      await AuditLog.create({
        action: 'VERIFY',
        entityType: 'CERTIFICATE',
        entityId: certificateId,
        ipAddress: clientIP,
        status: 'SUCCESS',
      });

      // Return certificate data (without sensitive fields)
      res.json({
        verified: true,
        certificate: {
          certificateId: certificate.certificateId,
          recipientName: certificate.recipientName,
          program: certificate.program,
          programCategory: certificate.programCategory,
          awardDate: certificate.awardDate,
          issuedBy: certificate.issuedBy,
          year: certificate.year,
          serialNumber: certificate.serialNumber,
          verificationCount: certificate.verificationCount,
        },
      });
    } catch (error) {
      console.error('Certificate verification error:', error);
      res.status(500).json({
        error: 'Verification Error',
        message: 'Failed to verify certificate',
        verified: false,
      });
    }
  }
);

/**
 * @route   GET /api/certificates/check/:certificateId
 * @desc    Quick check if certificate exists (no tracking)
 * @access  Public
 */
router.get(
  '/check/:certificateId',
  query('certificateId')
    .trim()
    .toUpperCase()
    .matches(/^\d{7}$/)
    .withMessage('Invalid certificate ID format'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { certificateId } = req.params;

      const exists = await Certificate.exists({
        certificateId,
        isRevoked: false,
      });

      res.json({
        exists: !!exists,
        certificateId,
      });
    } catch (error) {
      console.error('Certificate check error:', error);
      res.status(500).json({
        error: 'Check Error',
        message: 'Failed to check certificate',
      });
    }
  }
);

/**
 * @route   GET /api/certificates/search
 * @desc    Search certificates (limited to prevent enumeration)
 * @access  Public
 * @query   recipient: partial name match
 */
router.get(
  '/search',
  query('recipient')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Invalid characters in search term'),
  query('program')
    .optional()
    .isIn([
      'Web Development',
      'Mobile Development',
      'Machine Learning',
      'Algorithms & Data Structures',
      'Programming Fundamentals',
      'Full Stack Development',
      'Cloud Computing',
      'Cybersecurity',
    ])
    .withMessage('Invalid program specified'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { recipient, program } = req.query;
      const query = { isRevoked: false };

      // Only allow authenticated users to search by name
      if (recipient && req.user) {
        query.recipientName = new RegExp(sanitizeInput(recipient), 'i');
      }

      if (program) {
        query.program = program;
      }

      const certificates = await Certificate.find(query)
        .select('certificateId program awardDate')
        .limit(20)
        .lean();

      res.json({
        count: certificates.length,
        results: certificates,
      });
    } catch (error) {
      console.error('Certificate search error:', error);
      res.status(500).json({
        error: 'Search Error',
        message: 'Failed to search certificates',
      });
    }
  }
);

export default router;
