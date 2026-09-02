import type {StructureResolver} from 'sanity/structure'

export const SITE_MEDIA_ID = 'siteMedia'
export const SITE_SETTINGS_ID = 'siteSettings'
export const singletonTypes = new Set(['siteMedia', 'siteSettings'])

const singleton = (S: any, type: string, id: string, title: string) =>
  S.listItem().title(title).id(id).child(
    S.document().schemaType(type).documentId(id).title(title)
  )

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Website Content')
    .items([
      singleton(S, 'siteSettings', SITE_SETTINGS_ID, 'Website Content'),
      singleton(S, 'siteMedia', SITE_MEDIA_ID, 'Website Media'),
      S.divider(),
      S.listItem().title('Blog').child(
        S.list().title('Blog').items([
          S.documentTypeListItem('post').title('Posts'),
          S.documentTypeListItem('category').title('Categories'),
          S.documentTypeListItem('author').title('Authors'),
        ])
      ),
    ])
