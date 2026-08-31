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
      ...S.documentTypeListItems().filter(
        (item) => !singletonTypes.has(item.getId() || '')
      ),
    ])

export const singletonActions = (prev: any[], context: {schemaType: string}) =>
  singletonTypes.has(context.schemaType)
    ? prev.filter(({action}) => action !== 'duplicate')
    : prev
