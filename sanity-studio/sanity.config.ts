import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Shaban Krasniqi Blog',
  projectId: 'a1lswl1z',
  dataset: 'production',
  plugins: [structureTool({structure})],
  schema: {types: schemaTypes},
})
