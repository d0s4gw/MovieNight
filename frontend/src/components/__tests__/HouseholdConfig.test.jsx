import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HouseholdConfig from '../HouseholdConfig';

// Mock global fetch
global.fetch = vi.fn();

describe('HouseholdConfig', () => {
  const users = [
    { id: 1, name: 'Mike', type: 'adult', age: null },
    { id: 2, name: 'Iris', type: 'child', age: 8 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user list correctly', () => {
    render(<HouseholdConfig users={users} fetchUsers={() => {}} API_BASE="/api" setActiveUser={() => {}} />);
    
    expect(screen.getByText('Mike')).toBeInTheDocument();
    expect(screen.getByText('Adult')).toBeInTheDocument();
    
    expect(screen.getByText('Iris')).toBeInTheDocument();
    expect(screen.getByText('Child (Age 8)')).toBeInTheDocument();
  });

  it('allows adding a new user', async () => {
    const fetchUsers = vi.fn();
    fetch.mockResolvedValueOnce({ ok: true });

    render(<HouseholdConfig users={users} fetchUsers={fetchUsers} API_BASE="/api" setActiveUser={() => {}} />);
    
    // Open form
    fireEvent.click(screen.getByText('Add Member'));
    
    // Fill out name
    const nameInput = screen.getByPlaceholderText('e.g., Jackson');
    fireEvent.change(nameInput, { target: { value: 'Jackson' } });
    
    // Submit
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Jackson', type: 'adult', age: null })
      }));
      expect(fetchUsers).toHaveBeenCalledTimes(1);
    });
  });
});
