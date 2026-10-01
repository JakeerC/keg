import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StarButton from '../src/components/StarButton';

// Mock useRouter
const mockRefresh = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush })
}));

// Mock Supabase browser client
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockGetSession = vi.fn();

vi.mock('../src/lib/supabase-browser', () => ({
  createSupabaseBrowser: () => ({
    auth: { getSession: mockGetSession },
    from: () => ({
      insert: mockInsert,
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: mockDelete })) }))
    })
  })
}));

describe('StarButton optimistic UI rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } });
  });

  it('rolls back state if API call fails', async () => {
    let rejectPromise: (value?: unknown) => void = () => {};
    const dbPromise = new Promise(resolve => {
      rejectPromise = () => resolve({ error: { message: 'DB Error' } });
    });
    mockInsert.mockReturnValue(dbPromise);

    await act(async () => {
      render(<StarButton resourceId="test-app" initialIsStarred={false} />);
    });
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Star app');
    
    // Click star
    await act(async () => {
      fireEvent.click(button);
    });
    
    // Immediately updates to starred (optimistic)
    expect(button.getAttribute('aria-label')).toBe('Unstar app');

    // Wait for the async API failure to roll back the state
    await act(async () => {
      rejectPromise();
    });

    await waitFor(() => {
      expect(button.getAttribute('aria-label')).toBe('Star app');
    });
  });

  it('keeps state if API call succeeds', async () => {
    mockInsert.mockResolvedValue({ error: null });

    await act(async () => {
      render(<StarButton resourceId="test-app" initialIsStarred={false} />);
    });
    
    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(button);
    });
    
    expect(button.getAttribute('aria-label')).toBe('Unstar app');

    // State shouldn't change back
    await new Promise(r => setTimeout(r, 50));
    expect(button.getAttribute('aria-label')).toBe('Unstar app');
  });
});
