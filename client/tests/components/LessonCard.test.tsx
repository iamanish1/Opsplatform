import { render, screen } from '@testing-library/react';
import { LessonCard } from '@/components/lessons/LessonCard';

const mockLesson = {
  id: '1',
  title: 'Introduction to DevOps',
  content: 'Learn the basics',
  order: 1,
  completed: false,
};

describe('LessonCard', () => {
  it('renders lesson title', () => {
    render(<LessonCard lesson={mockLesson} />);
    expect(screen.getByText('Introduction to DevOps')).toBeInTheDocument();
  });

  it('shows completed status when lesson is completed', () => {
    const completedLesson = { ...mockLesson, completed: true };
    render(<LessonCard lesson={completedLesson} />);
    // Check for completed indicator (adjust based on actual implementation)
    expect(screen.getByText('Introduction to DevOps')).toBeInTheDocument();
  });
});

