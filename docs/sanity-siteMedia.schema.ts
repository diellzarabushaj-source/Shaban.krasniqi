import {defineField, defineType} from 'sanity'

const imageWithAlt = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    validation: required ? (Rule) => Rule.required() : undefined,
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt text',
        type: 'string',
        validation: required ? (Rule) => Rule.required() : undefined,
      }),
    ],
  })

export const siteMedia = defineType({
  name: 'siteMedia',
  title: 'Website Media',
  type: 'document',
  fields: [
    defineField({
      name: 'branding',
      title: 'Branding',
      type: 'object',
      fields: [
        imageWithAlt('logoPrimary', 'Logo Primary', true),
        imageWithAlt('logoWhite', 'Logo White', true),
        imageWithAlt('logoMark', 'Logo Mark', true),
        imageWithAlt('favicon', 'Favicon', true),
      ],
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        imageWithAlt('mainImage', 'Main Image', true),
        imageWithAlt('backgroundImage', 'Background Image'),
      ],
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'object',
      fields: [
        imageWithAlt('fizioterapi', 'Fizioterapi', true),
        imageWithAlt('elektroterapi', 'Elektroterapi', true),
        imageWithAlt('ultraze', 'Ultrazë', true),
        imageWithAlt('limfodrenazh', 'Limfodrenazh', true),
        imageWithAlt('shockwave', 'Shockwave', true),
        imageWithAlt('hixhame', 'Hixhame', true),
      ],
    }),
    defineField({
      name: 'treatments',
      title: 'Treatments',
      type: 'object',
      fields: [
        imageWithAlt('qafeShpine', 'Qafë & Shpinë', true),
        imageWithAlt('nyje', 'Nyje', true),
        imageWithAlt('ortopedike', 'Ortopedike', true),
        imageWithAlt('reumatike', 'Reumatike', true),
        imageWithAlt('pediatrike', 'Pediatrike', true),
      ],
    }),
    defineField({
      name: 'general',
      title: 'General',
      type: 'object',
      fields: [
        imageWithAlt('homeVisit', 'Home Visit'),
        imageWithAlt('approach', 'Approach'),
        imageWithAlt('about', 'About'),
        imageWithAlt('cta', 'CTA'),
        imageWithAlt('ogDefault', 'Default OG Image'),
      ],
    }),
  ],
  preview: {
    select: {media: 'branding.logoPrimary'},
    prepare: ({media}) => ({
      title: 'Website Media',
      subtitle: 'Logot dhe imazhet e Fizioterapisë Shaban Krasniqi',
      media,
    }),
  },
})
