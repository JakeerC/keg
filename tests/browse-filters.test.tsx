import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KindToggle from '../src/components/KindToggle';
import * as navigation from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}));

describe('KindToggle (URL state updates)', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigation.useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof navigation.useRouter>);
  });

  it('renders "Both" as active by default if no kind param', () => {
    vi.mocked(navigation.useSearchParams).mockReturnValue(new URLSearchParams() as unknown as ReturnType<typeof navigation.useSearchParams>);
    
    render(<KindToggle />);
    
    const bothBtn = screen.getByText('Both');
    expect(bothBtn.style.backgroundColor).toBe('var(--bg-main)');
  });

  it('pushes new kind and removes limit', () => {
    vi.mocked(navigation.useSearchParams).mockReturnValue(new URLSearchParams('limit=10') as unknown as ReturnType<typeof navigation.useSearchParams>);
    
    render(<KindToggle />);
    
    const guiBtn = screen.getByText('Mac Apps');
    fireEvent.click(guiBtn);
    
    expect(mockPush).toHaveBeenCalledWith('/?kind=gui_app');
  });

  it('removes kind param if "Both" is selected', () => {
    vi.mocked(navigation.useSearchParams).mockReturnValue(new URLSearchParams('kind=gui_app&limit=10') as unknown as ReturnType<typeof navigation.useSearchParams>);
    
    render(<KindToggle />);
    
    const bothBtn = screen.getByText('Both');
    fireEvent.click(bothBtn);
    
    expect(mockPush).toHaveBeenCalledWith('/?');
  });
});
