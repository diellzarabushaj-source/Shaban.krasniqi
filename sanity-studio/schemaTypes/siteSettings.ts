import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export default defineType({
  name: 'siteSettings',
  title: 'Website Content',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO & Metadata',
      type: 'object',
      fields: [
        defineField({name: 'title', title: 'Page Title', type: 'string', validation: Rule => Rule.max(70)}),
        defineField({name: 'description', title: 'Meta Description', type: 'text', rows: 3, validation: Rule => Rule.max(170)}),
        defineField({name: 'ogTitle', title: 'Open Graph Title', type: 'string'}),
        defineField({name: 'ogDescription', title: 'Open Graph Description', type: 'text', rows: 3}),
        defineField({name: 'twitterTitle', title: 'Twitter Title', type: 'string'}),
        defineField({name: 'twitterDescription', title: 'Twitter Description', type: 'text', rows: 3}),
        defineField({name: 'canonicalUrl', title: 'Canonical URL', type: 'url'}),
        defineField({name: 'noIndex', title: 'No Index', type: 'boolean', initialValue: false}),
      ],
    }),
    defineField({
      name: 'site',
      title: 'Business & Contact',
      type: 'object',
      fields: [
        defineField({name: 'name', title: 'Business Name', type: 'string'}),
        defineField({name: 'phone', title: 'Phone', type: 'string'}),
        defineField({name: 'whatsappUrl', title: 'WhatsApp URL', type: 'url'}),
        defineField({name: 'location', title: 'Location', type: 'string'}),
        defineField({name: 'language', title: 'Language', type: 'string', initialValue: 'sq-XK'}),
      ],
    }),
    defineField({
      name: 'contentItems',
      title: 'All Website Content',
      description: 'Tekstet dhe atributet e faqes. Admin Frontend i importon dhe i sinkronizon automatikisht me kete liste.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'key', title: 'Key', type: 'string', readOnly: true}),
            defineField({name: 'label', title: 'Label', type: 'string'}),
            defineField({name: 'section', title: 'Section', type: 'string'}),
            defineField({name: 'kind', title: 'Kind', type: 'string', options: {list: ['text', 'attribute']}}),
            defineField({name: 'attribute', title: 'Attribute', type: 'string'}),
            defineField({name: 'value', title: 'Value', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'label', subtitle: 'section'}},
        }),
      ],
    }),
  ],
})
