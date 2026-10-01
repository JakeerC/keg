import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/brewfile/route';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGetSession = vi.fn();

vi.mock('../src/lib/supabase-server', () => ({
  createSupabaseServer: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

vi.mock('next/server', () => ({
  NextResponse: class {
    body: any;
    init: any;
    constructor(body: any, init: any) {
      this.body = body;
      this.init = init;
    }
  },
}));

describe('Brewfile Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
  });

  it('returns 401 if not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    
    const response = await GET() as any;
    expect(response.body).toBe('Unauthorized');
    expect(response.init.status).toBe(401);
  });

  it('returns empty message when no bookmarks exist', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } });
    mockEq.mockResolvedValue({ data: [] });
    
    const response = await GET() as any;
    expect(response.body).toContain('# No apps starred yet');
  });

  it('generates valid Brewfile with CLI tools and GUI apps', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } });
    mockEq.mockResolvedValue({
      data: [
        { resources: { token: 'wget', kind: 'cli_tool' } },
        { resources: { token: 'google-chrome', kind: 'gui_app' } }
      ]
    });
    
    const response = await GET() as any;
    expect(response.body).toContain('brew "wget"');
    expect(response.body).toContain('cask "google-chrome"');
    expect(response.body).toContain('tap "homebrew/cask"');
  });
});
