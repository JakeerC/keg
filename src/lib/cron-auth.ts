import { NextResponse } from 'next/server'

export function verifyCronAuth(request: Request): NextResponse | null {
  const rawEnv = process.env.CRON_SECRET?.trim()

  if (!rawEnv) {
    console.error('CRON_SECRET is not configured.')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Clean expected secret: remove surrounding quotes and any accidental "Bearer " prefix
  const expectedSecret = rawEnv
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim()

  const authHeader = request.headers.get('authorization')?.trim() || ''
  // Clean received token: remove leading "Bearer " (one or more times) and surrounding quotes
  const receivedToken = authHeader
    .replace(/^(Bearer\s+)+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim()

  if (!receivedToken || receivedToken !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null // Authorization successful
}
