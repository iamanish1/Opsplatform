const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ── Lessons ──────────────────────────────────────────────────────────────
  const lessons = [
    { title: 'Introduction to DevOps', content: 'Learn the fundamentals of DevOps, its principles, and why it matters in modern software development.', order: 1 },
    { title: 'Version Control with Git', content: 'Master Git basics: commits, branches, merges, and collaborative workflows.', order: 2 },
    { title: 'CI/CD Pipeline Basics', content: 'Understand Continuous Integration and Continuous Deployment concepts and their benefits.', order: 3 },
    { title: 'Docker Fundamentals', content: 'Learn containerization with Docker: images, containers, Dockerfile, and Docker Compose.', order: 4 },
    { title: 'Kubernetes Introduction', content: 'Get started with Kubernetes: pods, services, deployments, and basic orchestration.', order: 5 },
    { title: 'Infrastructure as Code', content: 'Explore IaC concepts using Terraform and CloudFormation for managing infrastructure.', order: 6 },
    { title: 'Monitoring and Logging', content: 'Set up monitoring with Prometheus, Grafana, and centralized logging with ELK stack.', order: 7 },
    { title: 'Cloud Platforms Overview', content: 'Compare AWS, Azure, and GCP: services, pricing, and use cases.', order: 8 },
    { title: 'Security Best Practices', content: 'Implement security in DevOps: secrets management, vulnerability scanning, and compliance.', order: 9 },
    { title: 'Configuration Management', content: 'Manage server configurations with Ansible, Chef, or Puppet.', order: 10 },
    { title: 'Microservices Architecture', content: 'Design and deploy microservices: patterns, service mesh, and API gateways.', order: 11 },
    { title: 'Serverless Computing', content: 'Build serverless applications with AWS Lambda, Azure Functions, and Google Cloud Functions.', order: 12 },
    { title: 'Database Management', content: 'Database operations in DevOps: migrations, backups, replication, and scaling.', order: 13 },
    { title: 'Testing Strategies', content: 'Implement comprehensive testing: unit, integration, and end-to-end tests in CI/CD.', order: 14 },
    { title: 'DevOps Culture and Collaboration', content: 'Foster a DevOps culture: communication, collaboration, and continuous improvement.', order: 15 },
  ];

  console.log('Seeding lessons...');
  await prisma.lesson.deleteMany({});
  await prisma.lesson.createMany({ data: lessons, skipDuplicates: true });
  console.log(`✓ Seeded ${lessons.length} lessons`);

  // ── Projects ──────────────────────────────────────────────────────────────
  const projects = [
    {
      title: 'Build a REST API with Authentication',
      slug: 'rest-api-auth',
      domain: 'backend',
      tags: JSON.stringify(['backend', 'api', 'node', 'express', 'jwt']),
      starterRepo: 'https://github.com/devhubs-io/starter-rest-api',
      description: 'Build a production-ready REST API using Node.js and Express with JWT authentication, role-based access control, rate limiting, and proper error handling. Recruiters use this project to verify you can build secure, scalable backend services.',
      hasHiddenTests: false,
      tasksJson: JSON.stringify([
        { id: 'task-1', title: 'Set up Express server with middleware', description: 'Configure Express with CORS, helmet, and body-parser. Add a health check endpoint.', points: 10 },
        { id: 'task-2', title: 'User registration and login', description: 'Implement POST /auth/register and POST /auth/login with bcrypt password hashing.', points: 20 },
        { id: 'task-3', title: 'JWT access + refresh token flow', description: 'Issue short-lived access tokens and long-lived refresh tokens. Implement /auth/refresh and /auth/logout.', points: 20 },
        { id: 'task-4', title: 'Protected routes with role-based access', description: 'Add auth middleware. Implement ADMIN and USER roles. Protect at least 3 routes.', points: 20 },
        { id: 'task-5', title: 'Input validation and error handling', description: 'Validate all inputs with express-validator. Return consistent error responses with status codes.', points: 15 },
        { id: 'task-6', title: 'Write integration tests', description: 'Cover auth flows, protected routes, and error cases using Jest + Supertest.', points: 15 },
      ]),
    },
    {
      title: 'Build a CI/CD Pipeline for a Web Application',
      slug: 'cicd-pipeline',
      domain: 'devops',
      tags: JSON.stringify(['devops', 'docker', 'ci/cd', 'github-actions']),
      starterRepo: 'https://github.com/devhubs-io/starter-cicd-pipeline',
      description: 'Create a complete CI/CD pipeline for a Node.js web application using GitHub Actions and Docker. You will set up automated testing, containerized builds, and multi-environment deployment. This project verifies real DevOps execution skills.',
      hasHiddenTests: false,
      tasksJson: JSON.stringify([
        { id: 'task-1', title: 'Set up GitHub Actions workflow', description: 'Create a workflow file that triggers on push to main and runs lint + tests.', points: 10 },
        { id: 'task-2', title: 'Configure automated testing in CI', description: 'Add test steps that run unit and integration tests. Fail the pipeline on test failure.', points: 15 },
        { id: 'task-3', title: 'Build and push Docker image', description: 'Create a Dockerfile. Configure the workflow to build the image and push to Docker Hub or GHCR.', points: 20 },
        { id: 'task-4', title: 'Deploy to staging environment', description: 'Set up automated deployment to a staging environment on push to main.', points: 20 },
        { id: 'task-5', title: 'Add production deployment with approval', description: 'Configure production deployment gated by a manual approval step.', points: 20 },
        { id: 'task-6', title: 'Implement health checks and monitoring', description: 'Add a /health endpoint and configure the CI to verify it after deploy.', points: 15 },
      ]),
    },
    {
      title: 'Full-Stack Task Management App',
      slug: 'fullstack-task-manager',
      domain: 'fullstack',
      tags: JSON.stringify(['fullstack', 'react', 'node', 'express', 'api', 'frontend']),
      starterRepo: 'https://github.com/devhubs-io/starter-task-manager',
      description: 'Build a full-stack task management application with a React frontend and Node.js/Express backend. Features include user authentication, real-time updates, and team collaboration. This project demonstrates end-to-end product engineering skills.',
      hasHiddenTests: false,
      tasksJson: JSON.stringify([
        { id: 'task-1', title: 'Backend API for tasks', description: 'Implement CRUD endpoints for tasks: GET /tasks, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id.', points: 20 },
        { id: 'task-2', title: 'User authentication', description: 'Add JWT-based auth. Tasks should be scoped to the authenticated user.', points: 15 },
        { id: 'task-3', title: 'React frontend with task list', description: 'Build a React UI showing the task list. Support add, edit, delete, and mark complete.', points: 20 },
        { id: 'task-4', title: 'Filtering and sorting', description: 'Add filter by status (all/active/completed) and sort by due date or priority.', points: 15 },
        { id: 'task-5', title: 'Optimistic UI updates', description: 'Apply changes immediately in the UI before the API responds. Revert on failure.', points: 15 },
        { id: 'task-6', title: 'Deploy both frontend and backend', description: 'Deploy the backend to Railway/Render and the frontend to Vercel/Netlify. Include live URLs in README.', points: 15 },
      ]),
    },
    {
      title: 'Real-Time Chat Application',
      slug: 'realtime-chat',
      domain: 'fullstack',
      tags: JSON.stringify(['fullstack', 'websocket', 'node', 'react', 'socket.io']),
      starterRepo: 'https://github.com/devhubs-io/starter-realtime-chat',
      description: 'Build a real-time chat application using WebSockets. Users can join rooms, send messages, and see who is online. This project verifies your ability to handle stateful, event-driven server architecture alongside a React frontend.',
      hasHiddenTests: false,
      tasksJson: JSON.stringify([
        { id: 'task-1', title: 'WebSocket server setup', description: 'Set up a Socket.io server. Implement connect, disconnect, and basic message events.', points: 15 },
        { id: 'task-2', title: 'Chat rooms', description: 'Support multiple rooms. Users can join and leave rooms. Messages are scoped to the room.', points: 20 },
        { id: 'task-3', title: 'Online presence', description: 'Track and broadcast who is online in each room. Show the online user list in the UI.', points: 20 },
        { id: 'task-4', title: 'Message persistence', description: 'Store messages in a database and return the last 50 messages when a user joins a room.', points: 20 },
        { id: 'task-5', title: 'React frontend', description: 'Build a React chat UI with a message list, input box, room selector, and online presence indicator.', points: 15 },
        { id: 'task-6', title: 'Handle reconnection gracefully', description: 'Detect dropped connections and reconnect automatically. Show connection status to the user.', points: 10 },
      ]),
    },
    {
      title: 'React Component Library',
      slug: 'react-component-library',
      domain: 'frontend',
      tags: JSON.stringify(['frontend', 'react', 'css', 'storybook', 'npm']),
      starterRepo: 'https://github.com/devhubs-io/starter-component-library',
      description: 'Design and publish a reusable React component library with Storybook documentation, TypeScript types, and automated testing. This project demonstrates frontend engineering depth and the ability to build tools other developers rely on.',
      hasHiddenTests: false,
      tasksJson: JSON.stringify([
        { id: 'task-1', title: 'Project setup with Vite library mode', description: 'Configure Vite to build the library in library mode. Set up TypeScript and Tailwind.', points: 10 },
        { id: 'task-2', title: 'Build core components', description: 'Implement Button, Input, Modal, and Card components with variant props and accessibility attributes.', points: 25 },
        { id: 'task-3', title: 'Add Storybook stories', description: 'Write Storybook stories for all components covering all variants and states.', points: 20 },
        { id: 'task-4', title: 'Write component tests', description: 'Test all components with React Testing Library. Cover render, interaction, and accessibility.', points: 20 },
        { id: 'task-5', title: 'Publish to npm', description: 'Publish the package to npm (or GitHub Packages). Include usage instructions in README.', points: 15 },
        { id: 'task-6', title: 'CI for tests and publish', description: 'Set up GitHub Actions to run tests on every PR and auto-publish on version tag.', points: 10 },
      ]),
    },
    {
      title: 'Containerized Microservices with Docker Compose',
      slug: 'microservices-docker',
      domain: 'devops',
      tags: JSON.stringify(['devops', 'docker', 'microservices', 'api', 'backend']),
      starterRepo: 'https://github.com/devhubs-io/starter-microservices',
      description: 'Break a monolithic app into independent microservices and orchestrate them with Docker Compose. Services communicate via REST and a message queue. This project tests real-world containerization and distributed systems knowledge.',
      hasHiddenTests: false,
      tasksJson: JSON.stringify([
        { id: 'task-1', title: 'Split into 3 services', description: 'Create separate services for auth, users, and orders. Each service runs in its own container.', points: 20 },
        { id: 'task-2', title: 'Docker Compose orchestration', description: 'Write a docker-compose.yml that starts all services, a database, and a message queue together.', points: 20 },
        { id: 'task-3', title: 'Inter-service communication', description: 'Services communicate via REST or a message queue (RabbitMQ/Redis). No direct DB sharing.', points: 20 },
        { id: 'task-4', title: 'API Gateway', description: 'Add an Nginx or Express gateway that routes requests to the correct service.', points: 20 },
        { id: 'task-5', title: 'Health checks and restart policies', description: 'Configure Docker health checks and restart: unless-stopped for all services.', points: 10 },
        { id: 'task-6', title: 'Production docker-compose.prod.yml', description: 'Create a production-ready compose file with resource limits, no dev mounts, and secret management.', points: 10 },
      ]),
    },
  ];

  console.log('Seeding projects...');
  await prisma.project.deleteMany({});

  for (const project of projects) {
    const created = await prisma.project.create({ data: project });
    console.log(`  ✓ ${created.title}`);
  }
  console.log(`✓ Seeded ${projects.length} projects`);

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
