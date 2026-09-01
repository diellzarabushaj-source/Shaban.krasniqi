import {test,expect} from '@playwright/test';

const matrix=[
  {width:320,height:720},
  {width:360,height:800},
  {width:390,height:844},
  {width:430,height:932},
  {width:768,height:1024}
];

for(const viewport of matrix){
  test('responsive shell '+viewport.width+'px',async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const layout=await page.evaluate(()=>{
      const root=document.documentElement;
      const key=[...document.querySelectorAll('.hero-shell,.hero-portrait-card,.home-booking-card,.service-card,.treatment-card,.package-card,.approach-panel,.why-card,.closing-card')]
        .filter(el=>getComputedStyle(el).display!=='none')
        .map(el=>{
          const r=el.getBoundingClientRect();
          return {name:el.className,width:r.width,left:r.left,right:r.right};
        });
      return {
        overflow:Math.max(0,root.scrollWidth-root.clientWidth),
        viewport:root.clientWidth,
        escaped:key.filter(x=>x.left<-1||x.right>root.clientWidth+1)
      };
    });
    expect(layout.overflow).toBe(0);
    expect(layout.escaped).toEqual([]);

    const toggle=page.locator('[data-menu-toggle]');
    await expect(toggle).toBeVisible();
    const toggleBox=await toggle.boundingBox();
    expect(toggleBox?.width||0).toBeGreaterThanOrEqual(44);
    expect(toggleBox?.height||0).toBeGreaterThanOrEqual(44);

    await toggle.click();
    await expect(page.locator('[data-site-nav]')).toHaveClass(/open/);
    const navTargets=await page.locator('[data-site-nav] a').evaluateAll(els=>els.map(el=>{
      const r=el.getBoundingClientRect();
      return {width:r.width,height:r.height,right:r.right,left:r.left};
    }));
    expect(navTargets.every(t=>t.width>=44&&t.height>=44&&t.left>=0&&t.right<=document.documentElement.clientWidth+1)).toBeTruthy();
    await page.keyboard.press('Escape');

    const fixedDock=page.locator('.contact-dock');
    await expect(fixedDock).toBeVisible();
    const dockBox=await fixedDock.boundingBox();
    expect(dockBox?.left||0).toBeGreaterThanOrEqual(0);
    expect((dockBox?.x||0)+(dockBox?.width||0)).toBeLessThanOrEqual(viewport.width+1);
  });
}
