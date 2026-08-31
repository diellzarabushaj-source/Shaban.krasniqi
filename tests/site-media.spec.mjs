import {test,expect} from '@playwright/test';

const cdn='https://cdn.sanity.io/images/a1lswl1z/production';
const image=(name,alt)=>({asset:{_id:'image-'+name,url:cdn+'/'+name+'.png'},alt});
const media={
  _id:'siteMedia',
  branding:{
    logoPrimary:image('logo-primary','Shaban Krasniqi Fizioterapi'),
    logoWhite:image('logo-white','Shaban Krasniqi Fizioterapi'),
    logoMark:image('logo-mark','Shaban Krasniqi'),
    favicon:image('favicon','Shaban Krasniqi')
  },
  hero:{
    mainImage:image('hero','Shaban Krasniqi, fizioterapeut'),
    backgroundImage:null
  },
  services:{
    fizioterapi:image('service-fizioterapi','Fizioterapi'),
    elektroterapi:image('service-elektroterapi','Elektroterapi'),
    ultraze:image('service-ultraze','Ultrazë terapeutike'),
    limfodrenazh:image('service-limfodrenazh','Limfodrenazh'),
    shockwave:image('service-shockwave','Shockwave'),
    hixhame:image('service-hixhame','Hixhame')
  },
  treatments:{
    qafeShpine:image('treatment-qafe-shpine','Dhimbje të qafës dhe shpinës'),
    nyje:image('treatment-nyje','Dhimbje të nyjeve'),
    ortopedike:image('treatment-ortopedike','Probleme ortopedike'),
    reumatike:image('treatment-reumatike','Probleme reumatike'),
    pediatrike:image('treatment-pediatrike','Probleme pediatrike')
  },
  general:{ogDefault:image('og-default','Fizioterapia Shaban Krasniqi')}
};

test('siteMedia binds all landing image slots without layout overflow',async({page})=>{
  await page.route('**/cdn.sanity.io/images/**',async route=>{
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    await route.fulfill({status:200,contentType:'image/png',body:png});
  });

  await page.route('**/data/query/production*',async route=>{
    const query=new URL(route.request().url()).searchParams.get('query')||'';
    if(query.includes('_type == "siteMedia"')){
      await route.fulfill({json:{result:media}});
    }else{
      await route.fulfill({json:{result:[]}});
    }
  });

  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  await expect.poll(()=>page.locator('html').getAttribute('data-site-media')).toBe('ready');

  await expect(page.locator('.service-art img[data-sanity-bound="true"]')).toHaveCount(6);
  await expect(page.locator('.treatment-art img[data-sanity-bound="true"]')).toHaveCount(5);
  await expect(page.locator('.hero-portrait')).toHaveAttribute('alt','Shaban Krasniqi, fizioterapeut');
  await expect(page.locator('.brand-official .official-logo')).toHaveAttribute('src',/cdn\.sanity\.io/);
  await expect(page.locator('.official-closing-logo')).toHaveAttribute('src',/cdn\.sanity\.io/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href',/cdn\.sanity\.io/);
  await expect(page.locator('[data-site-og-image]')).toHaveAttribute('content',/cdn\.sanity\.io/);

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('missing siteMedia keeps stable built-in visual fallback',async({page})=>{
  await page.route('**/data/query/production*',async route=>route.fulfill({json:{result:null}}));
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.brand-official .official-logo')).toHaveAttribute('src','assets/branding/logo-site-light.webp');
  await expect(page.locator('.service-art svg').first()).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
