const PROJECT_ID = 'a1lswl1z'
const DATASET = 'production'
const API = `https://${PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${DATASET}`

const QUERY = `*[_id == "siteSettings"][0]{
  _id,
  _updatedAt,
  seo{title,description,ogTitle,ogDescription,twitterTitle,twitterDescription,canonicalUrl,noIndex},
  site{name,phone,whatsappUrl,location,language},
  contentItems[]{_key,key,label,section,kind,attribute,value}
}`

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({error: 'Method not allowed'})
  }

  try {
    const response = await fetch(`${API}?query=${encodeURIComponent(QUERY)}`, {
      headers: {Accept: 'application/json'},
      cache: 'no-store',
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.message || 'Sanity request failed')

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300')
    return res.status(200).json(payload.result || null)
  } catch (error) {
    return res.status(500).json({error: 'Unable to load website content'})
  }
}
