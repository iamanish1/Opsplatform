import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { projectsService } from '@/services/projects.service';

jest.mock('@/services/projects.service');

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

describe('Projects Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create submission when starting project', async () => {
    (projectsService.startProject as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        submission: {
          id: '1',
          projectId: '1',
          repoUrl: 'https://github.com/user/repo',
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
        },
      },
    });

    const { result } = renderHook(
      () => useMutation({
        mutationFn: ({ projectId, repoUrl }: { projectId: string; repoUrl: string }) =>
          projectsService.startProject(projectId, { repoUrl }),
      }),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      projectId: '1',
      repoUrl: 'https://github.com/user/repo',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(projectsService.startProject).toHaveBeenCalledWith('1', {
      repoUrl: 'https://github.com/user/repo',
    });
  });
});

