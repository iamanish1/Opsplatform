'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FolderKanban, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { projectsService } from '@/services/projects.service';
import { StartProjectModal } from '@/components/projects/StartProjectModal';
import { useState } from 'react';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [showStartModal, setShowStartModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getProject(projectId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const project = data?.data;

  if (!project) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/project" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Project not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/project" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-muted-foreground mt-2">{project.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.starterRepo && (
            <div>
              <h3 className="font-semibold mb-2">Starter Repository</h3>
              <a
                href={project.starterRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                {project.starterRepo} <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {project.tasksJson && (
            <div>
              <h3 className="font-semibold mb-2">Tasks</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {Array.isArray(project.tasksJson) ? (
                  project.tasksJson.map((task: string, index: number) => (
                    <li key={index}>{task}</li>
                  ))
                ) : (
                  <li>No tasks specified</li>
                )}
              </ul>
            </div>
          )}

          {project.tags && project.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm px-2 py-1 bg-secondary rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={() => setShowStartModal(true)} size="lg">
              Start Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {showStartModal && (
        <StartProjectModal
          projectId={projectId}
          onClose={() => setShowStartModal(false)}
        />
      )}
    </div>
  );
}

