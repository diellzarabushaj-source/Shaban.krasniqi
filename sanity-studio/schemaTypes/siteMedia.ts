import {defineField, defineType} from 'sanity'

const imageWithAlt = (name: string, title: string, required = false, hotspot = true) =>
  defineField({
    name,
    title,
    type: 'image',
    ...(hotspot ? {options: {hotspot: true}} : {}),
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

const imageGroup = (name: string, title: string, fields: ReturnType<typeof defineField>[]) =>
  defineField({name, title, type: 'object', fields})

export default defineType({
  name: 'siteMedia',
  title: 'Website Media',
  type: 'document',
  fields: [
    imageGroup('branding', 'Branding', [
      imageWithAlt('logoPrimary', 'Logo Primary', true),
      imageWithAlt('logoWhite', 'Logo White', true),
      imageWithAlt('logoMark', 'Logo Mark', true),
      imageWithAlt('favicon', 'Favicon', true, false),
    ]),
    imageGroup('hero', 'Hero', [
      imageWithAlt('mainImage', 'Main Image', true),
      imageWithAlt('backgroundImage', 'Background Image'),
    ]),
    imageGroup('services', 'Services', [
      imageWithAlt('fizioterapi', 'Fizioterapi', true),
      imageWithAlt('elektroterapi', 'Elektroterapi', true),
      imageWithAlt('ultraze', 'Ultrazë', true),
      imageWithAlt('limfodrenazh', 'Limfodrenazh', true),
      imageWithAlt('shockwave', 'Shockwave', true),
      imageWithAlt('hixhame', 'Hixhame', true),
    ]),
    imageGroup('treatments', 'Treatments', [
      imageWithAlt('qafeShpine', 'Qafë & Shpinë', true),
      imageWithAlt('nyje', 'Nyje', true),
      imageWithAlt('ortopedike', 'Ortopedike', true),
      imageWithAlt('reumatike', 'Reumatike', true),
      imageWithAlt('pediatrike', 'Pediatrike', true),
    ]),
    imageGroup('general', 'General', [
      imageWithAlt('homeVisit', 'Home Visit'),
      imageWithAlt('approach', 'Approach'),
      imageWithAlt('about', 'About'),
      imageWithAlt('cta', 'CTA'),
      imageWithAlt('ogDefault', 'Default OG Image', false, false),
    ]),
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
