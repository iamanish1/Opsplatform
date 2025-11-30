'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Portfolio } from '@/services/portfolio.service';

interface PortfolioViewerProps {
  portfolio: Portfolio;
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

export function PortfolioViewer({ portfolio }: PortfolioViewerProps) {
  const portfolioData = portfolio.portfolioJson;

  if (!portfolioData) {
    return <div className="text-muted-foreground">No portfolio data available</div>;
  }

  return (
    <div className="space-y-6">
      {portfolioData.header && (
        <div className="flex items-center gap-4">
          {portfolioData.header.avatar && (
            <img
              src={portfolioData.header.avatar}
              alt={portfolioData.header.name || 'User'}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h3 className="text-xl font-semibold">{portfolioData.header.name || 'Developer'}</h3>
            {portfolioData.header.githubUsername && (
              <p className="text-muted-foreground">@{portfolioData.header.githubUsername}</p>
            )}
            {portfolioData.header.location && (
              <p className="text-sm text-muted-foreground">{portfolioData.header.location}</p>
            )}
          </div>
        </div>
      )}

      {portfolioData.score && (
        <Card>
          <CardHeader>
            <CardTitle>Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{portfolioData.score.totalScore}/100</div>
              <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getBadgeColor(portfolioData.score.badge)}`}>
                {portfolioData.score.badge}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {portfolioData.project && (
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold mb-2">{portfolioData.project.title}</h4>
            <p className="text-muted-foreground">{portfolioData.project.description}</p>
            {portfolioData.project.repoUrl && (
              <a
                href={portfolioData.project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View repository
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {portfolioData.review && (
        <Card>
          <CardHeader>
            <CardTitle>Review Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{portfolioData.review.summary}</p>
            {portfolioData.review.highlights && portfolioData.review.highlights.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {portfolioData.review.highlights.map((highlight: string, index: number) => (
                  <li key={index} className="text-sm">{highlight}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

