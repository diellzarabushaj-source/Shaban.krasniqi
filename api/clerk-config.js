export default function handler(req, res) {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!publishableKey) {
    return res.status(503).json({
      configured: false,
      error: 'Clerk Publishable Key is not configured in Vercel.'
    });
  }

  return res.status(200).json({
    configured: true,
    publishableKey
  });
}
