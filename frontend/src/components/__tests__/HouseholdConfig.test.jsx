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

  it('handles child profile type correctly', async () => {
    fetch.mockResolvedValueOnce({ ok: true });
    render(<HouseholdConfig users={[]} fetchUsers={() => {}} API_BASE="/api" setActiveUser={() => {}} />);
    
    fireEvent.click(screen.getByText('Add Member'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g., Jackson'), { target: { value: 'Jackson' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'child' } });
    
    const ageInput = screen.getByPlaceholderText('e.g., 10');
    fireEvent.change(ageInput, { target: { value: '10' } });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Jackson', type: 'child', age: 10 })
      }));
    });
  });

  it('allows editing an existing user', async () => {
    const fetchUsers = vi.fn();
    fetch.mockResolvedValueOnce({ ok: true });

    render(<HouseholdConfig users={users} fetchUsers={fetchUsers} API_BASE="/api" setActiveUser={() => {}} />);
    
    fireEvent.click(screen.getByLabelText('Edit Mike'));
    
    expect(screen.getByDisplayValue('Mike')).toBeInTheDocument();
    
    fireEvent.change(screen.getByDisplayValue('Mike'), { target: { value: 'Michael' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Michael', type: 'adult', age: null })
      }));
    });
  });

  it('allows deleting a user', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    const fetchUsers = vi.fn();
    fetch.mockResolvedValueOnce({ ok: true });

    render(<HouseholdConfig users={users} fetchUsers={fetchUsers} API_BASE="/api" setActiveUser={() => {}} />);
    
    fireEvent.click(screen.getByLabelText('Delete Mike'));
    
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });
});
