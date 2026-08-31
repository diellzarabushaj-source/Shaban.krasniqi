# Shaban Krasniqi Sanity Studio

Ky source-code lidhet me projektin ekzistues të Sanity:

- Project ID: `a1lswl1z`
- Dataset: `production`
- Studio ekzistuese: `https://shaban-krasniqi-blog.sanity.studio/`

Nuk krijon project ose dataset të ri.

## Schema types

Ekzistuese:
- `post`
- `category`
- `author`

E re:
- `siteMedia` — singleton me document ID `siteMedia`

## Validation lokale

```bash
cd sanity-studio
npm install
npm run schema:extract
npm run build
```

Mos bëj deploy para se këto dy kontrolle të kalojnë.

## Website Media

Në Studio hap `Website Media` dhe mbush:
- Branding
- Hero
- 6 Service images
- 5 Treatment images
- General images sipas nevojës

Frontend-i i website-it është tashmë i lidhur me këtë singleton.
