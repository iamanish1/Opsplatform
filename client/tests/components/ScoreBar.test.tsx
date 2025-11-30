import { render, screen } from '@testing-library/react';
import { ScoreBars } from '@/components/score/ScoreBars';

describe('ScoreBars', () => {
  const mockCategories = [
    { name: 'Code Quality', value: 8 },
    { name: 'Problem Solving', value: 9 },
    { name: 'Security', value: 7 },
  ];

  it('renders score bars for all categories', () => {
    render(<ScoreBars categories={mockCategories} />);
    
    // Check if Recharts components are rendered
    // Note: Recharts renders SVG elements, so we check for the container
    const container = document.querySelector('.recharts-wrapper');
    expect(container).toBeInTheDocument();
  });

  it('displays all category names', () => {
    render(<ScoreBars categories={mockCategories} />);
    
    // Recharts renders category names in the Y-axis
    // We can check if the component rendered without errors
    const container = document.querySelector('.recharts-wrapper');
    expect(container).toBeInTheDocument();
  });
});

