'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, ExternalLink } from 'lucide-react';
import { portfolioService } from '@/services/portfolio.service';
import { PortfolioViewer } from '@/components/portfolio/PortfolioViewer';
import Link from 'next/link';

export default function PortfolioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfolioService.getUserPortfolios(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const portfolios = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Portfolios</h1>
        <p className="text-muted-foreground">
          View and manage your published portfolios
        </p>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No portfolios yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete a project submission to generate your portfolio
            </p>
            <Link href="/dashboard/project">
              <button className="text-primary hover:underline">
                Browse projects →
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id}>
              <CardHeader>
                <CardTitle>{portfolio.portfolioJson?.project?.title || 'Portfolio'}</CardTitle>
                <CardDescription>
                  {portfolio.portfolioJson?.header?.githubUsername && (
                    <Link
                      href={`/u/${portfolio.portfolioJson.header.githubUsername}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View public portfolio <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioViewer portfolio={portfolio} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

