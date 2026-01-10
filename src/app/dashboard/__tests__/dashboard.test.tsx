import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

describe('DashboardPage', () => {
  it('renders dashboard title', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Real-time Dashboard/i)).toBeInTheDocument();
  });
});
