import type {StructureResolver} from 'sanity/structure'

export const SITE_MEDIA_ID = 'siteMedia'
export const singletonTypes = new Set(['siteMedia'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Website Media')
        .id(SITE_MEDIA_ID)
        .child(
          S.document()
            .schemaType('siteMedia')
            .documentId(SITE_MEDIA_ID)
            .title('Website Media')
        ),
      S.divider(),
      S.documentTypeListItem('post').title('Posts'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('author').title('Authors'),
    ])
