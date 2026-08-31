const header=document.querySelector('[data-header]');
const toggle=document.querySelector('[data-menu-toggle]');
const nav=document.querySelector('[data-site-nav]');
const scrim=document.querySelector('[data-menu-scrim]');
const year=document.querySelector('[data-year]');

if(year)year.textContent=new Date().getFullYear();

if(toggle&&nav){
  const closeMenu=()=>{
    toggle.setAttribute('aria-expanded','false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    if(scrim){scrim.hidden=true;scrim.classList.remove('is-visible')}
  };
  const openMenu=()=>{
    toggle.setAttribute('aria-expanded','true');
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    if(scrim){scrim.hidden=false;requestAnimationFrame(()=>scrim.classList.add('is-visible'))}
  };
  toggle.addEventListener('click',()=>toggle.getAttribute('aria-expanded')==='true'?closeMenu():openMenu());
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  scrim?.addEventListener('click',closeMenu);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
  window.addEventListener('resize',()=>{if(window.innerWidth>860)closeMenu()});
}
