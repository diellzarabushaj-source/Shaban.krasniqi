import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'SEO Title',
      description: 'Titulli që përdoret në Google dhe social sharing kur vendoset.',
      type: 'string',
      validation: (Rule) => Rule.max(70).warning('Mbaje zakonisht rreth 50–60 karaktere.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      description: 'Përshkrim unik dhe i dobishëm për rezultatet e kërkimit.',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(170).warning('Mbaje zakonisht rreth 140–160 karaktere.'),
    }),
    defineField({
      name: 'image',
      title: 'Social / Open Graph Image',
      description: 'Rekomandohet format 1200×630 për shpërndarje sociale.',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt',
          type: 'string',
          validation: (Rule) => Rule.max(160).warning('Alt text duhet të jetë përshkrues dhe jo keyword stuffing.'),
        }),
      ],
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      description: 'Aktivizo vetëm kur kjo faqe nuk duhet të shfaqet në Google.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
