'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';
import { type Lesson } from '@/services/lessons.service';
import { cn } from '@/lib/utils';

interface LessonCardProps {
  lesson: Lesson;
}

export function LessonCard({ lesson }: LessonCardProps) {
  const isCompleted = lesson.completed;

  return (
    <Link href={`/dashboard/lessons/${lesson.id}`}>
      <Card
        className={cn(
          'h-full transition-all hover:shadow-md cursor-pointer',
          isCompleted && 'border-primary/50'
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{lesson.title}</CardTitle>
              <CardDescription className="mt-1">
                Lesson {lesson.order}
              </CardDescription>
            </div>
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Click to view lesson</span>
          </div>
        </CardContent>
        <CardFooter>
          {isCompleted && (
            <Badge variant="secondary" className="w-full justify-center">
              Completed
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

