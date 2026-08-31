import {test,expect} from '@playwright/test';

const viewports=[
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844}
];

function rgbToArray(value){
  const match=value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return match?match.slice(1,4).map(Number):null;
}
function luminance(rgb){
  const channels=rgb.map(v=>{
    const s=v/255;
    return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;
  });
  return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
}
function ratio(fg,bg){
  const a=luminance(fg),b=luminance(bg);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}

for(const viewport of viewports){
  test(viewport.name+' layout and accessibility gate',async({page})=>{
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const geometry=await page.evaluate(()=>{
      const root=document.documentElement;
      const interactive=[...document.querySelectorAll('a[href],button,summary')]
        .filter(el=>{
          const s=getComputedStyle(el),r=el.getBoundingClientRect();
          return !el.classList.contains('skip-link')&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0.01&&s.pointerEvents!=='none'&&r.width>0&&r.height>0;
        })
        .map(el=>{
          const r=el.getBoundingClientRect();
          return {label:(el.textContent||el.getAttribute('aria-label')||el.tagName).trim().replace(/\s+/g,' ').slice(0,80),width:Math.round(r.width*10)/10,height:Math.round(r.height*10)/10};
        });
      return {
        viewport:root.clientWidth,
        scrollWidth:root.scrollWidth,
        horizontalOverflow:Math.max(0,root.scrollWidth-root.clientWidth),
        touchViolations:interactive.filter(item=>item.width<44||item.height<44),
        targetCount:interactive.length
      };
    });

    console.log(viewport.name+' metrics '+JSON.stringify(geometry));
    expect(geometry.horizontalOverflow).toBe(0);
    expect(geometry.touchViolations).toEqual([]);

    if(viewport.name==='mobile'){
      await page.locator('[data-menu-toggle]').click();
      await expect(page.locator('[data-site-nav]')).toHaveClass(/open/);
      const mobileNavTargets=await page.locator('[data-site-nav] a').evaluateAll(els=>els.map(el=>{
        const r=el.getBoundingClientRect();return {w:r.width,h:r.height};
      }));
      expect(mobileNavTargets.every(t=>t.w>=44&&t.h>=44)).toBeTruthy();
    }

    const contrastSamples=await page.evaluate(()=>{
      const get=(selector)=>getComputedStyle(document.querySelector(selector)).color;
      return {
        hero:get('.hero-lede'),
        small:get('.visual-kicker'),
        service:get('.service-card p'),
        navCta:get('.nav-cta'),
        primary:get('.button-primary'),
        featured:get('.why-card-featured p'),
        closing:get('.closing-copy p')
      };
    });

    const checks=[
      ['hero',contrastSamples.hero,'rgb(255, 255, 255)'],
      ['small-label',contrastSamples.small,'rgb(255, 255, 255)'],
      ['service',contrastSamples.service,'rgb(255, 255, 255)'],
      ['nav-cta',contrastSamples.navCta,'rgb(6, 27, 63)'],
      ['primary-button',contrastSamples.primary,'rgb(10, 104, 232)'],
      ['featured-copy',contrastSamples.featured,'rgb(11, 63, 147)'],
      ['closing-copy',contrastSamples.closing,'rgb(7, 75, 170)']
    ].map(([name,fg,bg])=>({name,value:ratio(rgbToArray(fg),rgbToArray(bg))}));

    console.log(viewport.name+' contrast '+JSON.stringify(checks.map(c=>({name:c.name,ratio:Number(c.value.toFixed(2))}))));
    expect(Math.min(...checks.map(c=>c.value))).toBeGreaterThanOrEqual(4.5);

    await page.screenshot({path:'test-results/landing-'+viewport.name+'.png',fullPage:true});
  });
}
