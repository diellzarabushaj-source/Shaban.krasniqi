import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'role', title: 'Role', type: 'string'}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'}}),
    defineField({name: 'shortBio', title: 'Short Bio', type: 'text'}),
    defineField({name: 'image', title: 'Image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'specialties', title: 'Specialties', type: 'array', of: [{type: 'string'}]}),
    defineField({
      name: 'education',
      title: 'Education',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({name: 'title', title: 'Title', type: 'string'}),
          defineField({name: 'description', title: 'Description', type: 'text'}),
        ],
      }],
    }),
    defineField({name: 'experience', title: 'Experience', type: 'text'}),
    defineField({name: 'languages', title: 'Languages', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'approach', title: 'Approach', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'bio', title: 'Bio', type: 'array', of: [{type: 'block'}]}),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Title', type: 'string'}),
        defineField({name: 'description', title: 'Description', type: 'text'}),
        defineField({name: 'noIndex', title: 'No Index', type: 'boolean'}),
      ],
    }),
  ],
})
