export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  const robots = `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /api/

Sitemap: https://shabankrasniqi.com/sitemap.xml
`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  return res.status(200).send(robots)
}
