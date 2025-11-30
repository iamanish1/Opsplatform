'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectTable } from '@/components/admin/ProjectTable';

export default function AdminProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">
          Manage all projects in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>View and manage projects</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTable />
        </CardContent>
      </Card>
    </div>
  );
}

