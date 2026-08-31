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
  const steps=[...homeForm.querySelectorAll('[data-wizard-step]')];
  const currentEl=document.querySelector('[data-wizard-current]');
  const totalEl=document.querySelector('[data-wizard-total]');
  const progressEl=document.querySelector('[data-wizard-progress]');
  const nextButton=homeForm.querySelector('[data-wizard-next]');
  const backButton=homeForm.querySelector('[data-wizard-back]');
  const controls=homeForm.querySelector('[data-wizard-controls]');

  const nameInput=homeForm.querySelector('[data-home-name]');
  const phoneInput=homeForm.querySelector('[data-home-phone]');
  const dateInput=homeForm.querySelector('[data-home-date]');
  const timeInput=homeForm.querySelector('[data-home-time]');
  const addressInput=homeForm.querySelector('[data-home-address]');
  const noteInput=homeForm.querySelector('[data-home-note]');
  const latInput=homeForm.querySelector('[data-home-lat]');
  const lngInput=homeForm.querySelector('[data-home-lng]');
  const locationButton=homeForm.querySelector('[data-use-location]');
  const locationStatus=homeForm.querySelector('[data-location-status]');
  const locationError=homeForm.querySelector('[data-location-error]');
  const problemError=homeForm.querySelector('[data-problem-error]');
  const nameError=homeForm.querySelector('[data-name-error]');
  const phoneError=homeForm.querySelector('[data-phone-error]');
  const dateError=homeForm.querySelector('[data-date-error]');
  const timeError=homeForm.querySelector('[data-time-error]');
  const mapFrame=homeForm.querySelector('[data-home-map]');
  const mapPlaceholder=homeForm.querySelector('[data-map-placeholder]');
  const timePresets=[...homeForm.querySelectorAll('input[name="timePreset"]')];

  let currentStep=1;

  const localDateString=()=>{
    const d=new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  };
  if(dateInput)dateInput.min=localDateString();

  const formatDate=(value)=>{
    if(!value)return '';
    const [y,m,d]=value.split('-').map(Number);
    return new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(y,m-1,d));
  };

  const selectedProblems=()=>[...homeForm.querySelectorAll('input[name="problem"]:checked')].map(input=>input.value);
  const selectedTime=()=>timeInput.value||homeForm.querySelector('input[name="timePreset"]:checked')?.value||'';

  const updateProgress=()=>{
    if(currentEl)currentEl.textContent=String(currentStep);
    if(totalEl)totalEl.textContent=String(steps.length);
    if(progressEl)progressEl.style.width=((currentStep/steps.length)*100)+'%';
    if(backButton)backButton.hidden=currentStep===1;
    if(nextButton)nextButton.hidden=currentStep===steps.length;
    if(controls)controls.hidden=currentStep===steps.length;
  };

  const showStep=(number,direction='forward')=>{
    currentStep=Math.min(Math.max(number,1),steps.length);
    steps.forEach(step=>{
      const active=Number(step.dataset.wizardStep)===currentStep;
      step.hidden=!active;
      step.classList.toggle('is-active',active);
      if(active){
        step.style.animationName='none';
        requestAnimationFrame(()=>{
          step.style.animationName=direction==='back'?'wizardBackIn':'wizardIn';
        });
        const focusable=step.querySelector('input:not([type="checkbox"]):not([type="radio"]),textarea,button');
        window.setTimeout(()=>focusable?.focus({preventScroll:true}),80);
      }
    });
    updateProgress();
  };

  const clearError=(el,error)=>{
    el?.removeAttribute('aria-invalid');
    if(error)error.hidden=true;
  };

  const validateStep=()=>{
    if(currentStep===1){
      if(!nameInput.value.trim()){
        nameInput.setAttribute('aria-invalid','true');
        if(nameError)nameError.hidden=false;
        return false;
      }
    }
    if(currentStep===2){
      if(!phoneInput.value.trim()){
        phoneInput.setAttribute('aria-invalid','true');
        if(phoneError)phoneError.hidden=false;
        return false;
      }
    }
    if(currentStep===3){
      if(!selectedProblems().length){
        if(problemError)problemError.hidden=false;
        return false;
      }
    }
    if(currentStep===4){
      if(!dateInput.value){
        dateInput.setAttribute('aria-invalid','true');
        if(dateError)dateError.hidden=false;
        return false;
      }
    }
    if(currentStep===5){
      if(!selectedTime()){
        if(timeError)timeError.hidden=false;
        return false;
      }
    }
    if(currentStep===6){
      const hasCoords=Boolean(latInput.value&&lngInput.value);
      const hasAddress=Boolean(addressInput.value.trim());
      if(!hasCoords&&!hasAddress){
        addressInput.setAttribute('aria-invalid','true');
        if(locationError)locationError.hidden=false;
        return false;
      }
    }
    return true;
  };

  nameInput?.addEventListener('input',()=>clearError(nameInput,nameError));
  phoneInput?.addEventListener('input',()=>clearError(phoneInput,phoneError));
  dateInput?.addEventListener('change',()=>clearError(dateInput,dateError));
  addressInput?.addEventListener('input',()=>clearError(addressInput,locationError));
  homeForm.querySelectorAll('input[name="problem"]').forEach(input=>input.addEventListener('change',()=>{if(problemError)problemError.hidden=true}));
  timePresets.forEach(input=>input.addEventListener('change',()=>{
    if(timeInput)timeInput.value='';
    if(timeError)timeError.hidden=true;
  }));
  timeInput?.addEventListener('input',()=>{
    timePresets.forEach(input=>input.checked=false);
    if(timeError)timeError.hidden=true;
  });

  nextButton?.addEventListener('click',()=>{
    if(!validateStep())return;
    if(currentStep===7)updateSummary();
    showStep(currentStep+1);
  });
  backButton?.addEventListener('click',()=>showStep(currentStep-1,'back'));

  const setLocationStatus=(text)=>{if(locationStatus)locationStatus.textContent=text};
  const setMap=(lat,lng)=>{
    const latitude=Number(lat),longitude=Number(lng),delta=.006;
    const bbox=[longitude-delta,latitude-delta,longitude+delta,latitude+delta].join(',');
    if(mapFrame){
      mapFrame.src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+encodeURIComponent(latitude+','+longitude);
      mapFrame.hidden=false;
    }
    if(mapPlaceholder)mapPlaceholder.hidden=true;
  };

  locationButton?.addEventListener('click',()=>{
    clearError(addressInput,locationError);
    if(!navigator.geolocation){
      setLocationStatus('GPS nuk mbështetet. Shkruaj adresën.');
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
      setLocationStatus('Lokacioni u shtua.');
      locationButton.classList.remove('is-loading');
      locationButton.classList.add('is-success');
      locationButton.querySelector('span').textContent='Lokacioni u shtua';
    },()=>{
      locationButton.classList.remove('is-loading');
      locationButton.querySelector('span').textContent='Përdor lokacionin tim';
      setLocationStatus('Nuk u mor lokacioni. Lejo GPS-in ose shkruaj adresën.');
    },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  });

  function updateSummary(){
    const problems=selectedProblems().join(', ');
    const time=selectedTime();
    const location=addressInput.value.trim()||(latInput.value&&lngInput.value?'Lokacion GPS':'—');
    const set=(selector,value)=>{
      const el=homeForm.querySelector(selector);
      if(el)el.textContent=value||'—';
    };
    set('[data-summary-name]',nameInput.value.trim());
    set('[data-summary-phone]',phoneInput.value.trim());
    set('[data-summary-problem]',problems);
    set('[data-summary-datetime]',formatDate(dateInput.value)+' · '+time);
    set('[data-summary-location]',location);
  }

  homeForm.addEventListener('submit',event=>{
    event.preventDefault();
    updateSummary();

    const problems=selectedProblems().join(', ');
    const time=selectedTime();
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
      'Data e preferuar: '+formatDate(dateInput.value),
      'Ora e preferuar: '+time,
      'Adresa: '+(addressInput.value.trim()||'Lokacioni i dërguar me GPS'),
      'Harta: '+mapLink
    ];
    if(noteInput.value.trim())lines.push('Shënim: '+noteInput.value.trim());
    lines.push('','A mund ta konfirmoni nëse ky termin është i lirë?');

    window.open('https://wa.me/38649884785?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener,noreferrer');
  });

  showStep(1);
}
