'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, ExternalLink, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Submission } from '@/services/submissions.service';

interface SubmissionCardProps {
  submission: Submission;
}

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

const getBadgeColor = (badge?: string) => {
  switch (badge) {
    case 'GREEN':
      return 'bg-green-500';
    case 'YELLOW':
      return 'bg-yellow-500';
    case 'RED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export function SubmissionCard({ submission }: SubmissionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{submission.project?.title || 'Project'}</CardTitle>
            <CardDescription>
              Started {new Date(submission.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(submission.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission.repoUrl && (
          <div>
            <a
              href={submission.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View repository <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {submission.score && (
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-bold">{submission.score.totalScore}/100</div>
              <div className="text-xs text-muted-foreground">Total Score</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getBadgeColor(submission.score.badge)}`}>
              {submission.score.badge}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {submission.status === 'REVIEWED' && submission.score && (
            <Link href={`/dashboard/score/${submission.id}`}>
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Score
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

