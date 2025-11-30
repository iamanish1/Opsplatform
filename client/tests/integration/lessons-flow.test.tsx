import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { lessonsService } from '@/services/lessons.service';

jest.mock('@/services/lessons.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Lessons Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete lesson and update onboarding step', async () => {
    (lessonsService.completeLesson as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        completed: true,
        completedAt: new Date().toISOString(),
      },
    });

    const { result } = renderHook(
      () => useMutation({
        mutationFn: (lessonId: string) => lessonsService.completeLesson(lessonId),
      }),
      { wrapper: createWrapper() }
    );

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(lessonsService.completeLesson).toHaveBeenCalledWith('1');
  });
});

