const prisma = require('../prisma/client');

/**
 * Create interview request
 * @param {Object} requestData - Interview request data
 * @param {string} requestData.companyId - Company ID
 * @param {string} requestData.developerId - Developer user ID
 * @param {string} requestData.submissionId - Submission ID (optional)
 * @param {string} requestData.position - Position they are hiring for
 * @param {string} requestData.message - Message to candidate (optional)
 * @returns {Promise<Object>} Created interview request
 */
async function create(requestData) {
  const { companyId, developerId, submissionId, position, message } = requestData;

  return prisma.interviewRequest.create({
    data: {
      companyId,
      developerId,
      submissionId,
      position,
      message,
      status: 'PENDING',
    },
    include: {
      company: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
          avatar: true,
        },
      },
      submission: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Find interview request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<Object|null>} Interview request or null
 */
async function findById(requestId) {
  return prisma.interviewRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      company: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
          avatar: true,
        },
      },
      submission: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Find interview requests by company ID
 * @param {string} companyId - Company ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Array>} Array of interview requests
 */
async function findByCompanyId(companyId, filters = {}) {
  const where = {
    companyId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.interviewRequest.findMany({
    where,
    include: {
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
          avatar: true,
        },
      },
      submission: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Find interview requests by developer ID
 * @param {string} developerId - Developer user ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Array>} Array of interview requests
 */
async function findByDeveloperId(developerId, filters = {}) {
  const where = {
    developerId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.interviewRequest.findMany({
    where,
    include: {
      company: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      submission: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Update interview request status
 * @param {string} requestId - Request ID
 * @param {string} status - New status (PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED)
 * @returns {Promise<Object>} Updated interview request
 */
async function updateStatus(requestId, status) {
  return prisma.interviewRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status,
    },
    include: {
      company: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
          avatar: true,
        },
      },
      submission: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Find interview requests by status (for admin)
 * @param {string} status - Status to filter by
 * @returns {Promise<Array>} Array of interview requests
 */
async function findByStatus(status) {
  return prisma.interviewRequest.findMany({
    where: {
      status,
    },
    include: {
      company: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
          avatar: true,
        },
      },
      submission: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
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
  findById,
  findByCompanyId,
  findByDeveloperId,
  updateStatus,
  findByStatus,
};

