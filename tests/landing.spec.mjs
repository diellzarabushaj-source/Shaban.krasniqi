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
      const interactive=[...document.querySelectorAll('a[href],button,summary,input:not([type="hidden"]),select,textarea,.problem-choice')]
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
  await page.locator('[data-home-city]').selectOption('Deçan');
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
  expect(decoded).toContain('google.com/maps/search/?api=1');
  expect(decoded).toContain('Rruga%20Test%2C%20De%C3%A7an');
  expect(decoded).toContain('Dhimbja është më e fortë gjatë ecjes.');
});


test('Peja and Decan street autocomplete is keyboard and mobile friendly', async ({page}) => {
  await page.route('**/api/addresses**', async route => {
    const url=new URL(route.request().url());
    const q=(url.searchParams.get('q')||'').toLowerCase();
    const all=[
      {label:'Rruga Mbretëresha Teutë, Pejë',road:'Rruga Mbretëresha Teutë',city:'Pejë',lat:42.6601,lng:20.2895,source:'AKK'},
      {label:'Rruga Adem Jashari, Pejë',road:'Rruga Adem Jashari',city:'Pejë',lat:42.661,lng:20.292,source:'AKK'},
      {label:'Rruga Luan Haradinaj, Deçan',road:'Rruga Luan Haradinaj',city:'Deçan',lat:42.54,lng:20.287,source:'AKK'},
      {label:'Rruga e Testit, Istog',road:'Rruga e Testit',city:'Istog',lat:42.78,lng:20.48,source:'AKK'}
    ];
    const records=q.includes('mbret')?all.filter(x=>x.road.includes('Mbret')):q.includes('luan')?all.filter(x=>x.road.includes('Luan')):all;
    await route.fulfill({status:200,contentType:'application/json',json:{records,source:'AKK'}});
  });
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  const input=page.locator('[data-home-address]');
  await input.fill('Mbret');
  await expect(page.locator('[data-address-suggestions]')).toBeVisible();
  await expect(page.locator('.wizard-address-option')).toHaveCount(1);
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('Rruga Mbretëresha Teutë');
  await expect(page.locator('[data-home-city]')).toHaveValue('Pejë');
  await expect(page.locator('[data-address-source]')).toContainText('Geoportali');

  await input.fill('Luan');
  await expect(page.locator('.wizard-address-option')).toHaveCount(1);
  await page.locator('.wizard-address-option').click();
  await expect(input).toHaveValue('Rruga Luan Haradinaj');
  await expect(page.locator('[data-home-city]')).toHaveValue('Deçan');

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});


test('mobile one tap GPS fills street and city automatically', async ({page,context}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:42.6595,longitude:20.2887});
  await page.route('**/api/reverse-location**', async route => {
    await route.fulfill({
      status:200,
      contentType:'application/json',
      json:{
        road:'Rruga Mbretëresha Teutë',
        city:'Pejë',
        locality:'Pejë',
        displayName:'Rruga Mbretëresha Teutë, Pejë, Kosovo',
        inServiceArea:true,
        source:'OpenStreetMap'
      }
    });
  });
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  const gps=page.locator('[data-use-location]');
  await expect(gps).toContainText('Gjej ku jam');
  await expect(page.locator('[data-location-status]')).toContainText('Një prekje');

  await gps.click();

  await expect(page.locator('[data-home-address]')).toHaveValue('Rruga Mbretëresha Teutë');
  await expect(page.locator('[data-home-city]')).toHaveValue('Pejë');
  await expect(page.locator('[data-home-lat]')).toHaveValue('42.659500');
  await expect(page.locator('[data-home-lng]')).toHaveValue('20.288700');
  await expect(page.locator('[data-home-map]')).toBeVisible();
  await expect(page.locator('[data-location-status]')).toContainText('Je këtu:');
  await expect(page.locator('[data-address-source]')).toContainText('automatikisht nga GPS');
  await expect(gps).toHaveClass(/is-success/);
});

test('desktop GPS keeps existing behavior and skips reverse lookup', async ({page,context}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:42.6595,longitude:20.2887});
  let reverseCalls=0;
  await page.route('**/api/reverse-location**', async route => {
    reverseCalls++;
    await route.abort();
  });
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/#ne-shtepi');

  await expect(page.locator('[data-use-location]')).not.toHaveAttribute('data-smart-location','true');
  await expect(page.locator('[data-home-lat]')).toHaveValue('42.659500');
  expect(reverseCalls).toBe(0);
});

test('mobile keeps GPS coordinates when reverse address lookup fails', async ({page,context}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:42.6595,longitude:20.2887});
  await page.route('**/api/reverse-location**', async route => {
    await route.fulfill({status:504,contentType:'application/json',json:{error:'reverse_lookup_timeout'}});
  });
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  await page.locator('[data-use-location]').click();
  await expect(page.locator('[data-home-lat]')).toHaveValue('42.659500');
  await expect(page.locator('[data-home-map]')).toBeVisible();
  await expect(page.locator('[data-location-status]')).toContainText('Harta është gati');
});

test('denied GPS falls through to street search instead of a dead end', async ({page}) => {
  await page.route('**/api/addresses**', async route => {
    await route.fulfill({
      status:200,
      contentType:'application/json',
      json:{
        source:'AKK',
        records:[
          {label:'Rruga Luan Haradinaj, Deçan',road:'Rruga Luan Haradinaj',city:'Deçan',lat:42.54,lng:20.287,source:'AKK'}
        ]
      }
    });
  });
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'geolocation',{
      configurable:true,
      value:{
        getCurrentPosition(success,error){
          error({code:1,message:'permission denied'});
        }
      }
    });
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  const gps=page.locator('[data-use-location]');
  const address=page.locator('[data-home-address]');
  await gps.click();

  await expect(gps).toHaveClass(/is-manual/);
  await expect(gps).toContainText('Shkruaj adresën');
  await expect(page.locator('[data-location-status]')).toContainText('Pejë dhe Deçan');
  await expect(address).toBeFocused();

  await address.fill('Luan');
  await expect(page.locator('.wizard-address-option')).toHaveCount(1);
  await page.locator('.wizard-address-option').click();
  await expect(page.locator('[data-home-city]')).toHaveValue('Deçan');
  await expect(page.locator('[data-location-status]')).toContainText('Lokacioni është gati');
});


test('manual location requires both a street and Peja or Decan', async ({page}) => {
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  const address=page.locator('[data-home-address]');
  const city=page.locator('[data-home-city]');
  const next=page.locator('[data-wizard-next]');

  await address.fill('Rruga Test');
  await next.click();
  await expect(page.locator('[data-wizard-current]')).toHaveText('6');
  await expect(city).toHaveAttribute('aria-invalid','true');

  await city.selectOption('Pejë');
  await next.click();
  await expect(page.locator('[data-wizard-current]')).toHaveText('7');
});

test('editing a manual address clears stale GPS coordinates and map', async ({page,context}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:42.6595,longitude:20.2887});
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  await page.locator('[data-use-location]').click();
  await expect(page.locator('[data-use-location]')).toHaveClass(/is-success/);
  await expect(page.locator('[data-home-lat]')).not.toHaveValue('');
  await expect(page.locator('[data-home-map]')).toBeVisible();

  await page.locator('[data-home-address]').fill('Rruga Test');
  await page.locator('[data-home-city]').selectOption('Deçan');

  await expect(page.locator('[data-home-lat]')).toHaveValue('');
  await expect(page.locator('[data-home-lng]')).toHaveValue('');
  await expect(page.locator('[data-home-map]')).toBeHidden();
  await expect(page.locator('[data-map-placeholder]')).toBeVisible();
  await expect(page.locator('[data-location-status]')).toContainText('adresën e shkruar');
  await expect(page.locator('[data-open-maps]')).toHaveAttribute('href',/Rruga%20Test%2C%20De%C3%A7an/);
});

test('street autocomplete ignores stale slower responses', async ({page}) => {
  await page.route('**/api/addresses**', async route => {
    const url=new URL(route.request().url());
    const q=url.searchParams.get('q')||'';
    if(q.includes('ad')){
      await new Promise(resolve=>setTimeout(resolve,350));
      await route.fulfill({
        status:200,contentType:'application/json',
        json:{source:'AKK',records:[{road:'Rruga Adem Jashari',city:'Pejë',source:'AKK'}]}
      });
      return;
    }
    await route.fulfill({
      status:200,contentType:'application/json',
      json:{source:'AKK',records:[{road:'Rruga Luan Haradinaj',city:'Deçan',source:'AKK'}]}
    });
  });
  await page.addInitScript(()=>{
    sessionStorage.setItem('shaban-home-visit-v3',JSON.stringify({
      step:6,name:'Test',phone:'049 111 222',date:'2099-09-09',
      timePreset:'14:00',problems:['Dhimbje të nyjeve']
    }));
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#ne-shtepi');

  const address=page.locator('[data-home-address]');
  await address.fill('Ad');
  await page.waitForTimeout(210);
  await address.fill('Luan');

  await expect(page.locator('.wizard-address-option')).toHaveCount(1);
  await expect(page.locator('.wizard-address-option')).toContainText('Luan Haradinaj');
  await page.waitForTimeout(450);
  await expect(page.locator('.wizard-address-option')).toContainText('Luan Haradinaj');
});

test('navbar geometry stays fixed between top and deep section', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  const shell=page.locator('.nav-shell');
  const logo=page.locator('.brand-official');
  const before={shell:await shell.boundingBox(),logo:await logo.boundingBox()};
  await page.locator('#pyetje').scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const after={shell:await shell.boundingBox(),logo:await logo.boundingBox()};
  expect(Math.round(after.shell?.height||0)).toBe(Math.round(before.shell?.height||0));
  expect(Math.round(after.logo?.width||0)).toBe(Math.round(before.logo?.width||0));
  expect(Math.round(after.logo?.height||0)).toBe(Math.round(before.logo?.height||0));
});

test('homepage exposes local SEO essentials for Peja', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Fizioterapi në Pejë/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://diellzarabushaj-source.github.io/Shaban.krasniqi/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',/Pejë/);
  const jsonLd=await page.locator('script[type="application/ld+json"]').evaluate(el=>el.textContent||'');
  expect(jsonLd).toContain('Pejë');
  await expect(page.locator('.hero-copy')).toContainText('Fizioterapi në Pejë');
  await expect(page.locator('.hero-copy > .eyebrow')).toHaveCount(0);
});
