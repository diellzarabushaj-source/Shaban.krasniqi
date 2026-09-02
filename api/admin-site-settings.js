const PROJECT_ID = 'a1lswl1z'
const DATASET = 'production'
const MUTATE = `https://${PROJECT_ID}.api.sanity.io/v2026-08-31/data/mutate/${DATASET}`

function unauthorized(res) {
  return res.status(401).json({error: 'Unauthorized'})
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({error: 'Method not allowed'})
  }

  const adminKey = process.env.ADMIN_KEY
  if (!adminKey || req.headers['x-admin-key'] !== adminKey) return unauthorized(res)

  const body = req.body || {}
  const contentItems = Array.isArray(body.contentItems) ? body.contentItems : []
  const cleanItems = contentItems.slice(0, 1000).map((item, index) => ({
    _type: 'contentItem',
    _key: String(item.key || `item-${index}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 96),
    key: String(item.key || '').slice(0, 160),
    label: String(item.label || '').slice(0, 240),
    section: String(item.section || '').slice(0, 120),
    kind: item.kind === 'attribute' ? 'attribute' : 'text',
    attribute: String(item.attribute || '').slice(0, 80),
    value: String(item.value ?? ''),
  }))

  const document = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    seo: body.seo || {},
    site: body.site || {},
    contentItems: cleanItems,
  }

  try {
    const response = await fetch(MUTATE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({mutations: [{createOrReplace: document}]}),
    })
    const payload = await response.json()
    if (!response.ok) return res.status(response.status).json({error: payload?.message || 'Sanity save failed'})

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ok: true, result: payload})
  } catch (error) {
    return res.status(500).json({error: 'Unable to save website content'})
  }
}
