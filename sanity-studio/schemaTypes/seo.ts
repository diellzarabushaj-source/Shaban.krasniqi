import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'seo',
  title: 'Seo',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alt', type: 'string'})],
    }),
    defineField({name: 'noIndex', title: 'No Index', type: 'boolean', initialValue: false}),
  ],
})
