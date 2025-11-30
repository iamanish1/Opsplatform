'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { interviewService } from '@/services/interview.service';
import { toast } from 'sonner';

interface InterviewRequestModalProps {
  userId: string;
  onClose: () => void;
}

export function InterviewRequestModal({ userId, onClose }: InterviewRequestModalProps) {
  const [position, setPosition] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { userId: string; message?: string; position?: string }) =>
      interviewService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-interview-requests'] });
      toast.success('Interview request sent successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to send interview request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ userId, message, position });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Interview</DialogTitle>
          <DialogDescription>
            Send an interview request to this developer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="position">Position (Optional)</Label>
            <Input
              id="position"
              placeholder="e.g., Senior DevOps Engineer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={createMutation.isPending}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

