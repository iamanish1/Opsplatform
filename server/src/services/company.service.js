/**
 * Company Service
 * Handles company authentication and profile management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepo = require('../repositories/user.repo');
const companyRepo = require('../repositories/company.repo');

/**
 * Company signup with email/password
 * @param {string} email - Company email
 * @param {string} password - Plain text password
 * @param {string} companyName - Company name
 * @returns {Promise<Object>} User, company profile, and JWT token
 */
async function signup(email, password, companyName) {
  // Check if email already exists
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user with COMPANY role
  const user = await userRepo.createWithPassword({
    email,
    password: hashedPassword,
    role: 'COMPANY',
    name: companyName,
  });

  // Create company profile
  const company = await companyRepo.create({
    userId: user.id,
    companyName,
  });

  // Emit CompanySignup event
  try {
    const eventBus = require('../utils/eventBus');
    eventBus.emit('CompanySignup', {
      companyId: company.id,
      userId: user.id,
    });
  } catch (eventError) {
    console.warn(`[Company Service] Failed to emit CompanySignup event: ${eventError.message}`);
    // Don't fail signup if event emission fails
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    company: {
      id: company.id,
      companyName: company.companyName,
      website: company.website,
      logo: company.logo,
    },
    token,
  };
}

/**
 * Company login with email/password
 * @param {string} email - Company email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} User, company profile, and JWT token
 */
async function login(email, password) {
  // Find user by email (including password)
  const user = await userRepo.findByEmailWithPassword(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is a company
  if (user.role !== 'COMPANY') {
    throw new Error('This account is not a company account');
  }

  // Check if user has password (not GitHub OAuth only)
  if (!user.password) {
    throw new Error('This account does not have a password. Please use GitHub OAuth or reset password.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Get company profile
  const company = await companyRepo.findByUserId(user.id);
  if (!company) {
    throw new Error('Company profile not found');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    company: {
      id: company.id,
      companyName: company.companyName,
      website: company.website,
      logo: company.logo,
      about: company.about,
      industry: company.industry,
      location: company.location,
      teamSize: company.teamSize,
      hiringNeeds: company.hiringNeeds,
    },
    token,
  };
}

/**
 * Get company profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Company profile
 */
async function getProfile(userId) {
  const company = await companyRepo.findByUserId(userId);
  if (!company) {
    throw new Error('Company profile not found');
  }

  return company;
}

/**
 * Update company profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated company profile
 */
async function updateProfile(userId, profileData) {
  const company = await companyRepo.findByUserId(userId);
  if (!company) {
    throw new Error('Company profile not found');
  }

  // Update company profile
  const updated = await companyRepo.update(company.id, profileData);

  return updated;
}

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
};

