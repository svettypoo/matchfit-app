import { NextResponse } from 'next/server';

const { buildLogoutCookieHeader } = require('@/lib/sso-auth');

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', buildLogoutCookieHeader());
  return res;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get('return_to') || 'https://sso.stproperties.com';
  const res = NextResponse.redirect(returnTo.startsWith('http') ? returnTo : new URL(returnTo, req.url));
  res.headers.set('Set-Cookie', buildLogoutCookieHeader());
  return res;
}
