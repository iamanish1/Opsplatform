'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { scoreService } from '@/services/score.service';
import { toast } from 'sonner';

// Mock data - in real app, this would come from an API
export function ProjectTable() {
  const handleReRunScoring = async (submissionId: string) => {
    try {
      // Note: This endpoint may need to be implemented in the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/internal/score/compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ submissionId }),
      });

      if (response.ok) {
        toast.success('Scoring re-run initiated');
      } else {
        toast.error('Failed to re-run scoring');
      }
    } catch (error) {
      toast.error('Failed to re-run scoring');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Project management table would be displayed here.
        This would show a list of all projects with options to edit, delete, or re-run scoring.
      </div>
      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Description</th>
              <th className="p-4 text-left">Submissions</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4">-</td>
              <td className="p-4">-</td>
              <td className="p-4">-</td>
              <td className="p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReRunScoring('mock-id')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-run Scoring
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

