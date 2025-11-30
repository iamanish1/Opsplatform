'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FolderKanban, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { projectsService } from '@/services/projects.service';
import { StartProjectModal } from '@/components/projects/StartProjectModal';
import { useState } from 'react';

// Mock projects list - in real app, this would come from an API
const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'CI/CD Pipeline Setup',
    description: 'Set up a complete CI/CD pipeline using GitHub Actions',
    starterRepo: 'https://github.com/example/cicd-starter',
    tags: ['DevOps', 'CI/CD', 'GitHub Actions'],
  },
  {
    id: '2',
    title: 'Docker Containerization',
    description: 'Containerize a web application using Docker',
    starterRepo: 'https://github.com/example/docker-starter',
    tags: ['Docker', 'Containerization'],
  },
];

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Start a project to build your DevOps portfolio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_PROJECTS.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FolderKanban className="h-8 w-8 text-primary mb-2" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProject(project.id)}
                >
                  Start Project
                </Button>
              </div>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription className="line-clamp-3">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              {project.starterRepo && (
                <a
                  href={project.starterRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View starter repo <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-secondary rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProject && (
        <StartProjectModal
          projectId={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

