// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Setup MSW for tests
if (typeof window !== 'undefined') {
  const { worker } = require('./tests/__mocks__/msw');
  worker.start({
    onUnhandledRequest: 'bypass',
  });
}

