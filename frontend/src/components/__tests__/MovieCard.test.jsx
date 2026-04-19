import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MovieCard from '../MovieCard';

describe('MovieCard', () => {
  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    release_date: '2023-05-10',
    poster_path: '/test.jpg',
    vote_average: 8.5
  };

  it('renders movie details correctly', () => {
    render(<MovieCard movie={mockMovie} preferences={[]} watchlist={[]} onPreferenceChange={() => {}} onWatchlistChange={() => {}} />);
    
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    
    const poster = screen.getByAltText('Test Movie');
    expect(poster).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/test.jpg');
  });

  it('calls onPreferenceChange with like and dislike', () => {
    const handlePreference = vi.fn();
    render(<MovieCard movie={mockMovie} preferences={[]} watchlist={[]} onPreferenceChange={handlePreference} onWatchlistChange={() => {}} />);
    
    const likeBtn = screen.getByTitle('Like');
    const dislikeBtn = screen.getByTitle('Dislike');
    
    fireEvent.click(likeBtn);
    expect(handlePreference).toHaveBeenCalledWith(1, 'like');
    
    fireEvent.click(dislikeBtn);
    expect(handlePreference).toHaveBeenCalledWith(1, 'dislike');
  });

  it('shows active state if movie is liked', () => {
    const preferences = [{ movieId: 1, preference: 'like' }];
    render(<MovieCard movie={mockMovie} preferences={preferences} watchlist={[]} onPreferenceChange={() => {}} onWatchlistChange={() => {}} />);
    
    const likeBtn = screen.getByTitle('Like');
    expect(likeBtn.className).toMatch(/active-like/);
  });

  it('calls onWatchlistChange when bookmark is clicked', () => {
    const handleWatchlist = vi.fn();
    render(<MovieCard movie={mockMovie} preferences={[]} watchlist={[]} onPreferenceChange={() => {}} onWatchlistChange={handleWatchlist} />);
    
    const bookmarkBtn = screen.getByTitle('Add to Watchlist');
    fireEvent.click(bookmarkBtn);
    
    expect(handleWatchlist).toHaveBeenCalledWith(1, true);
  });

  it('shows remove title and active style if in watchlist', () => {
    const watchlist = [{ movieId: 1 }];
    render(<MovieCard movie={mockMovie} preferences={[]} watchlist={watchlist} onPreferenceChange={() => {}} onWatchlistChange={() => {}} />);
    
    const bookmarkBtn = screen.getByTitle('Remove from Watchlist');
    expect(bookmarkBtn.className).toMatch(/active-watchlist/);
  });
});
