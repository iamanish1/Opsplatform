'use client';

import { LessonDetail } from '@/components/lessons/LessonDetail';
import { useParams } from 'next/navigation';

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.id as string;

  return (
    <div className="space-y-6">
      <LessonDetail lessonId={lessonId} />
    </div>
  );
}

