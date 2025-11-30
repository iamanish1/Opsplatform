import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const handlers = [
  // Auth endpoints
  http.get(`${API_BASE_URL}/api/auth/status`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'STUDENT',
        badge: 'GREEN',
      },
    });
  }),

  // Lessons endpoints
  http.get(`${API_BASE_URL}/api/lessons`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          title: 'Introduction to DevOps',
          content: 'Learn the basics of DevOps',
          order: 1,
          completed: false,
        },
        {
          id: '2',
          title: 'CI/CD Pipelines',
          content: 'Build continuous integration pipelines',
          order: 2,
          completed: true,
        },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/api/lessons/:id/complete`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        completed: true,
        completedAt: new Date().toISOString(),
      },
    });
  }),

  // Projects endpoints
  http.get(`${API_BASE_URL}/api/projects/:projectId`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        title: 'CI/CD Pipeline Setup',
        description: 'Set up a complete CI/CD pipeline',
        starterRepo: 'https://github.com/example/starter',
        tags: ['DevOps', 'CI/CD'],
      },
    });
  }),

  http.post(`${API_BASE_URL}/api/projects/:projectId/start`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        submission: {
          id: '1',
          projectId: '1',
          repoUrl: 'https://github.com/user/repo',
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Submissions endpoints
  http.get(`${API_BASE_URL}/api/submissions/:submissionId`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        projectId: '1',
        repoUrl: 'https://github.com/user/repo',
        status: 'REVIEWED',
        score: {
          id: '1',
          totalScore: 85,
          badge: 'GREEN',
        },
      },
    });
  }),

  // Score endpoints
  http.get(`${API_BASE_URL}/api/score/:submissionId`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        submissionId: '1',
        codeQuality: 8,
        problemSolving: 9,
        bugRisk: 2,
        devopsExecution: 8,
        optimization: 7,
        documentation: 8,
        gitMaturity: 9,
        collaboration: 8,
        deliverySpeed: 9,
        security: 8,
        totalScore: 85,
        badge: 'GREEN',
        detailsJson: {
          evidence: [
            {
              category: 'Code Quality',
              description: 'Well-structured code with good practices',
              githubLink: 'https://github.com/user/repo/pull/1',
            },
          ],
        },
      },
    });
  }),

  // Notifications endpoints
  http.get(`${API_BASE_URL}/api/notifications`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        notifications: [
          {
            id: '1',
            title: 'New Score Available',
            message: 'Your submission has been reviewed',
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  }),

  http.get(`${API_BASE_URL}/api/notifications/unread-count`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        count: 1,
      },
    });
  }),
];

