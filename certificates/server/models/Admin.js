import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash'],
      index: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
      index: true,
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    role: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator', 'viewer'],
      default: 'admin',
    },

    permissions: {
      canCreateCertificates: { type: Boolean, default: true },
      canEditCertificates: { type: Boolean, default: true },
      canDeleteCertificates: { type: Boolean, default: false },
      canRevokeCertificates: { type: Boolean, default: true },
      canViewAnalytics: { type: Boolean, default: true },
      canManageAdmins: { type: Boolean, default: false },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: Date,
    lastLoginIP: String,

    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttemptAt: Date,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
    },

    // Audit trail
    createdBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Method to check if account is locked
adminSchema.methods.isLocked = function () {
  return this.loginAttempts.count >= 5 && new Date() - this.loginAttempts.lastAttemptAt < 30 * 60 * 1000; // 30 minutes
};

// Method to record failed login
adminSchema.methods.recordFailedLogin = async function (ip) {
  this.loginAttempts.count += 1;
  this.loginAttempts.lastAttemptAt = new Date();
  this.lastLoginIP = ip;
  return this.save();
};

// Method to record successful login
adminSchema.methods.recordSuccessfulLogin = async function (ip) {
  this.loginAttempts.count = 0;
  this.lastLogin = new Date();
  this.lastLoginIP = ip;
  return this.save();
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
