import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCronAuth } from '../src/lib/cron-auth';

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
    },
  };
});

describe('verifyCronAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('fails if CRON_SECRET is missing', () => {
    delete process.env.CRON_SECRET;
    const req = new Request('http://localhost', { headers: new Headers() });
    
    const res = verifyCronAuth(req) as unknown as { body: { error: string }, init: { status: number } };
    expect(res.body.error).toBe('Server configuration error');
    expect(res.init.status).toBe(500);
  });

  it('fails if Authorization header is missing', () => {
    process.env.CRON_SECRET = 'my-secret';
    const req = new Request('http://localhost', { headers: new Headers() });
    
    const res = verifyCronAuth(req) as unknown as { body: { error: string }, init: { status: number } };
    expect(res.body.error).toBe('Unauthorized');
    expect(res.init.status).toBe(401);
  });

  it('fails if Authorization header is incorrect', () => {
    process.env.CRON_SECRET = 'my-secret';
    const req = new Request('http://localhost', { 
      headers: new Headers({ authorization: 'Bearer wrong-secret' }) 
    });
    
    const res = verifyCronAuth(req) as unknown as { body: { error: string }, init: { status: number } };
    expect(res.body.error).toBe('Unauthorized');
    expect(res.init.status).toBe(401);
  });

  it('succeeds with correct CRON_SECRET', () => {
    process.env.CRON_SECRET = 'my-secret';
    const req = new Request('http://localhost', { 
      headers: new Headers({ authorization: 'Bearer my-secret' }) 
    });
    
    const res = verifyCronAuth(req);
    expect(res).toBeNull(); // null means authorized
  });

  it('succeeds when CRON_SECRET or header has quotes or Bearer prefix in env', () => {
    process.env.CRON_SECRET = '"Bearer my-secret"';
    const req = new Request('http://localhost', { 
      headers: new Headers({ authorization: 'Bearer Bearer "my-secret"' }) 
    });
    
    const res = verifyCronAuth(req);
    expect(res).toBeNull();
  });
});
