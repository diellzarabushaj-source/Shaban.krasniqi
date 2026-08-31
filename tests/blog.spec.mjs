import {test,expect} from '@playwright/test';

const posts=[
  {
    title:'Dhimbja e shpinës: çfarë duhet të dini',
    slug:{current:'dhimbja-e-shpines'},
    excerpt:'Një udhëzues praktik për lëvizjen dhe rehabilitimin.',
    publishedAt:'2026-08-30T10:00:00Z',
    featured:true,
    coverImage:null,
    category:{title:'Shpinë',slug:{current:'shpine'}},
    authorRef:{name:'Shaban Krasniqi',role:'Fizioterapist',image:{asset:{_ref:'image-authoravatar-100x100-png'}},bio:[{_type:'block',style:'normal',children:[{text:'Fizioterapist me fokus në rehabilitim funksional.',marks:[]}],markDefs:[]}]}
  },
  {
    title:'Rikthimi në aktivitet pas lëndimit',
    slug:{current:'rikthimi-ne-aktivitet'},
    excerpt:'Si ndërtohet progresi gradual.',
    publishedAt:'2026-08-28T10:00:00Z',
    featured:false,
    coverImage:null,
    category:{title:'Rehabilitim',slug:{current:'rehabilitim'}},
    authorRef:{name:'Shaban Krasniqi',role:'Fizioterapist',image:{asset:{_ref:'image-authoravatar-100x100-png'}}}
  }
];

test.beforeEach(async({page})=>{
  await page.route('**/cdn.sanity.io/images/**',async route=>{
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    await route.fulfill({status:200,contentType:'image/png',body:png});
  });
  await page.route('**/data/query/production*',async route=>{
    const url=decodeURIComponent(route.request().url());
    if(url.includes('slug.current == "dhimbja-e-shpines"')){
      await route.fulfill({json:{result:{...posts[0],body:[
        {_type:'block',style:'normal',children:[{text:'Ky është paragrafi hyrës.',marks:[]}],markDefs:[]},
        {_type:'block',style:'h2',children:[{text:'Pse ndodh dhimbja?',marks:[]}],markDefs:[]},
        {_type:'block',style:'normal',children:[{text:'Vlerësimi individual ndihmon në planifikim.',marks:['strong']}],markDefs:[]}
      ]}}});
    }else if(url.includes('slug.current != "dhimbja-e-shpines"')){
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
    await expect(page.locator('[data-blog-count]')).toContainText('2 artikuj');
    await expect(page.locator('.featured-card')).toBeVisible();
    await expect(page.locator('.blog-card')).toHaveCount(2);
    await expect(page.locator('.featured-card .blog-author')).toContainText('Shaban Krasniqi');
    await expect(page.locator('.blog-card').first().locator('.blog-author')).toContainText('Shaban Krasniqi');
    const blogAvatar=await page.locator('.blog-card').first().locator('.blog-author img').boundingBox();
    expect(blogAvatar?.width).toBeLessThanOrEqual(34);
    expect(blogAvatar?.height).toBeLessThanOrEqual(34);
    await page.locator('[data-blog-search]').fill('shpinës');
    await expect(page.locator('.blog-card')).toHaveCount(1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    if(viewport.name==='mobile'){
      await page.locator('[data-menu-toggle]').click();
      await expect(page.locator('[data-site-nav]')).toHaveClass(/open/);
    }
    await page.screenshot({path:'test-results/blog-'+viewport.name+'.png',fullPage:true});
  });

  test('article '+viewport.name,async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/post.html?slug=dhimbja-e-shpines');
    await expect(page.locator('[data-article]')).toBeVisible();
    await expect(page.locator('[data-article-title]')).toHaveText(posts[0].title);
    await expect(page.locator('[data-article-body] h2')).toHaveText('Pse ndodh dhimbja?');
    await expect(page.locator('[data-article-author]')).toContainText('Shaban Krasniqi');
    const articleAvatar=await page.locator('[data-article-author] img').boundingBox();
    expect(articleAvatar?.width).toBeLessThanOrEqual(44);
    expect(articleAvatar?.height).toBeLessThanOrEqual(44);
    await expect(page.locator('.article-author-card')).toHaveCount(0);
    await expect(page.locator('[data-related-posts] .blog-card')).toHaveCount(1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    await page.screenshot({path:'test-results/article-'+viewport.name+'.png',fullPage:true});
  });
}


test('homepage author image remains a small avatar',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.home-blog-card')).toHaveCount(2);
  const avatar=page.locator('.home-blog-card').first().locator('.home-blog-author img');
  await expect(avatar).toBeVisible();
  const box=await avatar.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(32);
  expect(box?.height).toBeLessThanOrEqual(32);
  await page.screenshot({path:'test-results/home-author-avatar-mobile.png',fullPage:true});
});
