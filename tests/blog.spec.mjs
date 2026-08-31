import {test,expect} from '@playwright/test';

const CDN='https://cdn.sanity.io/images/a1lswl1z/production';
const author={
  _id:'author-shaban',
  name:'MSc. Shaban Krasniqi',
  role:'Fizioterapeut',
  slug:{current:'shaban-krasniqi'},
  shortBio:'MSc. Shaban Krasniqi është fizioterapeut i fokusuar në rehabilitim funksional, lëvizje të sigurt dhe rikthim progresiv në aktivitet.',
  image:{asset:{_id:'image-author',url:CDN+'/author.png'}},
  specialties:['Rehabilitim muskuloskeletal','Menaxhim i dhimbjes','Ushtrime terapeutike','Rikthim në aktivitet','Vlerësim funksional'],
  education:[{title:'Master i Shkencave (MSc.)',description:'Studime të avancuara në fushën e fizioterapisë dhe rehabilitimit.'}],
  experience:'Qasje e fokusuar në rehabilitim funksional dhe rikthim progresiv në aktivitet.',
  languages:['Shqip','English'],
  approach:['Vlerësim individual','Trajtim i synuar','Edukimi i pacientit','Ushtrime progresive','Monitorim i përparimit'],
  bio:[{_type:'block',style:'normal',children:[{text:'Fizioterapeut me fokus në rehabilitim funksional.',marks:[]}],markDefs:[]}],
  seo:{
    title:'MSc. Shaban Krasniqi | Fizioterapeut',
    description:'Profili i MSc. Shaban Krasniqi — fizioterapeut i fokusuar në rehabilitim funksional.',
    noIndex:false
  }
};

const posts=[
  {
    _id:'post-1',
    title:'Si ta kuptosh më mirë dhimbjen gjatë lëvizjes',
    slug:{current:'si-ta-kuptosh-me-mire-dhimbjen-gjate-levizjes'},
    excerpt:'Një udhëzues i shkurtër mbi rëndësinë e vlerësimit, ngarkesës progresive dhe lëvizjes së kontrolluar.',
    publishedAt:'2026-08-31T18:00:00Z',
    featured:true,
    coverImage:{asset:{_id:'image-cover',url:CDN+'/cover.png'},alt:'Fizioterapi dhe lëvizje e kontrolluar'},
    category:{title:'Fizioterapi',slug:{current:'fizioterapi'},description:'Artikuj rreth fizioterapisë.'},
    author:{_id:author._id,name:author.name,role:author.role,slug:author.slug,image:author.image,shortBio:author.shortBio},
    seo:{title:'Dhimbja gjatë lëvizjes | Shaban Krasniqi',description:'Udhëzues për dhimbjen gjatë lëvizjes.',noIndex:false,image:null}
  },
  {
    _id:'post-2',
    title:'Rikthimi progresiv në aktivitet',
    slug:{current:'rikthimi-progresiv-ne-aktivitet'},
    excerpt:'Si ndërtohet një rikthim gradual në aktivitet.',
    publishedAt:'2026-08-30T12:00:00Z',
    featured:false,
    coverImage:{asset:{_id:'image-cover2',url:CDN+'/cover2.png'},alt:'Rikthim në aktivitet'},
    category:{title:'Rehabilitim',slug:{current:'rehabilitim'},description:'Artikuj rreth rehabilitimit.'},
    author:{_id:author._id,name:author.name,role:author.role,slug:author.slug,image:author.image}
  }
];

const article={...posts[0],body:[
  {_type:'block',style:'normal',children:[{text:'Ky është paragrafi hyrës.',marks:[]}],markDefs:[]},
  {_type:'block',style:'h2',children:[{text:'Pse ndodh dhimbja?',marks:[]}],markDefs:[]}
]};

test.beforeEach(async({page})=>{
  await page.route('**/cdn.sanity.io/images/**',async route=>{
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    await route.fulfill({status:200,contentType:'image/png',body:png});
  });

  await page.route('**/data/query/production*',async route=>{
    const requestUrl=new URL(route.request().url());
    const query=(requestUrl.searchParams.get('query')||'').replace(/\s+/g,' ').trim();
    if(query.includes('_type == "author"')&&query.includes('slug.current == $slug')){
      await route.fulfill({json:{result:{...author,posts}}});
    }else if(query.includes('_type == "post"')&&query.includes('slug.current == $slug')){
      await route.fulfill({json:{result:article}});
    }else if(query.includes('slug.current != $slug')){
      await route.fulfill({json:{result:[posts[1]]}});
    }else{
      await route.fulfill({json:{result:posts}});
    }
  });
});

for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  test('blog '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/blog.html');
    await expect(page.locator('[data-blog-count]')).toHaveText('2 artikuj');
    await expect(page.locator('.featured-card')).toBeVisible();
    await expect(page.locator('.blog-card')).toHaveCount(2);
    await expect(page.locator('.blog-card').first().locator('.blog-author')).toContainText('MSc. Shaban Krasniqi');
    await expect(page.locator('.blog-card').first().locator('.blog-author')).toHaveAttribute('href','author.html?slug=shaban-krasniqi');
    await expect(page.locator('.blog-card').first().locator('.blog-card-media img')).toHaveAttribute('alt','Fizioterapi dhe lëvizje e kontrolluar');
    const avatar=await page.locator('.blog-card').first().locator('.blog-author img').boundingBox();
    expect(avatar?.width).toBeLessThanOrEqual(34);
    expect(avatar?.height).toBeLessThanOrEqual(34);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    await page.screenshot({path:'test-results/blog-'+viewport.name+'.png',fullPage:true});
  });

  test('article '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/post.html?slug=si-ta-kuptosh-me-mire-dhimbjen-gjate-levizjes');
    await expect(page.locator('[data-article]')).toBeVisible();
    await expect(page.locator('[data-article-title]')).toHaveText(article.title);
    await expect(page.locator('[data-article-category]')).toHaveText('Fizioterapi');
    await expect(page.locator('[data-article-author]')).toContainText('MSc. Shaban Krasniqi');
    await expect(page.locator('[data-article-author] a')).toHaveAttribute('href','author.html?slug=shaban-krasniqi');
    await expect(page.locator('[data-article-cover] img')).toHaveAttribute('alt','Fizioterapi dhe lëvizje e kontrolluar');
    await expect(page.locator('meta[name="author"]')).toHaveAttribute('content','MSc. Shaban Krasniqi');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',article.seo.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',/post\.html\?slug=si-ta-kuptosh-me-mire-dhimbjen-gjate-levizjes/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    await page.screenshot({path:'test-results/article-'+viewport.name+'.png',fullPage:true});
  });

  test('author profile '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/author.html?slug=shaban-krasniqi');
    await expect(page.locator('[data-author-profile]')).toBeVisible();
    await expect(page.locator('[data-author-name]')).toHaveText('MSc. Shaban Krasniqi');
    await expect(page.locator('[data-author-role]')).toHaveText('Fizioterapeut');
    await expect(page.locator('[data-author-bio]')).toContainText('rehabilitim funksional');
    await expect(page.locator('[data-author-details]')).toContainText('Rehabilitim muskuloskeletal');
    await expect(page.locator('[data-author-details]')).toContainText('Master i Shkencave (MSc.)');
    await expect(page.locator('[data-author-posts] .blog-card')).toHaveCount(2);
    await expect(page.locator('[data-author-post-count]')).toHaveText('2 artikuj');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',author.seo.description);
    const ld=await page.locator('[data-author-jsonld]').textContent();
    expect(JSON.parse(ld)['@type']).toBe('Person');
    expect(JSON.parse(ld).name).toBe('MSc. Shaban Krasniqi');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    await page.screenshot({path:'test-results/author-'+viewport.name+'.png',fullPage:true});
  });
}

test('homepage blog is Sanity-backed and landing author avatar remains compact',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.home-blog-card')).toHaveCount(2);
  await expect(page.locator('.home-blog-card').first().locator('.home-blog-meta span')).toHaveText('Fizioterapi');
  await expect(page.locator('.home-blog-card').first().locator('.home-blog-author')).toHaveAttribute('href','author.html?slug=shaban-krasniqi');
  await expect(page.locator('.home-blog-card').first().locator('.home-blog-media img')).toHaveAttribute('alt','Fizioterapi dhe lëvizje e kontrolluar');
  const avatar=await page.locator('.home-blog-card').first().locator('.home-blog-author img').boundingBox();
  expect(avatar?.width).toBeLessThanOrEqual(32);
  expect(avatar?.height).toBeLessThanOrEqual(32);
});


test('official site logo is loaded on content pages',async({page})=>{
  await page.goto('/blog.html');
  const logo=page.locator('.brand-official .official-logo');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('src','assets/branding/logo-site-primary-clean.webp');
  expect(await logo.evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)).toBe(true);
  await expect(page.locator('img[src*="assets/logo-mark.svg"]')).toHaveCount(0);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','assets/branding/favicon-64.png');
});
