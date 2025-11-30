'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { companyService } from '@/services/company.service';
import { PortfolioViewer } from '@/components/portfolio/PortfolioViewer';
import { InterviewRequestModal } from '@/components/company/InterviewRequestModal';
import { useState } from 'react';

export default function DeveloperPage() {
  const params = useParams();
  const developerId = params.id as string;
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  // In a real app, we'd have an endpoint to get developer by ID
  // For now, we'll use a placeholder
  const { data, isLoading } = useQuery({
    queryKey: ['developer', developerId],
    queryFn: async () => {
      // This would call an actual API endpoint
      // For now, return mock data
      return { success: true, data: null };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/company/talent-feed" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to talent feed
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Developer Profile</h1>
            <p className="text-muted-foreground mt-2">
              View developer portfolio and request interview
            </p>
          </div>
          <Button onClick={() => setShowInterviewModal(true)}>
            Request Interview
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Developer profile and portfolio would be displayed here.
            This would typically show their portfolio data, scores, and project history.
          </p>
        </CardContent>
      </Card>

      {showInterviewModal && (
        <InterviewRequestModal
          userId={developerId}
          onClose={() => setShowInterviewModal(false)}
        />
      )}
    </div>
  );
}

