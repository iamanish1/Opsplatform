'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { Talent } from '@/services/talent.service';
import Link from 'next/link';

interface TalentCardProps {
  talent: Talent;
  onRequestInterview: () => void;
}

const getBadgeColor = (badge: string) => {
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

export function TalentCard({ talent, onRequestInterview }: TalentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {talent.avatar && (
              <img
                src={talent.avatar}
                alt={talent.name || talent.githubUsername || 'Developer'}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <CardTitle>{talent.name || talent.githubUsername || 'Developer'}</CardTitle>
              <CardDescription>
                {talent.githubUsername && `@${talent.githubUsername}`}
                {talent.location && ` • ${talent.location}`}
              </CardDescription>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getBadgeColor(talent.badge)}`}>
            {talent.badge}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {talent.portfolio?.score && (
          <div>
            <div className="text-2xl font-bold">{talent.portfolio.score.totalScore}/100</div>
            <div className="text-xs text-muted-foreground">Trust Score</div>
          </div>
        )}

        {talent.latestSubmission?.project && (
          <div>
            <div className="text-sm font-semibold mb-1">Latest Project</div>
            <div className="text-sm text-muted-foreground">{talent.latestSubmission.project.title}</div>
            {talent.latestSubmission.project.tags && talent.latestSubmission.project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {talent.latestSubmission.project.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {talent.portfolio?.slug && (
            <Link href={`/u/${talent.githubUsername}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Portfolio
              </Button>
            </Link>
          )}
          <Button size="sm" onClick={onRequestInterview}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Request Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

