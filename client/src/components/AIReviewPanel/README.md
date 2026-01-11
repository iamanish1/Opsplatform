# AI Review System - Frontend Integration Guide

## Overview

The AI Review System frontend integration enables real-time monitoring and display of AI-powered code reviews. It integrates with the backend AI engine to provide users with comprehensive feedback on their submissions.

## Architecture

### Components

#### 1. **AIReviewPanel** (`components/AIReviewPanel/`)
Main container orchestrating all review results display.
- Shows review status (REVIEWING, REVIEWED, ERROR)
- Displays trust score, categories, summary, suggestions, and static analysis
- Handles loading states with skeleton UI
- Staggered animations for smooth user experience

**Props:**
```javascript
{
  status: 'REVIEWING' | 'REVIEWED' | 'ERROR',      // Current review status
  progress: 0-100,                                  // Review progress percentage
  review: Object,                                   // Full review object
  error: string,                                    // Error message if any
  loading: boolean                                  // Loading state
}
```

#### 2. **ReviewStatusIndicator** (`components/ReviewStatusIndicator/`)
Displays current review status and progress bar.
- Color-coded badges (Blue for REVIEWING, Green for REVIEWED, Red for ERROR)
- Animated progress bar with gradient
- Dynamic status messages

**Props:**
```javascript
{
  status: 'REVIEWING' | 'REVIEWED' | 'ERROR',
  progress: 0-100,
  error: string
}
```

#### 3. **TrustScoreCard** (`components/TrustScoreCard/`)
Displays main trust score in animated circular progress.
- Color-coded based on score (Green: 80+, Amber: 60-79, Red: <60)
- Smooth animation on score change
- Badge indicator (Excellent, Good, Needs Improvement)

**Props:**
```javascript
{
  score: 0-100
}
```

#### 4. **CategoryBreakdown** (`components/CategoryBreakdown/`)
Displays 10 category scores in grid layout.
- Individual progress bars for each category
- Pass/fail indicators (checkmark/alert icons)
- Responsive 5-column grid

**Categories:**
1. Code Quality
2. Tests
3. Documentation
4. Performance
5. Security
6. Error Handling
7. Best Practices
8. Accessibility
9. Maintainability
10. Code Efficiency

#### 5. **AISummaryCard** (`components/AISummaryCard/`)
Displays AI-generated text summary of review findings.
- Preserves formatting with whitespace handling
- Disclaimer about AI assessment
- Clean typography for readability

#### 6. **SuggestionsCard** (`components/SuggestionsCard/`)
Displays actionable improvement suggestions.
- List of recommendations from AI
- Chevron icons for visual hierarchy
- Hover effects for interactivity

#### 7. **StaticAnalysisCard** (`components/StaticAnalysisCard/`)
Displays code quality issues from static analysis.
- Categorized issues (Linting, Code Smells, Duplications, Complexity)
- Success state when no issues found
- Color-coded severity levels

### Hooks

#### **useReviewStatus** (`hooks/useReviewStatus.js`)
Manages polling for review status updates.

**Features:**
- Polls `/api/submissions/{id}/status` every 2 seconds
- Automatically stops polling when review is complete
- Handles errors with retry logic (3 attempts)
- Fetches full review details when status = REVIEWED

**Usage:**
```javascript
const { status, progress, review, loading, error, refetch } = useReviewStatus(submissionId);

// status: 'PENDING', 'REVIEWING', 'REVIEWED', 'ERROR'
// progress: 0-100
// review: Full review object (available when status === 'REVIEWED')
// loading: Boolean
// error: Error message
// refetch: Function to manually trigger status check
```

**Return Object:**
```javascript
{
  status: string,           // Current review status
  progress: number,         // 0-100 percentage
  review: Object|null,      // Full review details
  loading: boolean,         // Fetching state
  error: string|null,       // Error message
  refetch: Function         // Manual refetch
}
```

#### **useReviewCache** (`hooks/useReviewCache.js`)
Manages localStorage caching of review data.

**Features:**
- Caches review data with configurable TTL (default: 30 minutes)
- Reduces API calls on re-renders
- Automatic cache expiration

**Usage:**
```javascript
const { cache, cacheReview, getCachedReview, clearCache, clearAllCache, isCached } = useReviewCache(submissionId);

// Cache data when review completes
if (review.status === 'REVIEWED') {
  cacheReview(submissionId, review);
}
```

### Services

#### **submissionsApi** (`services/submissionsApi.js`)
Updated with 3 new endpoints for AI review:

```javascript
// Get submission review status
getSubmissionStatus(submissionId)
// Returns: { status, progress, timestamp }

// Get full review details
getReviewDetails(submissionId)
// Returns: { trustScore, categories, summary, suggestions, staticAnalysis }

// Get categorized breakdown
getReviewCategories(submissionId)
// Returns: Array of category objects
```

## Integration Points

### 1. SubmissionDetail Page
Located: `features/dashboard/pages/SubmissionDetail/`

**Integration:**
- Imports AIReviewPanel and review hooks
- Shows AIReviewPanel when submission.status is 'SUBMITTED' or 'REVIEWED'
- Uses useReviewStatus to poll for updates
- Uses useReviewCache to avoid redundant API calls
- Clears cache when submitting new review

**Flow:**
```
User completes tasks → Submit for Review → Status changes to SUBMITTED
→ useReviewStatus starts polling → AIReviewPanel shows progress
→ When status = REVIEWED → Full review displayed
```

### 2. Submissions List Page
Located: `features/dashboard/pages/Submissions/`

**Integration:**
- Uses SubmissionCard component (new)
- Shows ReviewStatusIndicator for submissions in 'SUBMITTED' status
- Displays review progress inline with submission card

### 3. DashboardOverview Component
Located: `features/dashboard/components/DashboardOverview/`

**Integration:**
- Fetches real submission data from backend
- Calculates average trust score from reviewed submissions
- Passes trust score to TrustScoreWidget

## Data Models

### Review Object Structure
```javascript
{
  id: string,
  submissionId: string,
  status: 'PENDING' | 'REVIEWING' | 'REVIEWED' | 'ERROR',
  trustScore: number,        // 0-100
  
  // 10 category scores
  categories: [
    {
      name: string,          // e.g., "Code Quality"
      score: number,         // 0-100
      passed: boolean        // score >= 70
    },
    // ... 9 more categories
  ],
  
  // AI-generated content
  summary: string,           // Detailed assessment paragraph
  suggestions: string[],     // List of improvement suggestions
  
  // Static analysis results
  staticAnalysis: {
    lintingErrors: string[],
    codeSmells: string[],
    duplications: string[],
    complexityIssues: string[]
  },
  
  // Metadata
  createdAt: timestamp,
  completedAt: timestamp,
  processingTime: number     // milliseconds
}
```

## Color Scheme

```css
Primary: #8b5cf6 (Purple)    - Main brand, primary CTAs
Secondary: #ec4899 (Pink)    - Accents, hover states
Accent: #f59e0b (Amber)      - Warnings, "Under Review"

Status Colors:
SUCCESS: #10b981 (Green)     - Excellent (80+)
WARNING: #f59e0b (Amber)     - Good (60-79)
ERROR: #ef4444 (Red)         - Needs improvement (<60)

Gray Scale:
Dark BG: #0a0a0f
Cards: #1e1e1e
Medium: #2d2d2d
Light: #6b7280
```

## Animation Strategy

All components use Framer Motion with:
- **Entrance animations:** Smooth fade-in with slight upward movement (fadeInUp)
- **Progress animations:** Spring physics for score counters
- **List animations:** Staggered children for sequential reveal
- **Duration:** 0.3-1.5s based on component complexity

**Utilities:** `utils/animations.js`
- `fadeInUp` - Fade + Y-axis movement
- `staggerContainer` - Parent for staggered children
- Spring animations for numeric counters

## Error Handling

### API Errors
- `useReviewStatus` retries 3 times before giving up
- Error messages displayed in ReviewStatusIndicator
- Fallback to cached data if API fails

### Network Resilience
- Automatic polling restart on connection recovery
- Manual refetch button available
- Graceful degradation with loading states

### User Feedback
- Loading skeleton screens during polling
- Error cards with retry options
- Success animations on completion

## Performance Optimizations

### Memoization
All components use `React.memo()` to prevent unnecessary re-renders:
```javascript
const Component = memo(() => {
  // Component code
});
```

### Code Splitting
AI Review components in separate directory for lazy loading:
```javascript
const AIReviewPanel = lazy(() => import('./AIReviewPanel'));
```

### Caching Strategy
- localStorage caching with 30-min TTL
- Automatic expiration and cleanup
- Clear-all option for manual cache reset

### Polling Efficiency
- 2-second polling intervals (configurable)
- Automatic stop when review completes
- Error-based exponential backoff

## Responsive Design

All components follow mobile-first approach:
- **Mobile:** Single column, larger touch targets
- **Tablet:** 2-3 columns, optimized spacing
- **Desktop:** 5-column grid for categories, full layout

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Testing Considerations

### Unit Tests
Test individual components with mock data:
```javascript
// ReviewStatusIndicator.test.js
render(<ReviewStatusIndicator status="REVIEWING" progress={50} />);
expect(screen.getByText('50%')).toBeInTheDocument();
```

### Integration Tests
Test hooks and API integration:
```javascript
// useReviewStatus.test.js
const { result } = renderHook(() => useReviewStatus(submissionId));
waitFor(() => expect(result.current.status).toBe('REVIEWED'));
```

### E2E Tests
Test full user flow:
```
1. User submits project → Status becomes SUBMITTED
2. Polling begins → Status updates to REVIEWING with progress
3. Review completes → Status becomes REVIEWED
4. Full review displayed with all components
```

## Browser Compatibility

Tested and supported:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Accessibility

- Semantic HTML for screen readers
- ARIA labels on interactive elements
- Keyboard navigation support
- Reduced motion support via `useReducedMotion` hook
- Color contrast ratios > 4.5:1 for readability

## Future Enhancements

1. **Real-time Updates:** WebSocket integration for instant updates
2. **Comparison View:** Side-by-side comparison of multiple reviews
3. **PDF Export:** Generate review PDF for archival
4. **Review History:** Track score trends over time
5. **Collaborative Reviews:** Share review feedback with team
6. **Custom Alerts:** User-configurable notifications

## Troubleshooting

### Polling Not Starting
- Check if submissionId is valid
- Verify API endpoints are responding
- Check browser console for errors

### Cache Issues
- Clear cache: `clearAllCache()`
- Check localStorage quota
- Verify TTL settings (default: 30 minutes)

### Animation Performance
- Disable animations: Set `prefers-reduced-motion`
- Check GPU acceleration in browser DevTools
- Profile with React DevTools Profiler

## Related Documentation

- [Backend AI Engine](../../server/docs/AI_ENGINE_ARCHITECTURE.md)
- [API Integration Guide](../../server/docs/INTEGRATION_CHECKLIST.md)
- [Component Library](../components/README.md)
- [Design System](../styles/README.md)
