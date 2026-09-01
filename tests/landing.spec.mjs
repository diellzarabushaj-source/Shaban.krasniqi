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
      const interactive=[...document.querySelectorAll('a[href],button,summary,input:not([type="hidden"]),textarea,.problem-choice')]
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
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-site-nav]')).not.toHaveClass(/open/);
      await expect(page.locator('[data-menu-toggle]')).toHaveAttribute('aria-expanded','false');
    }

    const contrastSamples=await page.evaluate(()=>{
      const get=(selector)=>{
        const el=document.querySelector(selector);
        return el?getComputedStyle(el).color:null;
      };
      return {
        hero:get('.hero-lede'),
        service:get('.service-card p'),
        treatment:get('.treatment-card p'),
        nav:get('.site-nav > a:not(.nav-cta)'),
        closing:get('.closing-copy p')
      };
    });

    for(const [name,value] of Object.entries(contrastSamples)){
      expect(value, name+' contrast selector should exist').not.toBeNull();
    }

    const checks=[
      ['hero',contrastSamples.hero,'rgb(255, 255, 255)'],
      ['service',contrastSamples.service,'rgb(255, 255, 255)'],
      ['treatment',contrastSamples.treatment,'rgb(255, 255, 255)'],
      ['nav',contrastSamples.nav,'rgb(255, 255, 255)'],
      ['nav-cta','rgb(255, 255, 255)','rgb(20, 120, 146)'],
      ['primary-button','rgb(255, 255, 255)','rgb(20, 120, 146)'],
      ['closing-copy',contrastSamples.closing,'rgb(0, 27, 54)']
    ].map(([name,fg,bg])=>({name,value:ratio(rgbToArray(fg),rgbToArray(bg))}));

    console.log(viewport.name+' contrast '+JSON.stringify(checks.map(c=>({name:c.name,ratio:Number(c.value.toFixed(2))}))));
    expect(Math.min(...checks.map(c=>c.value))).toBeGreaterThanOrEqual(4.5);

    const contactLinks=await page.locator('a[href^="https://wa.me/38649884785"]').count();
    expect(contactLinks).toBeGreaterThanOrEqual(12);
    const phoneLinks=await page.locator('a[href="tel:+38649884785"]').count();
    expect(phoneLinks).toBeGreaterThanOrEqual(2);
    console.log(viewport.name+' contact links '+JSON.stringify({whatsapp:contactLinks,phone:phoneLinks}));

    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({latitude:42.6595,longitude:20.2887});

    await page.locator('[data-home-name]').fill('Test Pacienti');
    await page.locator('[data-wizard-next]').click();
    await expect(page.locator('[data-wizard-current]')).toHaveText('2');

    await page.locator('[data-home-phone]').fill('049 111 222');
    await page.locator('[data-wizard-next]').click();

    await page.locator('.wizard-choice').filter({has:page.locator('input[value="Dhimbje të qafës dhe shpinës"]')}).click();
    await page.locator('.wizard-choice').filter({has:page.locator('input[value="Dhimbje të nyjeve"]')}).click();
    await page.locator('[data-wizard-next]').click();

    const today=await page.evaluate(()=>{
      const d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
      return d.getFullYear()+'-'+m+'-'+day;
    });
    await page.locator('[data-home-date]').fill(today);
    await page.locator('[data-wizard-next]').click();

    await page.locator('.wizard-time').filter({has:page.locator('input[value="14:00"]')}).click();
    await page.locator('[data-wizard-next]').click();

    await page.locator('[data-use-location]').click();
    await expect(page.locator('[data-use-location]')).toHaveClass(/is-success/);
    await page.locator('[data-wizard-next]').click();

    await page.locator('[data-home-note]').fill('Test shënim');
    await page.locator('[data-wizard-next]').click();
    await expect(page.locator('[data-wizard-current]')).toHaveText('8');
    await expect(page.locator('[data-summary-name]')).toHaveText('Test Pacienti');
    await expect(page.locator('[data-summary-datetime]')).toContainText('14:00');

    await page.evaluate(()=>{window.open=(url)=>{window.__homeVisitWhatsApp=url;return null}});
    await page.locator('[data-home-form]').evaluate(form=>form.requestSubmit());
    const homeVisitUrl=await page.evaluate(()=>window.__homeVisitWhatsApp);
    expect(homeVisitUrl).toContain('https://wa.me/38649884785?text=');
    expect(decodeURIComponent(homeVisitUrl)).toContain('Test Pacienti');
    expect(decodeURIComponent(homeVisitUrl)).toContain('Dhimbje të qafës dhe shpinës');
    expect(decodeURIComponent(homeVisitUrl)).toContain('Ora e preferuar: 14:00');
    expect(decodeURIComponent(homeVisitUrl)).toContain('maps.google.com/?q=42.659500,20.288700');

    await page.screenshot({path:'test-results/landing-'+viewport.name+'.png',fullPage:true});
  });
}


test('official logo assets render without legacy fallback', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');

  const headerLogo=page.locator('.brand-official .official-logo');
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute('src','assets/branding/logo-site-primary-clean.webp');
  expect(await headerLogo.evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)).toBe(true);

  await expect(page.locator('img[src*="assets/logo-mark.svg"]')).toHaveCount(0);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','assets/branding/favicon-64.png');

  const closingLogo=page.locator('.official-closing-logo');
  await closingLogo.scrollIntoViewIfNeeded();
  await expect(closingLogo).toHaveAttribute('src','assets/branding/logo-site-dark.webp');
  await expect.poll(()=>closingLogo.evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)).toBe(true);

  const footerLogo=page.locator('.official-footer-logo');
  await footerLogo.scrollIntoViewIfNeeded();
  await expect.poll(()=>footerLogo.evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)).toBe(true);
});


test('logo should occupy a real visible box', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  const logo=page.locator('.brand-official .official-logo');
  await expect(logo).toBeVisible();
  const box=await logo.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(180);
  expect(box?.height).toBeGreaterThanOrEqual(50);
  const css=await logo.evaluate((el)=>{
    const s=getComputedStyle(el);
    return {opacity:s.opacity,visibility:s.visibility,display:s.display};
  });
  expect(css.opacity).toBe('1');
  expect(css.visibility).toBe('visible');
  expect(css.display).not.toBe('none');
  expect(await logo.evaluate(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0)).toBe(true);
  await page.screenshot({path:'test-results/header-logo-visible.png',clip:{x:0,y:0,width:1440,height:130}});
});


test('local logo wrapper has no background',async({page})=>{
  await page.goto('/');
  const wrapper=page.locator('.brand-official');
  const css=await wrapper.evaluate(el=>{
    const s=getComputedStyle(el);
    return {backgroundImage:s.backgroundImage,backgroundColor:s.backgroundColor};
  });
  expect(css.backgroundImage).toBe('none');
  expect(css.backgroundColor).toBe('rgba(0, 0, 0, 0)');
});


test('65+ package pricing and personalized CTA', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');

  const section=page.locator('#paketat');
  await expect(section).toBeVisible();
  await expect(section).toContainText('65+');
  await expect(section).toContainText('25 €');
  await expect(section).toContainText('20 €');
  await expect(section).toContainText('100 € total');
  await expect(section).toContainText('Kursen 25 €');

  const cta=section.locator('.package-cta');
  await expect(cta).toBeVisible();
  const href=await cta.getAttribute('href');
  expect(href).toContain('https://wa.me/38649884785?text=');
  expect(decodeURIComponent(href||'')).toContain('Pakon 65+');
  expect(decodeURIComponent(href||'')).toContain('5 seanca');
  expect(decodeURIComponent(href||'')).toContain('20 €');
  expect(decodeURIComponent(href||'')).toContain('100 €');

  const visibleWhatsAppButtons=await page.locator('a,button').filter({hasText:'WhatsApp'}).count();
  expect(visibleWhatsAppButtons).toBe(0);

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('65+ package stays usable on mobile', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#paketat');
  const section=page.locator('#paketat');
  await expect(section).toBeVisible();
  await expect(section.locator('.package-cta')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});


test('wizard restores session state after reload', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');
  await page.locator('[data-home-name]').fill('Arta Test');
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-home-phone]').fill('+38349123456');
  await page.waitForTimeout(180);
  await page.reload();
  await expect(page.locator('[data-wizard-current]')).toHaveText('2');
  await expect(page.locator('[data-home-name]')).toHaveValue('Arta Test');
  await expect(page.locator('[data-home-phone]')).toHaveValue('+383 49 123 456');
});

test('wizard has branded identity and mobile-safe location fallbacks', async ({page}) => {
  await page.setViewportSize({width:430,height:932});
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.goto('/#ne-shtepi');
  const logo=page.locator('.wizard-brand-logo');
  await expect(logo).toBeVisible();
  expect((await logo.boundingBox())?.height).toBeGreaterThanOrEqual(36);

  await expect(page.locator('[data-wizard-current]')).toHaveText('6');
  await expect(page.locator('[data-open-maps]')).toBeVisible();
  await expect(page.locator('[data-home-address]')).toBeVisible();
  await expect(page.locator('[data-home-city]')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('wizard personalized message contains structured patient context', async ({page,context}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:42.6595,longitude:20.2887});
  await page.goto('/#ne-shtepi');

  await page.locator('[data-home-name]').fill('Arta Berisha');
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-home-phone]').fill('049123456');
  await page.locator('[data-wizard-next]').click();
  await page.locator('.wizard-choice').filter({has:page.locator('input[value="Dhimbje të nyjeve"]')}).click();
  await page.locator('[data-wizard-next]').click();

  await page.locator('[data-home-date]').fill('2099-09-09');
  await page.locator('[data-wizard-next]').click();
  await page.locator('.wizard-time').filter({has:page.locator('input[name="timePreset"][value="14:00"]')}).click();
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-use-location]').click();
  await expect(page.locator('[data-use-location]')).toHaveClass(/is-success/);
  await page.locator('[data-home-address]').fill('Rruga Test');
  await page.locator('[data-home-city]').fill('Deçan');
  await page.locator('[data-home-location-note]').fill('Hyrja B, kati 2');
  await page.locator('[data-wizard-next]').click();
  await page.locator('[data-home-note]').fill('Dhimbja është më e fortë gjatë ecjes.');
  await page.locator('[data-wizard-next]').click();

  await page.evaluate(()=>{window.open=(url)=>{window.__personalizedVisit=url;return null}});
  await page.locator('[data-home-form]').evaluate(form=>form.requestSubmit());
  const url=await page.evaluate(()=>window.__personalizedVisit);
  const decoded=decodeURIComponent(url||'');
  expect(decoded).toContain('Përshëndetje Shaban');
  expect(decoded).toContain('*Arsyeja e vizitës*');
  expect(decoded).toContain('Arta Berisha');
  expect(decoded).toContain('Dhimbje të nyjeve');
  expect(decoded).toContain('Ora e preferuar: 14:00');
  expect(decoded).toContain('Rruga Test, Deçan');
  expect(decoded).toContain('Hyrja B, kati 2');
  expect(decoded).toContain('maps.google.com/?q=42.659500,20.288700');
  expect(decoded).toContain('Dhimbja është më e fortë gjatë ecjes.');
});
