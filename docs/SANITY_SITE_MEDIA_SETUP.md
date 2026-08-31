# Sanity Website Media setup

Project: `a1lswl1z`
Dataset: `production`

The frontend is already wired to the `siteMedia` singleton. Do not rename any field.

## Studio code
1. Copy `docs/sanity-siteMedia.schema.ts` into the Sanity Studio schema folder.
2. Register `siteMedia` in the existing `schema.types` array.
3. Merge `docs/sanity-siteMedia.singleton.ts` into the existing Structure Tool config so `siteMedia` is a singleton.
4. Do not modify `post`, `category`, or `author`.

## Create exactly one document
Document type: `siteMedia`
Document ID: `siteMedia`

### Required Branding
- `branding.logoPrimary`
- `branding.logoWhite`
- `branding.logoMark`
- `branding.favicon`

### Required Hero
- `hero.mainImage`

### Required Services
- `services.fizioterapi`
- `services.elektroterapi`
- `services.ultraze`
- `services.limfodrenazh`
- `services.shockwave`
- `services.hixhame`

### Required Treatments
- `treatments.qafeShpine`
- `treatments.nyje`
- `treatments.ortopedike`
- `treatments.reumatike`
- `treatments.pediatrike`

### Optional
- `hero.backgroundImage`
- `general.homeVisit`
- `general.approach`
- `general.about`
- `general.cta`
- `general.ogDefault`

Publish the singleton after uploading assets. The frontend will switch automatically to Sanity CDN assets; no extra frontend code change is required.
