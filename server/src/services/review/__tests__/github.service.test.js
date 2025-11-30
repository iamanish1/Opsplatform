const githubService = require('../github.service');

describe('GitHub Service', () => {
  describe('fetchPRMetadata', () => {
    it('should parse repo full name and fetch PR metadata', async () => {
      const mockOctokit = {
        pulls: {
          get: jest.fn().mockResolvedValue({
            data: {
              title: 'Test PR',
              body: 'PR description',
              user: { login: 'testuser', id: 123 },
              state: 'open',
              additions: 100,
              deletions: 50,
              changed_files: 5,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
              merged_at: null,
              head: { sha: 'abc123', ref: 'feature' },
              base: { sha: 'def456', ref: 'main' },
            },
          }),
        },
      };

      const result = await githubService.fetchPRMetadata(mockOctokit, 'owner/repo', 1);

      expect(result.title).toBe('Test PR');
      expect(result.author).toBe('testuser');
      expect(result.additions).toBe(100);
      expect(mockOctokit.pulls.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 1,
      });
    });

    it('should handle errors gracefully', async () => {
      const mockOctokit = {
        pulls: {
          get: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      };

      await expect(
        githubService.fetchPRMetadata(mockOctokit, 'owner/repo', 1)
      ).rejects.toThrow('Failed to fetch PR metadata');
    });
  });

  describe('fetchPRDiff', () => {
    it('should fetch and process PR diff with file limits', async () => {
      const mockFiles = [
        { filename: 'file1.js', additions: 50, deletions: 10, patch: 'diff1', status: 'modified' },
        { filename: 'file2.js', additions: 30, deletions: 5, patch: 'diff2', status: 'added' },
        { filename: 'file3.js', additions: 20, deletions: 2, patch: 'diff3', status: 'modified' },
      ];

      const mockOctokit = {
        pulls: {
          listFiles: jest.fn().mockResolvedValue({ data: mockFiles }),
        },
      };

      const result = await githubService.fetchPRDiff(mockOctokit, 'owner/repo', 1, 2);

      expect(result.files).toHaveLength(2);
      expect(result.files[0].filename).toBe('file1.js'); // Sorted by changes
      expect(result.totalFiles).toBe(3);
      expect(result.totalAdditions).toBe(100);
    });
  });
});

