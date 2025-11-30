'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { projectsService } from '@/services/projects.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface StartProjectModalProps {
  projectId: string;
  onClose: () => void;
}

export function StartProjectModal({ projectId, onClose }: StartProjectModalProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const validateGitHubUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'github.com' && parsed.pathname.split('/').length >= 3;
    } catch {
      return false;
    }
  };

  const startMutation = useMutation({
    mutationFn: (url: string) => projectsService.startProject(projectId, { repoUrl: url }),
    onSuccess: (data) => {
      if (data.success && data.data) {
        toast.success('Project started successfully!');
        queryClient.invalidateQueries({ queryKey: ['submissions'] });
        onClose();
        router.push(`/dashboard/submission`);
      } else {
        toast.error(data.error?.message || 'Failed to start project');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to start project');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!repoUrl.trim()) {
      setError('Repository URL is required');
      return;
    }

    if (!validateGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)');
      return;
    }

    startMutation.mutate(repoUrl);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Project</DialogTitle>
          <DialogDescription>
            Enter your GitHub repository URL to start working on this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="repoUrl">GitHub Repository URL</Label>
            <Input
              id="repoUrl"
              type="url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={startMutation.isPending}
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={startMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={startMutation.isPending}>
              {startMutation.isPending ? 'Starting...' : 'Start Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

