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
    (navigation.useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders "Both" as active by default if no kind param', () => {
    (navigation.useSearchParams as any).mockReturnValue(new URLSearchParams());
    
    render(<KindToggle />);
    
    const bothBtn = screen.getByText('Both');
    expect(bothBtn.style.backgroundColor).toBe('var(--bg-main)');
  });

  it('pushes new kind and removes limit', () => {
    (navigation.useSearchParams as any).mockReturnValue(new URLSearchParams('limit=10'));
    
    render(<KindToggle />);
    
    const guiBtn = screen.getByText('Mac Apps');
    fireEvent.click(guiBtn);
    
    expect(mockPush).toHaveBeenCalledWith('/?kind=gui_app');
  });

  it('removes kind param if "Both" is selected', () => {
    (navigation.useSearchParams as any).mockReturnValue(new URLSearchParams('kind=gui_app&limit=10'));
    
    render(<KindToggle />);
    
    const bothBtn = screen.getByText('Both');
    fireEvent.click(bothBtn);
    
    expect(mockPush).toHaveBeenCalledWith('/?');
  });
});
