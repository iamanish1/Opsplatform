'use client';

import { useQuery } from '@tanstack/react-query';
import { lessonsService } from '@/services/lessons.service';
import { LessonCard } from '@/components/lessons/LessonCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function LessonsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await lessonsService.getLessons();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load lessons');
      }
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load lessons. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const lessons = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
        <p className="text-muted-foreground">
          Complete lessons to build your DevOps skills and advance your career.
        </p>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No lessons available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

