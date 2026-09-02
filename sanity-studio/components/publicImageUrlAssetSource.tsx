import type {AssetSource, AssetSourceComponentProps} from 'sanity'

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function PublicImageUrlSource({onSelect, onClose}: AssetSourceComponentProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const rawUrl = String(form.get('url') || '').trim()

    if (!isValidHttpUrl(rawUrl)) {
      window.alert('Vendos një URL publike të vlefshme që fillon me https:// ose http://.')
      return
    }

    let filename = 'public-image'
    try {
      const pathname = new URL(rawUrl).pathname
      const candidate = pathname.split('/').pop()
      if (candidate) filename = candidate.split('?')[0] || filename
    } catch {
      // Keep the fallback filename.
    }

    onSelect([
      {
        kind: 'url',
        value: rawUrl,
        assetDocumentProps: {
          originalFilename: filename,
          source: {
            name: 'public-url',
            id: rawUrl,
            url: rawUrl,
          },
        },
      },
    ])
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} style={{padding: 24, maxWidth: 720}}>
      <div style={{display: 'grid', gap: 12}}>
        <label htmlFor="sanity-public-image-url" style={{fontWeight: 600}}>
          Public image URL
        </label>
        <input
          id="sanity-public-image-url"
          name="url"
          type="url"
          placeholder="https://example.com/photo.jpg"
          autoFocus
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 15,
          }}
        />
        <p style={{margin: 0, color: '#666', fontSize: 13}}>
          Vendos vetëm një link publik direkt të fotografisë. Linku duhet të jetë i
          aksesueshëm nga interneti dhe të lejojë CORS.
        </p>
        <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
          <button type="button" onClick={onClose} style={{padding: '9px 14px'}}>
            Cancel
          </button>
          <button type="submit" style={{padding: '9px 14px'}}>
            Upload image
          </button>
        </div>
      </div>
    </form>
  )
}

export const publicImageUrlAssetSource: AssetSource = {
  name: 'public-url',
  title: 'Public image URL',
  component: PublicImageUrlSource,
}
