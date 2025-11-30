'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lessonsService, type Lesson } from '@/services/lessons.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface LessonDetailProps {
  lessonId: string;
}

export function LessonDetail({ lessonId }: LessonDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const response = await lessonsService.getLessonDetails(lessonId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load lesson');
      }
      return response.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => lessonsService.completeLesson(lessonId),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate lessons list and current lesson
        queryClient.invalidateQueries({ queryKey: ['lessons'] });
        queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        
        toast({
          title: 'Lesson completed!',
          description: 'Great job! You\'ve completed this lesson.',
        });
      } else {
        throw new Error(response.error?.message || 'Failed to complete lesson');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Lesson not found</p>
        </CardContent>
      </Card>
    );
  }

  const lesson: Lesson = data;
  const isCompleted = lesson.completed;

  // Simple micro-quiz (placeholder - can be enhanced)
  const quizQuestions = [
    { id: 1, question: 'What is DevOps?', options: ['A methodology', 'A tool', 'A language'] },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              <CardDescription>Lesson {lesson.order}</CardDescription>
            </div>
            {isCompleted ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Circle className="h-6 w-6" />
                <span className="font-medium">In Progress</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video placeholder */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Video content placeholder</p>
          </div>

          {/* Lesson content */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">{lesson.content}</div>
          </div>

          {/* Micro-quiz */}
          {quizQuestions.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Quick Quiz</h3>
              {quizQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <p className="font-medium">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option, idx) => (
                      <label
                        key={idx}
                        className="flex items-center space-x-2 p-2 rounded border hover:bg-accent cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.id}`}
                          value={option}
                          checked={quizAnswers[q.id] === option}
                          onChange={(e) =>
                            setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })
                          }
                          className="h-4 w-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete button */}
      {!isCompleted && (
        <div className="flex justify-end">
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            size="lg"
          >
            {completeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              'Mark as Complete'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

