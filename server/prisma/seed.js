const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed Lessons (10-15 micro-lessons)
  const lessons = [
    {
      title: 'Introduction to DevOps',
      content: 'Learn the fundamentals of DevOps, its principles, and why it matters in modern software development.',
      order: 1,
    },
    {
      title: 'Version Control with Git',
      content: 'Master Git basics: commits, branches, merges, and collaborative workflows.',
      order: 2,
    },
    {
      title: 'CI/CD Pipeline Basics',
      content: 'Understand Continuous Integration and Continuous Deployment concepts and their benefits.',
      order: 3,
    },
    {
      title: 'Docker Fundamentals',
      content: 'Learn containerization with Docker: images, containers, Dockerfile, and Docker Compose.',
      order: 4,
    },
    {
      title: 'Kubernetes Introduction',
      content: 'Get started with Kubernetes: pods, services, deployments, and basic orchestration.',
      order: 5,
    },
    {
      title: 'Infrastructure as Code',
      content: 'Explore IaC concepts using Terraform and CloudFormation for managing infrastructure.',
      order: 6,
    },
    {
      title: 'Monitoring and Logging',
      content: 'Set up monitoring with Prometheus, Grafana, and centralized logging with ELK stack.',
      order: 7,
    },
    {
      title: 'Cloud Platforms Overview',
      content: 'Compare AWS, Azure, and GCP: services, pricing, and use cases.',
      order: 8,
    },
    {
      title: 'Security Best Practices',
      content: 'Implement security in DevOps: secrets management, vulnerability scanning, and compliance.',
      order: 9,
    },
    {
      title: 'Configuration Management',
      content: 'Manage server configurations with Ansible, Chef, or Puppet.',
      order: 10,
    },
    {
      title: 'Microservices Architecture',
      content: 'Design and deploy microservices: patterns, service mesh, and API gateways.',
      order: 11,
    },
    {
      title: 'Serverless Computing',
      content: 'Build serverless applications with AWS Lambda, Azure Functions, and Google Cloud Functions.',
      order: 12,
    },
    {
      title: 'Database Management',
      content: 'Database operations in DevOps: migrations, backups, replication, and scaling.',
      order: 13,
    },
    {
      title: 'Testing Strategies',
      content: 'Implement comprehensive testing: unit, integration, and end-to-end tests in CI/CD.',
      order: 14,
    },
    {
      title: 'DevOps Culture and Collaboration',
      content: 'Foster a DevOps culture: communication, collaboration, and continuous improvement.',
      order: 15,
    },
  ];

  console.log('Seeding lessons...');
  // Clear existing lessons first (optional - comment out if you want to keep existing data)
  await prisma.lesson.deleteMany({});
  
  // Create all lessons
  await prisma.lesson.createMany({
    data: lessons,
    skipDuplicates: true,
  });
  console.log(`✓ Seeded ${lessons.length} lessons`);

  // Seed DevOps Project #1
  const project = {
    title: 'Build a CI/CD Pipeline for a Web Application',
    starterRepo: 'https://github.com/devhubs/starter-web-app',
    description: 'Create a complete CI/CD pipeline for a Node.js web application. This project will teach you how to set up automated testing, building, and deployment using GitHub Actions, Docker, and cloud services.',
    tasksJson: JSON.stringify([
      {
        id: 'task-1',
        title: 'Set up GitHub Actions workflow',
        description: 'Create a basic GitHub Actions workflow file that runs on push to main branch',
        points: 10,
      },
      {
        id: 'task-2',
        title: 'Configure automated testing',
        description: 'Add test steps to the workflow that run unit tests and integration tests',
        points: 15,
      },
      {
        id: 'task-3',
        title: 'Build Docker image',
        description: 'Create a Dockerfile and configure the workflow to build a Docker image',
        points: 15,
      },
      {
        id: 'task-4',
        title: 'Deploy to staging environment',
        description: 'Set up automated deployment to a staging environment (e.g., Heroku, Railway, or AWS)',
        points: 20,
      },
      {
        id: 'task-5',
        title: 'Add production deployment',
        description: 'Configure production deployment with manual approval step',
        points: 20,
      },
      {
        id: 'task-6',
        title: 'Implement monitoring',
        description: 'Add health checks and basic monitoring to the deployed application',
        points: 20,
      },
    ]),
  };

  console.log('Seeding project...');
  // Clear existing projects first (optional - comment out if you want to keep existing data)
  await prisma.project.deleteMany({});
  
  // Create project
  const createdProject = await prisma.project.create({
    data: project,
  });
  console.log(`✓ Seeded project: ${createdProject.title}`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

