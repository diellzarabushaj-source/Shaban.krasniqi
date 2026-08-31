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


const homeForm=document.querySelector('[data-home-form]');
if(homeForm){
  const nameInput=homeForm.querySelector('[data-home-name]');
  const phoneInput=homeForm.querySelector('[data-home-phone]');
  const addressInput=homeForm.querySelector('[data-home-address]');
  const noteInput=homeForm.querySelector('[data-home-note]');
  const latInput=homeForm.querySelector('[data-home-lat]');
  const lngInput=homeForm.querySelector('[data-home-lng]');
  const locationButton=homeForm.querySelector('[data-use-location]');
  const locationStatus=homeForm.querySelector('[data-location-status]');
  const locationError=homeForm.querySelector('[data-location-error]');
  const problemError=homeForm.querySelector('[data-problem-error]');
  const mapFrame=homeForm.querySelector('[data-home-map]');
  const mapPlaceholder=homeForm.querySelector('[data-map-placeholder]');

  const setLocationStatus=(text)=>{if(locationStatus)locationStatus.textContent=text};

  const setMap=(lat,lng)=>{
    const latitude=Number(lat);
    const longitude=Number(lng);
    const delta=.006;
    const bbox=[
      longitude-delta,
      latitude-delta,
      longitude+delta,
      latitude+delta
    ].join(',');
    if(mapFrame){
      mapFrame.src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+encodeURIComponent(latitude+','+longitude);
      mapFrame.hidden=false;
    }
    if(mapPlaceholder)mapPlaceholder.hidden=true;
  };

  const clearLocationError=()=>{
    if(locationError)locationError.hidden=true;
    addressInput?.removeAttribute('aria-invalid');
  };

  locationButton?.addEventListener('click',()=>{
    clearLocationError();
    if(!navigator.geolocation){
      setLocationStatus('Shfletuesi nuk e mbështet GPS-in. Shkruaj adresën më poshtë.');
      return;
    }
    locationButton.classList.remove('is-success');
    locationButton.classList.add('is-loading');
    locationButton.querySelector('span').textContent='Duke marrë lokacionin…';
    navigator.geolocation.getCurrentPosition(position=>{
      const lat=position.coords.latitude.toFixed(6);
      const lng=position.coords.longitude.toFixed(6);
      latInput.value=lat;
      lngInput.value=lng;
      setMap(lat,lng);
      setLocationStatus('Lokacioni u mor me sukses.');
      locationButton.classList.remove('is-loading');
      locationButton.classList.add('is-success');
      locationButton.querySelector('span').textContent='Lokacioni u shtua';
    },()=>{
      locationButton.classList.remove('is-loading');
      locationButton.querySelector('span').textContent='Përdor lokacionin tim';
      setLocationStatus('Nuk u mor lokacioni. Lejo GPS-in ose shkruaj adresën.');
    },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  });

  addressInput?.addEventListener('input',clearLocationError);
  homeForm.querySelectorAll('input[name="problem"]').forEach(input=>{
    input.addEventListener('change',()=>{if(problemError)problemError.hidden=true});
  });

  const validateHomeForm=()=>{
    let valid=true;
    for(const input of [nameInput,phoneInput]){
      if(!input.value.trim()){
        input.setAttribute('aria-invalid','true');
        valid=false;
      }else{
        input.removeAttribute('aria-invalid');
      }
    }
    const selected=[...homeForm.querySelectorAll('input[name="problem"]:checked')];
    if(!selected.length){
      if(problemError)problemError.hidden=false;
      valid=false;
    }
    const hasCoords=Boolean(latInput.value&&lngInput.value);
    const hasAddress=Boolean(addressInput.value.trim());
    if(!hasCoords&&!hasAddress){
      if(locationError)locationError.hidden=false;
      addressInput.setAttribute('aria-invalid','true');
      valid=false;
    }
    return valid;
  };

  homeForm.addEventListener('submit',event=>{
    event.preventDefault();
    if(!validateHomeForm()){
      const firstInvalid=homeForm.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    const problems=[...homeForm.querySelectorAll('input[name="problem"]:checked')]
      .map(input=>input.value)
      .join(', ');

    const hasCoords=Boolean(latInput.value&&lngInput.value);
    const mapLink=hasCoords
      ? 'https://maps.google.com/?q='+latInput.value+','+lngInput.value
      : 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(addressInput.value.trim());

    const lines=[
      'Përshëndetje Shaban, dua të kërkoj një vizitë fizioterapie në shtëpi.',
      '',
      'Emri dhe mbiemri: '+nameInput.value.trim(),
      'Telefoni: '+phoneInput.value.trim(),
      'Problemi: '+problems,
      'Adresa: '+(addressInput.value.trim()||'Lokacioni i dërguar me GPS'),
      'Harta: '+mapLink
    ];

    if(noteInput.value.trim()){
      lines.push('Shënim: '+noteInput.value.trim());
    }

    lines.push('', 'A mund të më tregoni kur keni termin të lirë për vizitë në shtëpi?');

    const url='https://wa.me/38649884785?text='+encodeURIComponent(lines.join('\n'));
    window.open(url,'_blank','noopener,noreferrer');
  });
}
