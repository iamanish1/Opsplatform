'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { scoreService } from '@/services/score.service';
import { ScoreBars } from '@/components/score/ScoreBars';
import { ScoreRing } from '@/components/score/ScoreRing';
import { EvidencePanel } from '@/components/score/EvidencePanel';

export default function ScorePage() {
  const params = useParams();
  const submissionId = params.submissionId as string;

  const { data, isLoading } = useQuery({
    queryKey: ['score', submissionId],
    queryFn: () => scoreService.getScore(submissionId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const score = data?.data;

  if (!score) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/submission" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to submissions
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Score not found</h1>
          <p className="text-muted-foreground">This submission may not have been reviewed yet.</p>
        </div>
      </div>
    );
  }

  const scoreCategories = [
    { name: 'Code Quality', value: score.codeQuality },
    { name: 'Problem Solving', value: score.problemSolving },
    { name: 'Bug Risk', value: score.bugRisk },
    { name: 'DevOps Execution', value: score.devopsExecution },
    { name: 'Optimization', value: score.optimization },
    { name: 'Documentation', value: score.documentation },
    { name: 'Git Maturity', value: score.gitMaturity },
    { name: 'Collaboration', value: score.collaboration },
    { name: 'Delivery Speed', value: score.deliverySpeed },
    { name: 'Security', value: score.security },
  ];

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/submission" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to submissions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Score Breakdown</h1>
            <p className="text-muted-foreground mt-2">
              Detailed analysis of your submission
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{score.totalScore}/100</div>
            <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getBadgeColor(score.badge)}`}>
              {score.badge}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
            <CardDescription>Visual representation</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreRing score={score.totalScore} badge={score.badge} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>10 scoring categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBars categories={scoreCategories} />
          </CardContent>
        </Card>
      </div>

      {score.detailsJson?.evidence && score.detailsJson.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence & Analysis</CardTitle>
            <CardDescription>Detailed evidence supporting the scores</CardDescription>
          </CardHeader>
          <CardContent>
            <EvidencePanel evidence={score.detailsJson.evidence} />
          </CardContent>
        </Card>
      )}

      {score.detailsJson?.appliedRules && score.detailsJson.appliedRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Applied Rules</CardTitle>
            <CardDescription>Rule-based adjustments made to scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {score.detailsJson.appliedRules.map((rule: any, index: number) => (
                <div key={index} className="p-3 bg-secondary rounded-lg">
                  <div className="font-semibold">{rule.rule}</div>
                  <div className="text-sm text-muted-foreground">
                    {rule.category}: {rule.action} - {rule.reason}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

