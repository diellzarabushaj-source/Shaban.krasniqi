import {test,expect} from '@playwright/test';

test('floating navbar effect activates without changing geometry',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const shell=page.locator('.nav-shell');
  const before=await shell.boundingBox();
  const topCss=await shell.evaluate(el=>{
    const s=getComputedStyle(el);
    return {radius:s.borderRadius,shadow:s.boxShadow,background:s.backgroundColor};
  });

  await page.locator('#qasja').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await expect(page.locator('[data-header]')).toHaveClass(/scrolled/);

  const after=await shell.boundingBox();
  const scrolledCss=await shell.evaluate(el=>{
    const s=getComputedStyle(el);
    return {
      radius:s.borderRadius,
      shadow:s.boxShadow,
      backdrop:s.backdropFilter||s.webkitBackdropFilter,
      marginTop:s.marginTop
    };
  });
  const progress=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scroll-progress'))||0);

  expect(Math.round(after?.height||0)).toBe(Math.round(before?.height||0));
  expect(parseFloat(scrolledCss.radius)).toBeGreaterThanOrEqual(20);
  expect(scrolledCss.shadow).not.toBe('none');
  expect(scrolledCss.backdrop).toContain('blur');
  expect(parseFloat(scrolledCss.marginTop)).toBeGreaterThan(0);
  expect(progress).toBeGreaterThan(5);
  expect(topCss.radius).not.toBe(scrolledCss.radius);
});

test('mobile menu uses polished visible state and remains accessible',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const toggle=page.locator('[data-menu-toggle]');
  const nav=page.locator('[data-site-nav]');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(nav).toHaveClass(/open/);
  await expect(nav).toHaveCSS('opacity','1');

  const css=await nav.evaluate(el=>{
    const s=getComputedStyle(el);
    return {opacity:Number(s.opacity),visibility:s.visibility,pointerEvents:s.pointerEvents};
  });
  expect(css.opacity).toBeGreaterThan(.95);
  expect(css.visibility).toBe('visible');
  expect(css.pointerEvents).not.toBe('none');

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('reduced motion keeps final static UI state',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');

  const reveal=page.locator('.hero-copy');
  const revealCss=await reveal.evaluate(el=>{
    const s=getComputedStyle(el);
    return {opacity:s.opacity,filter:s.filter,transform:s.transform};
  });
  const orbAnimation=await page.locator('.hero-orb-a').evaluate(el=>getComputedStyle(el).animationName);

  expect(revealCss.opacity).toBe('1');
  expect(revealCss.filter).toBe('none');
  expect(revealCss.transform).toBe('none');
  expect(orbAnimation).toBe('none');
});
