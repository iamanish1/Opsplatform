'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { interviewService } from '@/services/interview.service';
import { toast } from 'sonner';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACCEPTED':
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Accepted</Badge>;
    case 'REJECTED':
      return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-blue-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function InterviewsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['interview-requests'],
    queryFn: () => interviewService.getMyRequests(),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => interviewService.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-requests'] });
      toast.success('Interview request accepted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to accept request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => interviewService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-requests'] });
      toast.success('Interview request rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to reject request');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const requests = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Requests</h1>
        <p className="text-muted-foreground">
          Manage your interview requests from companies
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No interview requests</h3>
            <p className="text-muted-foreground">
              Companies will send you interview requests here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      {request.company?.companyName || 'Company'}
                    </CardTitle>
                    <CardDescription>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                {request.message && (
                  <p className="text-muted-foreground mb-4">{request.message}</p>
                )}
                {request.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

