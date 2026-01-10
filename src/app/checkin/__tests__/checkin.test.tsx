import { render, screen } from '@testing-library/react';
import CheckinPage from '../page';

describe('CheckinPage', () => {
  it('renders check-in title', () => {
    render(<CheckinPage />);
    expect(screen.getByText(/QR Check-in/i)).toBeInTheDocument();
  });
});
