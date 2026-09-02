import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required().custom(async (slug, context) => {
        if (!slug?.current) return 'Slug është i detyrueshëm.'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)) {
          return 'Slug duhet të përdorë vetëm shkronja të vogla, numra dhe viza.'
        }
        const client = context.getClient({apiVersion: '2026-08-31'})
        const id = context.document?._id?.replace(/^drafts\./, '')
        const count = await client.fetch(
          `count(*[_type == "post" && slug.current == $slug && _id != $id])`,
          {slug: slug.current, id},
        )
        return count === 0 || 'Ky slug ekziston tashmë.'
      }),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      validation: (Rule) => Rule.max(240).warning('Mbaje të shkurtër dhe të dobishëm për preview/social.'),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({name: 'alt', title: 'Alt', type: 'string', validation: (Rule) => Rule.required().max(160)}),
      ],
    }),
    defineField({name: 'category', title: 'Category', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'author', title: 'Author', type: 'reference', to: [{type: 'author'}]}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: 'Alt', type: 'string', validation: (Rule) => Rule.max(160)}),
            defineField({name: 'caption', title: 'Caption', type: 'string', validation: (Rule) => Rule.max(240)}),
          ],
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
  ],
})
