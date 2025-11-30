'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { userService } from '@/services/user.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userService.getMe(),
    enabled: !!user,
  });

  const profile = data?.data || user;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={profile?.name || ''} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={profile?.email || ''} disabled />
          </div>
          <div>
            <Label htmlFor="githubUsername">GitHub Username</Label>
            <Input id="githubUsername" defaultValue={profile?.githubUsername || ''} disabled />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}

