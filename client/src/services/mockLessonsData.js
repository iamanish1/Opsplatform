/**
 * Mock lessons data
 * Temporary data until backend is connected
 */

const mockLessons = [
  {
    id: '1',
    order: 1,
    title: 'Introduction to DevOps',
    completed: true,
    content: `# Introduction to DevOps

DevOps is a set of practices that combines software development (Dev) and IT operations (Ops). It aims to shorten the development lifecycle and provide continuous delivery with high software quality.

## What is DevOps?

DevOps is a culture, movement, or practice that emphasizes the collaboration and communication of both software developers and other information-technology (IT) professionals while automating the process of software delivery and infrastructure changes.

## Key Principles

- **Automation**: Automate everything you can
- **Continuous Integration**: Merge code changes frequently
- **Continuous Delivery**: Release software in short cycles
- **Monitoring**: Monitor applications and infrastructure
- **Collaboration**: Break down silos between teams

## Benefits

- Faster time to market
- Improved collaboration
- Better quality software
- Increased reliability
- Enhanced security`
  },
  {
    id: '2',
    order: 2,
    title: 'Linux Fundamentals',
    completed: true,
    content: `# Linux Fundamentals

Linux is an open-source operating system that is widely used in DevOps environments. Understanding Linux is essential for any DevOps engineer.

## Basic Commands

- **ls**: List directory contents
- **cd**: Change directory
- **pwd**: Print working directory
- **mkdir**: Create directory
- **rm**: Remove files or directories
- **grep**: Search text patterns
- **find**: Search for files

## File Permissions

Linux uses a permission system with three types:
- Read (r)
- Write (w)
- Execute (x)

These permissions are set for three groups:
- Owner
- Group
- Others

## Process Management

- **ps**: List running processes
- **top**: Display running processes
- **kill**: Terminate processes
- **nohup**: Run commands immune to hangups`
  },
  {
    id: '3',
    order: 3,
    title: 'Git and Version Control',
    completed: false,
    content: `# Git and Version Control

Version control is essential for managing code changes and collaborating with teams. Git is the most popular version control system.

## What is Git?

Git is a distributed version control system that tracks changes in source code during software development.

## Basic Git Commands

- **git init**: Initialize a repository
- **git clone**: Clone a repository
- **git add**: Stage changes
- **git commit**: Commit changes
- **git push**: Push to remote
- **git pull**: Pull from remote
- **git branch**: Manage branches
- **git merge**: Merge branches

## Best Practices

- Commit often with meaningful messages
- Use branches for features
- Keep commits focused and atomic
- Write clear commit messages
- Review code before merging`
  },
  {
    id: '4',
    order: 4,
    title: 'Docker and Containerization',
    completed: false,
    content: `# Docker and Containerization

Docker is a platform for developing, shipping, and running applications using containerization technology.

## What are Containers?

Containers are lightweight, portable, and self-contained units that package an application with all its dependencies.

## Docker Basics

- **docker build**: Build an image
- **docker run**: Run a container
- **docker ps**: List running containers
- **docker images**: List images
- **docker stop**: Stop a container
- **docker rm**: Remove a container

## Dockerfile

A Dockerfile is a text file that contains instructions for building a Docker image. It defines:
- Base image
- Working directory
- Dependencies
- Application code
- Commands to run

## Benefits

- Consistency across environments
- Isolation of applications
- Easy scaling
- Resource efficiency`
  },
  {
    id: '5',
    order: 5,
    title: 'CI/CD Pipelines',
    completed: false,
    content: `# CI/CD Pipelines

Continuous Integration (CI) and Continuous Deployment (CD) are practices that automate the software delivery process.

## Continuous Integration

CI is the practice of frequently integrating code changes into a shared repository, where automated builds and tests are run.

## Continuous Deployment

CD automates the deployment of code changes to production environments after passing automated tests.

## Popular CI/CD Tools

- **Jenkins**: Open-source automation server
- **GitHub Actions**: CI/CD built into GitHub
- **GitLab CI**: Integrated CI/CD in GitLab
- **CircleCI**: Cloud-based CI/CD platform
- **Travis CI**: Hosted CI service

## Pipeline Stages

1. **Build**: Compile and build the application
2. **Test**: Run automated tests
3. **Deploy**: Deploy to staging/production
4. **Monitor**: Monitor application health

## Best Practices

- Automate everything
- Keep builds fast
- Test early and often
- Use version control
- Monitor deployments`
  },
  {
    id: '6',
    order: 6,
    title: 'Kubernetes Basics',
    completed: false,
    content: `# Kubernetes Basics

Kubernetes is an open-source container orchestration platform for automating deployment, scaling, and management of containerized applications.

## What is Kubernetes?

Kubernetes (K8s) is a portable, extensible, open-source platform for managing containerized workloads and services.

## Key Concepts

- **Pods**: Smallest deployable units
- **Services**: Network abstraction for pods
- **Deployments**: Manage replica sets
- **ConfigMaps**: Store configuration data
- **Secrets**: Store sensitive data

## Basic Commands

- **kubectl get**: List resources
- **kubectl create**: Create resources
- **kubectl apply**: Apply configuration
- **kubectl delete**: Delete resources
- **kubectl describe**: Describe resources
- **kubectl logs**: View logs

## Benefits

- Automatic scaling
- Self-healing
- Service discovery
- Load balancing
- Rolling updates`
  },
  {
    id: '7',
    order: 7,
    title: 'Infrastructure as Code',
    completed: false,
    content: `# Infrastructure as Code

Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files.

## What is IaC?

IaC allows you to define infrastructure using code, which can be versioned, reviewed, and automated.

## Popular Tools

- **Terraform**: Infrastructure provisioning tool
- **Ansible**: Configuration management
- **CloudFormation**: AWS infrastructure as code
- **Pulumi**: Modern IaC platform

## Benefits

- Version control for infrastructure
- Consistency across environments
- Faster provisioning
- Reduced errors
- Better documentation

## Best Practices

- Use version control
- Write modular code
- Test infrastructure changes
- Document everything
- Use state management`
  },
  {
    id: '8',
    order: 8,
    title: 'Monitoring and Logging',
    completed: false,
    content: `# Monitoring and Logging

Monitoring and logging are essential for maintaining healthy applications and infrastructure in production environments.

## Monitoring

Monitoring involves collecting metrics and data about your applications and infrastructure to ensure they're performing correctly.

## Logging

Logging involves capturing and storing log messages from applications and systems for analysis and debugging.

## Popular Tools

- **Prometheus**: Monitoring and alerting toolkit
- **Grafana**: Visualization and analytics platform
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Datadog**: Monitoring and analytics platform
- **New Relic**: Application performance monitoring

## Key Metrics

- **CPU Usage**: Processor utilization
- **Memory Usage**: RAM consumption
- **Network Traffic**: Data transfer rates
- **Error Rates**: Application errors
- **Response Times**: API response times

## Best Practices

- Monitor everything
- Set up alerts
- Use dashboards
- Centralize logs
- Analyze trends`
  }
];

/**
 * Get all lessons with user's completion status
 * @returns {Promise<Array>} Array of lessons with completion status
 */
export const getMockLessons = async () => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockLessons]);
    }, 300);
  });
};

/**
 * Get single lesson details with completion status
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Lesson details with completion status
 */
export const getMockLessonDetails = async (lessonId) => {
  // Simulate API delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lesson = mockLessons.find((l) => l.id === lessonId);
      if (lesson) {
        resolve({ ...lesson });
      } else {
        reject(new Error('Lesson not found'));
      }
    }, 300);
  });
};

/**
 * Mark lesson as complete
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Completion result
 */
export const completeMockLesson = async (lessonId) => {
  // Simulate API delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lesson = mockLessons.find((l) => l.id === lessonId);
      if (lesson) {
        lesson.completed = true;
        resolve({ success: true, lesson });
      } else {
        reject(new Error('Lesson not found'));
      }
    }, 500);
  });
};

export default {
  getMockLessons,
  getMockLessonDetails,
  completeMockLesson,
};
