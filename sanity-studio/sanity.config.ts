import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure, singletonTypes} from './structure'
import {publicImageUrlAssetSource} from './components/publicImageUrlAssetSource'

export default defineConfig({
  name: 'default',
  title: 'Shaban Krasniqi Blog',
  projectId: 'a1lswl1z',
  dataset: 'production',
  plugins: [structureTool({structure})],
  form: {
    image: {
      assetSources: (prev) => [...prev, publicImageUrlAssetSource],
      directUploads: true,
    },
  },
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((template) => !singletonTypes.has(template.schemaType)),
  },
  document: {
    actions: (prev, context) =>
      singletonTypes.has(context.schemaType)
        ? prev.filter(({action}) => !['delete', 'duplicate', 'unpublish'].includes(action || ''))
        : prev,
  },
})
