'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { portfolioService } from '@/services/portfolio.service';
import { PortfolioViewer } from '@/components/portfolio/PortfolioViewer';
import { ShareButton } from '@/components/portfolio/ShareButton';
import { Metadata } from 'next';

export default function PublicPortfolioPage() {
  const params = useParams();
  const githubUsername = params.githubUsername as string;

  // In a real app, we'd fetch the portfolio by githubUsername
  // For now, we'll try to construct a slug or use a different endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', githubUsername],
    queryFn: async () => {
      // This would need a backend endpoint to get portfolio by githubUsername
      // For now, return null to show the structure
      return { success: false, data: null };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const portfolio = data?.data;

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold mb-2">Portfolio not found</h1>
              <p className="text-muted-foreground">
                The portfolio for @{githubUsername} could not be found.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const portfolioUrl = typeof window !== 'undefined' ? window.location.href : '';
  const portfolioTitle = portfolio.portfolioJson?.project?.title || `${githubUsername}'s Portfolio`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <ShareButton
            portfolioUrl={portfolioUrl}
            portfolioTitle={portfolioTitle}
            portfolioDescription={portfolio.portfolioJson?.review?.summary}
          />
        </div>
        <PortfolioViewer portfolio={portfolio} />
      </div>
    </div>
  );
}

