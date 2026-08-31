const qualityStyle=document.createElement('style');
qualityStyle.textContent=':root{--blue-500:#1466d9}.service-number{color:var(--blue-500)}.closing h2 span{color:var(--white)}.site-nav>a:not(.nav-cta),.footer-links a{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px}';
document.head.append(qualityStyle);

const header=document.querySelector('[data-header]');
const toggle=document.querySelector('[data-menu-toggle]');
const nav=document.querySelector('[data-site-nav]');
const year=document.querySelector('[data-year]');

const setHeaderState=()=>header?.classList.toggle('scrolled',window.scrollY>12);
setHeaderState();
window.addEventListener('scroll',setHeaderState,{passive:true});
if(year)year.textContent=new Date().getFullYear();

if(toggle&&nav){
  const closeMenu=()=>{
    toggle.setAttribute('aria-expanded','false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
  };
  toggle.addEventListener('click',()=>{
    const isOpen=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!isOpen));
    nav.classList.toggle('open',!isOpen);
    document.body.classList.toggle('menu-open',!isOpen);
  });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  window.addEventListener('resize',()=>{if(window.innerWidth>860)closeMenu()});
}

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals=document.querySelectorAll('.reveal');
if(reduceMotion||!('IntersectionObserver' in window)){
  reveals.forEach(el=>el.classList.add('is-visible'));
}else{
  const observer=new IntersectionObserver((entries,io)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const delay=Number(entry.target.dataset.delay||0);
      window.setTimeout(()=>entry.target.classList.add('is-visible'),delay);
      io.unobserve(entry.target);
    });
  },{threshold:.12,rootMargin:'0px 0px -40px'});
  reveals.forEach(el=>observer.observe(el));
}
