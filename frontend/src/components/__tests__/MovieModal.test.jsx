import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MovieModal from '../MovieModal';

global.fetch = vi.fn();

describe('MovieModal', () => {
  const mockDetails = {
    id: 1,
    title: 'Epic Movie',
    overview: 'This is an epic movie overview.',
    runtime: 120,
    status: 'Released',
    videos: {
      results: [{ site: 'YouTube', type: 'Trailer', key: 'xyz123' }]
    },
    credits: {
      cast: [{ id: 10, name: 'Actor One', character: 'Hero' }]
    },
    'watch/providers': {
      results: { US: { link: 'https://tmdb.com/watch' } }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<MovieModal movieId={1} API_BASE="/api" onClose={() => {}} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders details, trailer, cast, and watch link after fetch', async () => {
    fetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockDetails) });
    render(<MovieModal movieId={1} API_BASE="/api" onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Epic Movie')).toBeInTheDocument();
    });

    expect(screen.getByText('This is an epic movie overview.')).toBeInTheDocument();
    expect(screen.getByText('Actor One')).toBeInTheDocument();
    expect(screen.getByText('Runtime: 120 mins')).toBeInTheDocument();
    
    const watchLink = screen.getByText(/Watch Now/i);
    expect(watchLink).toHaveAttribute('href', 'https://tmdb.com/watch');

    const iframe = screen.getByTitle('YouTube video player');
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/xyz123?autoplay=1');
  });

  it('calls onClose when close button is clicked', async () => {
    fetch.mockResolvedValueOnce({ json: () => Promise.resolve(mockDetails) });
    const handleClose = vi.fn();
    render(<MovieModal movieId={1} API_BASE="/api" onClose={handleClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Epic Movie')).toBeInTheDocument();
    });

    // Close button is the first button inside the modal overlay
    const closeBtn = screen.getAllByRole('button')[0];
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
