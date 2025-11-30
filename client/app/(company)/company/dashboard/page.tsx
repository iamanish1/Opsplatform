'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageSquare, Briefcase } from 'lucide-react';
import { companyService } from '@/services/company.service';
import { interviewService } from '@/services/interview.service';

export default function CompanyDashboardPage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companyService.getProfile(),
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ['company-interviews'],
    queryFn: () => interviewService.getMyRequests(),
  });

  if (profileLoading || interviewsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pendingInterviews = interviews?.data?.filter(i => i.status === 'PENDING').length || 0;
  const acceptedInterviews = interviews?.data?.filter(i => i.status === 'ACCEPTED').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {profile?.data?.companyName || 'Company'} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your talent search and interviews
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent Feed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Available candidates</p>
            <a href="/company/talent-feed" className="text-sm text-primary hover:underline mt-2 inline-block">
              Browse talent →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInterviews}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
            <a href="/company/interviews" className="text-sm text-primary hover:underline mt-2 inline-block">
              View requests →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedInterviews}</div>
            <p className="text-xs text-muted-foreground">Confirmed interviews</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

