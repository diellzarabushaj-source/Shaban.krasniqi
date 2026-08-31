const header=document.querySelector('[data-header]');
const toggle=document.querySelector('[data-menu-toggle]');
const nav=document.querySelector('[data-site-nav]');
const scrim=document.querySelector('[data-menu-scrim]');
const year=document.querySelector('[data-year]');

const setHeaderState=()=>header?.classList.toggle('scrolled',window.scrollY>12);
setHeaderState();
window.addEventListener('scroll',setHeaderState,{passive:true});
if(year)year.textContent=new Date().getFullYear();

if(toggle&&nav){
  let closeTimer;
  const setToggleLabel=(open)=>{
    toggle.setAttribute('aria-expanded',String(open));
    const sr=toggle.querySelector('.sr-only');
    if(sr)sr.textContent=open?'Mbyll menynë':'Hap menynë';
  };
  const showScrim=()=>{
    if(!scrim)return;
    window.clearTimeout(closeTimer);
    scrim.hidden=false;
    requestAnimationFrame(()=>scrim.classList.add('is-visible'));
  };
  const hideScrim=()=>{
    if(!scrim)return;
    scrim.classList.remove('is-visible');
    closeTimer=window.setTimeout(()=>{scrim.hidden=true},230);
  };
  const closeMenu=({restoreFocus=false}={})=>{
    setToggleLabel(false);
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    hideScrim();
    if(restoreFocus)toggle.focus();
  };
  const openMenu=()=>{
    setToggleLabel(true);
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    showScrim();
  };

  toggle.addEventListener('click',()=>{
    toggle.getAttribute('aria-expanded')==='true'?closeMenu():openMenu();
  });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeMenu()));
  scrim?.addEventListener('click',()=>closeMenu({restoreFocus:true}));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){
      closeMenu({restoreFocus:true});
    }
  });
  window.addEventListener('resize',()=>{
    if(window.innerWidth>860)closeMenu();
  });
}

const sectionLinks=[...document.querySelectorAll('.site-nav > a[href^="#"]:not(.nav-cta)')];
const sections=sectionLinks
  .map(link=>({link,section:document.querySelector(link.getAttribute('href'))}))
  .filter(item=>item.section);

const setActiveSection=(id)=>{
  sections.forEach(({link,section})=>{
    const active=section.id===id;
    link.classList.toggle('is-active',active);
    if(active)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
};

if(sections.length&&'IntersectionObserver' in window){
  const visibility=new Map();
  const navObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>visibility.set(entry.target.id,entry.isIntersecting?entry.intersectionRatio:0));
    const active=[...visibility.entries()]
      .filter(([,ratio])=>ratio>0)
      .sort((a,b)=>b[1]-a[1])[0];
    if(active)setActiveSection(active[0]);
  },{rootMargin:'-22% 0px -58% 0px',threshold:[0,.15,.35,.6]});
  sections.forEach(({section})=>navObserver.observe(section));
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
