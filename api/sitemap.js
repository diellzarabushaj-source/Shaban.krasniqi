const PROJECT_ID = 'a1lswl1z'
const DATASET = 'production'
const SITE_URL = 'https://shabankrasniqi.com'
const API = `https://${PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${DATASET}`

const QUERY = `{
  "posts": *[_type == "post" && defined(slug.current) && defined(publishedAt) && publishedAt <= now() && seo.noIndex != true] | order(publishedAt desc) {
    "path": "/post.html?slug=" + slug.current,
    "lastModified": _updatedAt
  },
  "authors": *[_type == "author" && defined(slug.current) && seo.noIndex != true] {
    "path": "/author.html?slug=" + slug.current,
    "lastModified": _updatedAt
  }
}`

const escapeXml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const absoluteUrl = (path) => `${SITE_URL}${path}`

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  try {
    const response = await fetch(`${API}?query=${encodeURIComponent(QUERY)}`, {
      headers: {Accept: 'application/json'},
      cache: 'no-store',
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Sanity request failed')

    const entries = [
      {path: '/', lastModified: new Date().toISOString(), changefreq: 'weekly', priority: '1.0'},
      {path: '/blog.html', lastModified: new Date().toISOString(), changefreq: 'weekly', priority: '0.8'},
      ...(payload.result?.authors || []).map((item) => ({...item, changefreq: 'monthly', priority: '0.6'})),
      ...(payload.result?.posts || []).map((item) => ({...item, changefreq: 'monthly', priority: '0.7'})),
    ]

    const unique = [...new Map(entries.map((item) => [item.path, item])).values()]
    const urls = unique.map((item) => `  <url>\n    <loc>${escapeXml(absoluteUrl(item.path))}</loc>${item.lastModified ? `\n    <lastmod>${escapeXml(item.lastModified)}</lastmod>` : ''}\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    res.setHeader('CDN-Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    return res.status(200).send(xml)
  } catch (error) {
    console.error('Sitemap generation failed', error)
    return res.status(500).send('Unable to generate sitemap')
  }
}
