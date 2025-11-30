# DevHubs Frontend

Complete Next.js frontend application for the DevHubs developer portfolio platform.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN UI components
- **State Management**: React Query (TanStack Query) for server state, Zustand for UI state
- **Charts**: Recharts
- **Icons**: lucide-react
- **Animations**: Framer Motion
- **Testing**: Jest + React Testing Library
- **Mocking**: MSW (Mock Service Worker)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (default: http://localhost:4000)

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=DevHubs
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development with Mock Backend

To run with mocked API responses (useful when backend is not available):

```bash
npm run dev:mock
```

This uses MSW (Mock Service Worker) to intercept API calls and return mock data.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
client/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Authentication pages
│   ├── (dashboard)/        # Developer dashboard
│   ├── (company)/          # Company dashboard
│   ├── (admin)/           # Admin pages
│   ├── u/                  # Public portfolio pages
│   └── ...
├── components/             # React components
│   ├── ui/                # ShadCN UI components
│   ├── auth/               # Auth components
│   ├── dashboard/          # Dashboard components
│   └── ...
├── services/               # API service wrappers
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and API client
├── stores/                 # Zustand stores
├── tests/                  # Test files
└── styles/                 # Global styles
```

## Features

### Developer Features
- **Lessons**: Complete DevOps lessons with progress tracking
- **Projects**: Start and work on real DevOps projects
- **Submissions**: Track project submissions and status
- **Score Breakdown**: View detailed 10-category scoring
- **Portfolio**: Create and share public portfolios
- **Interviews**: Manage interview requests from companies

### Company Features
- **Talent Feed**: Discover and filter developers
- **Interview Requests**: Send and manage interview requests
- **Portfolio Viewing**: View developer portfolios

### Admin Features
- **User Management**: Manage all users
- **Project Management**: Manage projects
- **Score Re-run**: Re-compute scores for submissions

## API Integration

The frontend integrates with the backend API at `NEXT_PUBLIC_API_BASE_URL`. All API calls are made through service wrappers in the `services/` directory.

### Authentication

- JWT tokens are stored in localStorage (fallback if httpOnly cookies not available)
- Tokens are automatically attached to requests via axios interceptors
- Protected routes use `AuthGuard` component and Next.js middleware

### API Endpoints

- Auth: `/api/auth/*`
- Lessons: `/api/lessons/*`
- Projects: `/api/projects/*`
- Submissions: `/api/submissions/*`
- Score: `/api/score/*` (may need backend implementation)
- Portfolio: `/api/portfolios/*`
- Company: `/api/company/*`
- Talent: `/api/company/talent-feed`
- Interviews: `/api/interview-requests/*`
- Notifications: `/api/notifications/*`
- User: `/api/user/*`

## Testing

Run tests:

```bash
npm test
# or
npm run test:watch
```

### Test Structure

- **Unit Tests**: `tests/components/` - Test individual components
- **Integration Tests**: `tests/integration/` - Test user flows
- **MSW Handlers**: `tests/__mocks__/handlers.ts` - Mock API responses

### Writing Tests

Example unit test:

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:4000` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `DevHubs` |

## Scripts

- `dev` - Start development server
- `dev:mock` - Start development server with mocked API
- `build` - Build for production
- `start` - Start production server
- `test` - Run tests
- `test:watch` - Run tests in watch mode
- `lint` - Run ESLint

## Styling

The project uses Tailwind CSS with custom brand colors:

- Primary Blue: `#2563EB`
- Dark: `#0F172A`
- Accent Green: `#22C55E`
- Accent Yellow: `#FACC15`
- Accent Red: `#EF4444`
- Background: `#F8FAFC`

Fonts: Inter (primary) and Space Grotesk (display)

## Troubleshooting

### API Connection Issues

1. Ensure backend is running on the correct port
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Verify CORS settings on backend

### Authentication Issues

1. Clear localStorage: `localStorage.clear()`
2. Check token expiration
3. Verify backend auth endpoints

### Build Errors

1. Clear `.next` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npx tsc --noEmit`

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

See LICENSE file for details.
