const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isRootAdmin: {
    type: Boolean,
    default: false
  },
  permissions: [{
    resource: {
      type: String,
      enum: ['patients', 'doctors', 'hospitals', 'admins'],
      required: true
    },
    actions: [{
      type: String,
      enum: ['read', 'create', 'update', 'delete'],
      required: true
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Security tracking
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  lastLoginUserAgent: {
    type: String
  },
  lastFailedLoginAt: {
    type: Date
  },
  lastFailedLoginIP: {
    type: String
  },
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  // Session management
  lastActivity: {
    type: Date
  },
  sessionToken: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
adminSchema.index({ email: 1 });
adminSchema.index({ isRootAdmin: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdBy: 1 });
adminSchema.index({ lastLogin: -1 });

// Pre-save middleware to set root admin flag and default permissions
adminSchema.pre('save', async function(next) {
  // Set root admin flag for admin@gmail.com
  if (this.email === 'admin@gmail.com') {
    this.isRootAdmin = true;
  }
  
  // Set default permissions for new regular admins
  if (this.isNew && !this.isRoot() && (!this.permissions || this.permissions.length === 0)) {
    this.setDefaultPermissions();
  }
  
  // Hash password if modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to update last login with security tracking
adminSchema.methods.updateLastLogin = async function(ipAddress, userAgent) {
  this.lastLogin = new Date();
  this.lastLoginIP = ipAddress;
  this.lastLoginUserAgent = userAgent;
  this.failedLoginAttempts = 0; // Reset failed attempts on successful login
  this.accountLockedUntil = undefined;
  return await this.save();
};

// Method to check if admin is root admin
adminSchema.methods.isRoot = function() {
  return this.email === 'admin@gmail.com' || this.isRootAdmin;
};

// Method to check if admin has specific permission
adminSchema.methods.hasPermission = function(resource, action) {
  // Root admin has all permissions
  if (this.isRoot()) {
    return true;
  }
  
  // Check specific permissions
  const permission = this.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

// Method to set default permissions for regular admin
adminSchema.methods.setDefaultPermissions = function() {
  if (!this.isRoot()) {
    this.permissions = [
      {
        resource: 'patients',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'doctors',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'hospitals',
        actions: ['read', 'create', 'update', 'delete']
      }
    ];
  }
};

// Method to handle failed login attempts
adminSchema.methods.handleFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return await this.save();
};

// Method to check if account is locked
adminSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
};

// Method to update session activity
adminSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  return await this.save();
};

// Method to check if session is expired
adminSchema.methods.isSessionExpired = function(timeoutMinutes = 30) {
  if (!this.lastActivity) {
    return true;
  }
  
  const now = new Date();
  const sessionExpiry = new Date(this.lastActivity.getTime() + (timeoutMinutes * 60 * 1000));
  
  return now >= sessionExpiry;
};

// Method to invalidate session
adminSchema.methods.invalidateSession = async function() {
  this.sessionToken = undefined;
  this.lastActivity = undefined;
  return await this.save();
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
