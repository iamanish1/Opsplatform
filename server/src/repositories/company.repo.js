const prisma = require('../prisma/client');

/**
 * Create company profile
 * @param {Object} companyData - Company data
 * @param {string} companyData.userId - User ID
 * @param {string} companyData.companyName - Company name
 * @param {string} companyData.website - Website URL (optional)
 * @param {string} companyData.logo - Logo URL (optional)
 * @param {string} companyData.about - About text (optional)
 * @param {string} companyData.industry - Industry (optional)
 * @param {string} companyData.location - Location (optional)
 * @param {number} companyData.teamSize - Team size (optional)
 * @param {Array} companyData.hiringNeeds - Hiring needs array (optional)
 * @returns {Promise<Object>} Created company
 */
async function create(companyData) {
  const {
    userId,
    companyName,
    website,
    logo,
    about,
    industry,
    location,
    teamSize,
    hiringNeeds,
  } = companyData;

  return prisma.company.create({
    data: {
      userId,
      companyName,
      website,
      logo,
      about,
      industry,
      location,
      teamSize,
      hiringNeeds: hiringNeeds || null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Find company by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Company or null
 */
async function findByUserId(userId) {
  return prisma.company.findUnique({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Find company by ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object|null>} Company or null
 */
async function findById(companyId) {
  return prisma.company.findUnique({
    where: {
      id: companyId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Update company profile
 * @param {string} companyId - Company ID
 * @param {Object} companyData - Fields to update
 * @returns {Promise<Object>} Updated company
 */
async function update(companyId, companyData) {
  return prisma.company.update({
    where: {
      id: companyId,
    },
    data: companyData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Find all companies (for admin)
 * @returns {Promise<Array>} Array of companies
 */
async function findAll() {
  return prisma.company.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

module.exports = {
  create,
  findByUserId,
  findById,
  update,
  findAll,
};

