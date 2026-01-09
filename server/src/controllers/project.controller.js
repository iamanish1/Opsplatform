const projectService = require('../services/project.service');
const submissionService = require('../services/submission.service');
const projectRepo = require('../repositories/project.repo');

/**
 * GET /api/projects
 * Get all projects with user's submission status
 * Auth: Required
 */
async function getProjects(req, res, next) {
  try {
    const userId = req.user.id;
    
    const projects = await projectService.getProjectsWithSubmissionStatus(userId);
    
    res.json(projects);
  } catch (error) {
    // Handle eligibility errors gracefully (user not eligible means all projects are locked)
    if (error.code === 'NOT_ELIGIBLE' || error.code === 'USER_NOT_FOUND') {
      // Still return projects, but they'll all be locked
      try {
        const projects = await projectRepo.findAll();
        const lockedProjects = projects.map((project) => {
          let tags = [];
          if (project.tags) {
            try {
              tags = typeof project.tags === 'string' 
                ? JSON.parse(project.tags) 
                : project.tags;
              if (!Array.isArray(tags)) {
                tags = [];
              }
            } catch {
              tags = [];
            }
          }
          
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            starterRepo: project.starterRepo,
            tags: tags,
            submissionStatus: 'NOT_STARTED',
            locked: true,
            progress: 0,
            submissionId: null,
            createdAt: project.createdAt,
          };
        });
        return res.json(lockedProjects);
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }
    next(error);
  }
}

/**
 * GET /api/projects/:projectId
 * Get project details
 * Auth: Required
 */
async function getProject(req, res, next) {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Project ID is required',
        },
      });
    }
    
    const project = await projectService.getProject(projectId, userId);
    
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
  getProjects,
  getProject,
  startProject,
};
