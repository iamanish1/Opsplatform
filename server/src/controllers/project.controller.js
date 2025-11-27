const projectService = require('../services/project.service');
const submissionService = require('../services/submission.service');

/**
 * GET /api/projects/:projectId
 * Get project details
 * Auth: Required
 */
async function getProject(req, res, next) {
  try {
    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Project ID is required',
        },
      });
    }
    
    const project = await projectService.getProject(projectId);
    
    res.json(project);
  } catch (error) {
    if (error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
        },
      });
    }
    next(error);
  }
}

/**
 * POST /api/projects/:projectId/start
 * Start a project (create submission)
 * Auth: Required
 */
async function startProject(req, res, next) {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { repoUrl } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Project ID is required',
        },
      });
    }
    
    const result = await submissionService.startSubmission(userId, projectId, repoUrl);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.code === 'NOT_ELIGIBLE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_ELIGIBLE',
          message: error.message || 'User must complete GitHub OAuth and all lessons before starting project',
        },
      });
    }
    
    if (error.code === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
        },
      });
    }
    
    if (error.code === 'INVALID_REPO_URL') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPO_URL',
          message: error.message || 'Invalid repository URL',
        },
      });
    }
    
    next(error);
  }
}

module.exports = {
  getProject,
  startProject,
};
