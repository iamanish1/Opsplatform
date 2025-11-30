'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ExternalLink, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { SubmissionCard } from '@/components/projects/SubmissionCard';

// Mock submissions - in real app, this would come from an API
const MOCK_SUBMISSIONS = [
  {
    id: '1',
    projectId: '1',
    repoUrl: 'https://github.com/user/cicd-project',
    status: 'REVIEWED' as const,
    createdAt: '2024-01-15T10:00:00Z',
    project: {
      id: '1',
      title: 'CI/CD Pipeline Setup',
    },
    score: {
      id: '1',
      totalScore: 85,
      badge: 'GREEN' as const,
    },
  },
  {
    id: '2',
    projectId: '2',
    repoUrl: 'https://github.com/user/docker-project',
    status: 'IN_PROGRESS' as const,
    createdAt: '2024-01-20T10:00:00Z',
    project: {
      id: '2',
      title: 'Docker Containerization',
    },
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'REVIEWED':
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Reviewed</Badge>;
    case 'SUBMITTED':
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Submitted</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
    case 'NOT_STARTED':
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Not Started</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground">
          View and track your project submissions
        </p>
      </div>

      <div className="space-y-4">
        {MOCK_SUBMISSIONS.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}

        {MOCK_SUBMISSIONS.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a project to create your first submission
              </p>
              <Link href="/dashboard/project">
                <button className="text-primary hover:underline">
                  Browse projects →
                </button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

