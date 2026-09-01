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
  toggle.addEventListener('click',()=>toggle.getAttribute('aria-expanded')==='true'?closeMenu():openMenu());
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>closeMenu()));
  scrim?.addEventListener('click',()=>closeMenu({restoreFocus:true}));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu({restoreFocus:true});
  });
  window.addEventListener('resize',()=>{if(window.innerWidth>860)closeMenu();});
}

const sectionLinks=[...document.querySelectorAll('.site-nav > a[href^="#"]:not(.nav-cta)')];
const sections=sectionLinks.map(link=>({link,section:document.querySelector(link.getAttribute('href'))})).filter(item=>item.section);
const setActiveSection=(id)=>sections.forEach(({link,section})=>{
  const active=section.id===id;
  link.classList.toggle('is-active',active);
  if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
});
if(sections.length&&'IntersectionObserver' in window){
  const visibility=new Map();
  const navObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>visibility.set(entry.target.id,entry.isIntersecting?entry.intersectionRatio:0));
    const active=[...visibility.entries()].filter(([,ratio])=>ratio>0).sort((a,b)=>b[1]-a[1])[0];
    if(active)setActiveSection(active[0]);
  },{rootMargin:'-22% 0px -58% 0px',threshold:[0,.15,.35,.6]});
  sections.forEach(({section})=>navObserver.observe(section));
}

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals=document.querySelectorAll('.reveal');
if(reduceMotion||!('IntersectionObserver' in window))reveals.forEach(el=>el.classList.add('is-visible'));
else{
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
  const STORAGE_KEY='shaban-home-visit-v3';
  const WHATSAPP_NUMBER='38649884785';
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
  const cityInput=homeForm.querySelector('[data-home-city]');
  const locationNoteInput=homeForm.querySelector('[data-home-location-note]');
  const noteInput=homeForm.querySelector('[data-home-note]');
  const latInput=homeForm.querySelector('[data-home-lat]');
  const lngInput=homeForm.querySelector('[data-home-lng]');
  const accuracyInput=homeForm.querySelector('[data-home-accuracy]');
  const locationButton=homeForm.querySelector('[data-use-location]');
  const locationStatus=homeForm.querySelector('[data-location-status]');
  const locationError=homeForm.querySelector('[data-location-error]');
  const shareLocationButton=homeForm.querySelector('[data-share-location]');
  const copyLocationButton=homeForm.querySelector('[data-copy-location]');
  const openMapsLink=homeForm.querySelector('[data-open-maps]');
  const problemError=homeForm.querySelector('[data-problem-error]');
  const nameError=homeForm.querySelector('[data-name-error]');
  const phoneError=homeForm.querySelector('[data-phone-error]');
  const dateError=homeForm.querySelector('[data-date-error]');
  const timeError=homeForm.querySelector('[data-time-error]');
  const mapFrame=homeForm.querySelector('[data-home-map]');
  const mapPlaceholder=homeForm.querySelector('[data-map-placeholder]');
  const timePresets=[...homeForm.querySelectorAll('input[name="timePreset"]')];
  const problemInputs=[...homeForm.querySelectorAll('input[name="problem"]')];
  const coarsePointer=window.matchMedia?.('(pointer:coarse)').matches;
  let currentStep=1;
  let saveTimer=0;
  let locationRequestId=0;

  const safeStorage={
    get(){try{return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')}catch{return null}},
    set(value){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value))}catch{}},
    clear(){try{sessionStorage.removeItem(STORAGE_KEY)}catch{}}
  };

  const localDateString=()=>{
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  };
  if(dateInput)dateInput.min=localDateString();

  const formatDate=(value)=>{
    if(!value)return '';
    const [y,m,d]=value.split('-').map(Number);
    return new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(y,m-1,d));
  };

  const selectedProblems=()=>problemInputs.filter(input=>input.checked).map(input=>input.value);
  const selectedTime=()=>timeInput?.value||homeForm.querySelector('input[name="timePreset"]:checked')?.value||'';
  const mapLink=()=>{
    if(latInput?.value&&lngInput?.value)return 'https://maps.google.com/?q='+latInput.value+','+lngInput.value;
    const query=[addressInput?.value.trim(),cityInput?.value.trim()].filter(Boolean).join(', ');
    return query?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query):'';
  };

  const addressBox=homeForm.querySelector('[data-address-autocomplete]');
  const addressSuggestions=homeForm.querySelector('[data-address-suggestions]');
  const addressSource=homeForm.querySelector('[data-address-source]');
  const OFFICIAL_WFS='https://geoportal.rks-gov.net/wms/ows';
  const SERVICE_BBOX='20.10,42.45,20.60,42.85,EPSG:4326';
  const OFFICIAL_LAYERS=['KG_DEV_WS:RoadNameView','AR_DEV_WS:v_findAddresses','KG_DEV_WS:Addresses_in_geopoertal'];
  let officialAddressPromise=null;
  let addressDebounce=0;
  let activeAddressIndex=-1;
  let currentAddressMatches=[];

  const normalizeSearch=(value)=>String(value||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('sq-AL').trim();

  const featureCoordinate=(geometry)=>{
    const coords=geometry?.coordinates;
    if(!Array.isArray(coords))return null;
    if(typeof coords[0]==='number'&&typeof coords[1]==='number')return [coords[1],coords[0]];
    let node=coords;
    while(Array.isArray(node)&&Array.isArray(node[0]))node=node[0];
    return Array.isArray(node)&&typeof node[0]==='number'&&typeof node[1]==='number'?[node[1],node[0]]:null;
  };

  const extractOfficialRecord=(feature)=>{
    const props=feature?.properties||{};
    const entries=Object.entries(props)
      .filter(([,value])=>['string','number'].includes(typeof value)&&String(value).trim());
    const pick=(regex)=>entries.find(([key])=>regex.test(key))?.[1];
    const road=pick(/road.?name|street|rrug|adresa|address|name/i);
    if(!road)return null;
    const municipality=pick(/municip|komun|city|qytet/i);
    const settlement=pick(/settle|vendban|village|fshat|place/i);
    const number=pick(/house.?no|address.?no|num(ber|ri)?|nr[_-]?/i);
    const pieces=[road,number,settlement,municipality]
      .map(value=>String(value||'').trim())
      .filter(Boolean)
      .filter((value,i,array)=>array.findIndex(other=>normalizeSearch(other)===normalizeSearch(value))===i);
    const label=pieces.join(', ');
    const coord=featureCoordinate(feature.geometry);
    return {
      label,
      road:String(road).trim(),
      city:String(municipality||settlement||'').trim(),
      lat:coord?.[0]||null,
      lng:coord?.[1]||null,
      search:normalizeSearch(label)
    };
  };

  const fetchOfficialLayer=async(layer)=>{
    const url=new URL(OFFICIAL_WFS);
    url.search=new URLSearchParams({
      service:'WFS',
      version:'1.0.0',
      request:'GetFeature',
      typeName:layer,
      outputFormat:'application/json',
      srsName:'EPSG:4326',
      bbox:SERVICE_BBOX,
      maxFeatures:'2500'
    }).toString();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),6500);
    try{
      const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('official-address-http-'+response.status);
      const payload=await response.json();
      const records=(payload.features||[]).map(extractOfficialRecord).filter(Boolean);
      const unique=new Map();
      records.forEach(record=>{
        const key=normalizeSearch(record.label);
        if(key&&!unique.has(key))unique.set(key,record);
      });
      if(!unique.size)throw new Error('official-address-empty');
      return [...unique.values()];
    }finally{
      clearTimeout(timeout);
    }
  };

  const ensureOfficialAddresses=()=>{
    if(officialAddressPromise)return officialAddressPromise;
    officialAddressPromise=(async()=>{
      if(addressSource)addressSource.textContent='Po lidhemi me Geoportalin zyrtar të Kosovës…';
      let lastError=null;
      for(const layer of OFFICIAL_LAYERS){
        try{
          const records=await fetchOfficialLayer(layer);
          if(addressSource)addressSource.textContent='Burim zyrtar: Geoportali i Kosovës (AKK) · fokus Pejë / Deçan';
          return records;
        }catch(error){lastError=error}
      }
      if(addressSource)addressSource.textContent='Shërbimi zyrtar i adresave nuk u përgjigj. Mund ta shkruash adresën manualisht pa u bllokuar.';
      throw lastError||new Error('official-address-unavailable');
    })();
    return officialAddressPromise;
  };

  const closeAddressSuggestions=()=>{
    if(!addressSuggestions||!addressInput)return;
    addressSuggestions.hidden=true;
    addressSuggestions.replaceChildren();
    addressInput.setAttribute('aria-expanded','false');
    addressInput.removeAttribute('aria-activedescendant');
    activeAddressIndex=-1;
    currentAddressMatches=[];
  };

  const setActiveSuggestion=(index)=>{
    if(!addressSuggestions||!currentAddressMatches.length)return;
    activeAddressIndex=(index+currentAddressMatches.length)%currentAddressMatches.length;
    [...addressSuggestions.querySelectorAll('[role="option"]')].forEach((item,itemIndex)=>{
      const active=itemIndex===activeAddressIndex;
      item.classList.toggle('is-active',active);
      item.setAttribute('aria-selected',String(active));
      if(active){
        addressInput?.setAttribute('aria-activedescendant',item.id);
        item.scrollIntoView({block:'nearest'});
      }
    });
  };

  const chooseAddress=(record)=>{
    if(!record||!addressInput)return;
    addressInput.value=record.road||record.label;
    if(cityInput&&!cityInput.value.trim())cityInput.value=record.city||'Pejë';
    if(record.lat&&record.lng&&latInput&&lngInput){
      latInput.value=Number(record.lat).toFixed(6);
      lngInput.value=Number(record.lng).toFixed(6);
      if(accuracyInput)accuracyInput.value='';
      setMap(latInput.value,lngInput.value);
      setLocationStatus('Adresa u zgjodh nga burimi zyrtar.','success');
    }
    clearError(addressInput,locationError);
    updateLocationActions();
    scheduleSave();
    closeAddressSuggestions();
  };

  const renderAddressSuggestions=(records)=>{
    if(!addressSuggestions||!addressInput)return;
    currentAddressMatches=records.slice(0,7);
    if(!currentAddressMatches.length){
      closeAddressSuggestions();
      return;
    }
    const fragment=document.createDocumentFragment();
    currentAddressMatches.forEach((record,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.id='official-address-option-'+index;
      button.className='wizard-address-option';
      button.setAttribute('role','option');
      button.setAttribute('aria-selected','false');
      button.innerHTML='<span></span><small>Geoportali AKK</small>';
      button.querySelector('span').textContent=record.label;
      button.addEventListener('pointerdown',event=>event.preventDefault());
      button.addEventListener('click',()=>chooseAddress(record));
      fragment.append(button);
    });
    addressSuggestions.replaceChildren(fragment);
    addressSuggestions.hidden=false;
    addressInput.setAttribute('aria-expanded','true');
    activeAddressIndex=-1;
  };

  const searchOfficialAddresses=async()=>{
    const query=normalizeSearch(addressInput?.value);
    if(query.length<2){closeAddressSuggestions();return}
    try{
      const records=await ensureOfficialAddresses();
      const tokens=query.split(/\s+/).filter(Boolean);
      const ranked=records
        .filter(record=>tokens.every(token=>record.search.includes(token)))
        .map(record=>({
          record,
          score:record.search.startsWith(query)?0:record.search.includes(' '+query)?1:2
        }))
        .sort((a,b)=>a.score-b.score||a.record.label.localeCompare(b.record.label,'sq'))
        .slice(0,7)
        .map(item=>item.record);
      renderAddressSuggestions(ranked);
    }catch{
      closeAddressSuggestions();
    }
  };

  addressInput?.addEventListener('focus',()=>{
    if(addressInput.value.trim().length>=2)searchOfficialAddresses();
    else ensureOfficialAddresses().catch(()=>{});
  });
  addressInput?.addEventListener('input',()=>{
    clearTimeout(addressDebounce);
    addressDebounce=setTimeout(searchOfficialAddresses,140);
  });
  addressInput?.addEventListener('keydown',event=>{
    if(addressSuggestions?.hidden)return;
    if(event.key==='ArrowDown'){event.preventDefault();setActiveSuggestion(activeAddressIndex+1)}
    else if(event.key==='ArrowUp'){event.preventDefault();setActiveSuggestion(activeAddressIndex-1)}
    else if(event.key==='Enter'&&activeAddressIndex>=0){
      event.preventDefault();
      chooseAddress(currentAddressMatches[activeAddressIndex]);
    }else if(event.key==='Escape'){
      closeAddressSuggestions();
    }
  });
  document.addEventListener('pointerdown',event=>{
    if(addressBox&&!addressBox.contains(event.target))closeAddressSuggestions();
  });

  const formState=()=>({
    step:currentStep,
    name:nameInput?.value||'',
    phone:phoneInput?.value||'',
    date:dateInput?.value||'',
    time:timeInput?.value||'',
    timePreset:homeForm.querySelector('input[name="timePreset"]:checked')?.value||'',
    address:addressInput?.value||'',
    city:cityInput?.value||'',
    locationNote:locationNoteInput?.value||'',
    note:noteInput?.value||'',
    lat:latInput?.value||'',
    lng:lngInput?.value||'',
    accuracy:accuracyInput?.value||'',
    problems:selectedProblems()
  });

  const scheduleSave=()=>{
    window.clearTimeout(saveTimer);
    saveTimer=window.setTimeout(()=>safeStorage.set(formState()),120);
  };

  const restoreState=()=>{
    const state=safeStorage.get();
    if(!state)return 1;
    if(nameInput)nameInput.value=state.name||'';
    if(phoneInput)phoneInput.value=state.phone||'';
    if(dateInput&&(!state.date||state.date>=localDateString()))dateInput.value=state.date||'';
    if(timeInput)timeInput.value=state.time||'';
    if(addressInput)addressInput.value=state.address||'';
    if(cityInput)cityInput.value=state.city||'';
    if(locationNoteInput)locationNoteInput.value=state.locationNote||'';
    if(noteInput)noteInput.value=state.note||'';
    if(latInput)latInput.value=state.lat||'';
    if(lngInput)lngInput.value=state.lng||'';
    if(accuracyInput)accuracyInput.value=state.accuracy||'';
    problemInputs.forEach(input=>input.checked=(state.problems||[]).includes(input.value));
    timePresets.forEach(input=>input.checked=Boolean(state.timePreset&&input.value===state.timePreset));
    if(state.lat&&state.lng)setMap(state.lat,state.lng);
    updateLocationActions();
    return Number(state.step)||1;
  };

  const applyUrlPrefill=()=>{
    const params=new URLSearchParams(location.search);
    const requested=params.get('problem')||params.get('service');
    if(requested){
      const normalized=requested.toLocaleLowerCase('sq-AL');
      problemInputs.forEach(input=>{
        if(input.value.toLocaleLowerCase('sq-AL').includes(normalized)||normalized.includes(input.value.toLocaleLowerCase('sq-AL'))){
          input.checked=true;
        }
      });
    }
  };

  const updateProgress=()=>{
    if(currentEl)currentEl.textContent=String(currentStep);
    if(totalEl)totalEl.textContent=String(steps.length);
    if(progressEl)progressEl.style.width=((currentStep/steps.length)*100)+'%';
    if(backButton)backButton.hidden=currentStep===1;
    if(nextButton)nextButton.hidden=currentStep===steps.length;
    if(controls)controls.hidden=currentStep===steps.length;
  };

  const maybeFocus=(step)=>{
    if(coarsePointer)return;
    const focusable=step.querySelector('input:not([type="checkbox"]):not([type="radio"]),textarea,button');
    window.setTimeout(()=>focusable?.focus({preventScroll:true}),70);
  };

  const showStep=(number,direction='forward',focus=true)=>{
    currentStep=Math.min(Math.max(Number(number)||1,1),steps.length);
    steps.forEach(step=>{
      const active=Number(step.dataset.wizardStep)===currentStep;
      step.hidden=!active;
      step.classList.toggle('is-active',active);
      if(active){
        step.style.animationName='none';
        requestAnimationFrame(()=>{step.style.animationName=direction==='back'?'wizardBackIn':'wizardIn';});
        if(focus)maybeFocus(step);
      }
    });
    updateProgress();
    scheduleSave();
    if(currentStep===6)prepareLocationStep();
  };

  const clearError=(el,error)=>{
    el?.removeAttribute('aria-invalid');
    if(error)error.hidden=true;
  };

  const normalizePhone=(value)=>{
    const raw=String(value||'').trim();
    const plus=raw.startsWith('+');
    const digits=raw.replace(/\D/g,'');
    if(!digits)return '';
    if(plus&&digits.startsWith('383')){
      const rest=digits.slice(3);
      return '+383'+(rest?' '+rest.slice(0,2):'')+(rest.length>2?' '+rest.slice(2,5):'')+(rest.length>5?' '+rest.slice(5,8):'')+(rest.length>8?' '+rest.slice(8):'');
    }
    if(digits.startsWith('00383')){
      const rest=digits.slice(5);
      return '00383'+(rest?' '+rest.slice(0,2):'')+(rest.length>2?' '+rest.slice(2,5):'')+(rest.length>5?' '+rest.slice(5,8):'')+(rest.length>8?' '+rest.slice(8):'');
    }
    if(digits.startsWith('0')){
      return digits.slice(0,3)+(digits.length>3?' '+digits.slice(3,6):'')+(digits.length>6?' '+digits.slice(6,9):'')+(digits.length>9?' '+digits.slice(9):'');
    }
    return raw;
  };

  const validPhone=()=>String(phoneInput?.value||'').replace(/\D/g,'').length>=8;

  const validateStep=()=>{
    if(currentStep===1&&!nameInput?.value.trim()){
      nameInput?.setAttribute('aria-invalid','true');
      if(nameError)nameError.hidden=false;
      return false;
    }
    if(currentStep===2&&!validPhone()){
      phoneInput?.setAttribute('aria-invalid','true');
      if(phoneError){
        phoneError.textContent='Shkruani një numër telefoni të vlefshëm.';
        phoneError.hidden=false;
      }
      return false;
    }
    if(currentStep===3&&!selectedProblems().length){
      if(problemError)problemError.hidden=false;
      return false;
    }
    if(currentStep===4&&!dateInput?.value){
      dateInput?.setAttribute('aria-invalid','true');
      if(dateError)dateError.hidden=false;
      return false;
    }
    if(currentStep===5&&!selectedTime()){
      if(timeError)timeError.hidden=false;
      return false;
    }
    if(currentStep===6&&!latInput?.value&&!lngInput?.value&&!addressInput?.value.trim()&&!cityInput?.value.trim()){
      addressInput?.setAttribute('aria-invalid','true');
      cityInput?.setAttribute('aria-invalid','true');
      if(locationError)locationError.hidden=false;
      return false;
    }
    return true;
  };

  nameInput?.addEventListener('input',()=>{clearError(nameInput,nameError);scheduleSave()});
  phoneInput?.addEventListener('input',()=>{
    clearError(phoneInput,phoneError);
    const caret=phoneInput.selectionStart;
    phoneInput.value=normalizePhone(phoneInput.value);
    try{phoneInput.setSelectionRange(phoneInput.value.length,phoneInput.value.length)}catch{}
    scheduleSave();
  });
  dateInput?.addEventListener('change',()=>{clearError(dateInput,dateError);scheduleSave()});
  [addressInput,cityInput].forEach(input=>input?.addEventListener('input',()=>{
    clearError(addressInput,locationError);
    clearError(cityInput,locationError);
    updateLocationActions();
    scheduleSave();
  }));
  locationNoteInput?.addEventListener('input',scheduleSave);
  noteInput?.addEventListener('input',scheduleSave);

  problemInputs.forEach(input=>input.addEventListener('change',()=>{
    if(problemError)problemError.hidden=true;
    scheduleSave();
  }));

  timePresets.forEach(input=>input.addEventListener('change',()=>{
    if(timeInput)timeInput.value='';
    if(timeError)timeError.hidden=true;
    scheduleSave();
  }));

  timeInput?.addEventListener('input',()=>{
    timePresets.forEach(input=>input.checked=false);
    if(timeError)timeError.hidden=true;
    scheduleSave();
  });

  [nameInput,phoneInput].forEach(input=>input?.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!event.shiftKey){
      event.preventDefault();
      if(validateStep())showStep(currentStep+1);
    }
  }));

  nextButton?.addEventListener('click',()=>{
    if(!validateStep())return;
    if(currentStep===7)updateSummary();
    showStep(currentStep+1);
  });
  backButton?.addEventListener('click',()=>showStep(currentStep-1,'back'));

  const setLocationStatus=(text,state='idle')=>{
    if(locationStatus)locationStatus.textContent=text;
    const box=locationStatus?.closest('.wizard-location-state');
    if(box)box.dataset.state=state;
  };

  const setMap=(lat,lng)=>{
    const latitude=Number(lat),longitude=Number(lng),delta=.006;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return;
    if(mapFrame){
      mapFrame.src='https://www.google.com/maps?q='+encodeURIComponent(latitude+','+longitude)+'&z=16&output=embed';
      mapFrame.hidden=false;
    }
    if(mapPlaceholder)mapPlaceholder.hidden=true;
  };

  const updateLocationActions=()=>{
    const link=mapLink();
    const hasLink=Boolean(link);
    if(openMapsLink)openMapsLink.href=link||'https://www.google.com/maps/search/?api=1&query=Pej%C3%AB%2C%20Kosovo';
    if(shareLocationButton)shareLocationButton.disabled=!hasLink;
    if(copyLocationButton)copyLocationButton.disabled=!hasLink;
  };

  const applyPosition=(position,label='Lokacioni u shtua')=>{
    const lat=Number(position.coords.latitude).toFixed(6);
    const lng=Number(position.coords.longitude).toFixed(6);
    const accuracy=Math.round(Number(position.coords.accuracy)||0);
    if(latInput)latInput.value=lat;
    if(lngInput)lngInput.value=lng;
    if(accuracyInput)accuracyInput.value=String(accuracy||'');
    setMap(lat,lng);
    updateLocationActions();
    clearError(addressInput,locationError);
    clearError(cityInput,locationError);
    setLocationStatus(label+(accuracy?' · saktësi rreth '+accuracy+' m':''),'success');
    locationButton?.classList.remove('is-loading');
    locationButton?.classList.add('is-success');
    const labelEl=locationButton?.querySelector('span');
    if(labelEl)labelEl.textContent='Lokacioni u shtua';
    scheduleSave();
  };

  const geoAttempt=(options)=>new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(resolve,reject,options);
  });

  const requestLocation=async({silent=false}={})=>{
    const requestId=++locationRequestId;
    clearError(addressInput,locationError);
    clearError(cityInput,locationError);
    if(!navigator.geolocation){
      setLocationStatus('GPS nuk mbështetet në këtë pajisje. Shkruaj adresën.','error');
      return false;
    }

    if(!silent){
      locationButton?.classList.remove('is-success');
      locationButton?.classList.add('is-loading');
      const label=locationButton?.querySelector('span');
      if(label)label.textContent='Duke marrë lokacionin…';
    }
    setLocationStatus('Po provojmë lokacionin më të shpejtë…','loading');

    try{
      const quick=await geoAttempt({enableHighAccuracy:false,timeout:6000,maximumAge:120000});
      if(requestId!==locationRequestId)return false;
      applyPosition(quick,'Lokacioni u mor shpejt');

      if(Number(quick.coords.accuracy)>120){
        geoAttempt({enableHighAccuracy:true,timeout:10000,maximumAge:0})
          .then(precise=>{
            if(requestId===locationRequestId&&Number(precise.coords.accuracy)<Number(quick.coords.accuracy)){
              applyPosition(precise,'Lokacioni u përmirësua');
            }
          })
          .catch(()=>{});
      }
      return true;
    }catch(firstError){
      if(requestId!==locationRequestId)return false;
      setLocationStatus('Po provojmë GPS me saktësi më të lartë…','loading');
      try{
        const precise=await geoAttempt({enableHighAccuracy:true,timeout:10000,maximumAge:0});
        if(requestId!==locationRequestId)return false;
        applyPosition(precise,'Lokacioni u mor');
        return true;
      }catch(error){
        if(requestId!==locationRequestId)return false;
        locationButton?.classList.remove('is-loading','is-success');
        const label=locationButton?.querySelector('span');
        if(label)label.textContent='Provo GPS përsëri';

        const denied=error?.code===1;
        setLocationStatus(
          denied
            ?'Lokacioni është i bllokuar. Aktivizo Location për browser-in ose shkruaj adresën.'
            :'GPS nuk u përgjigj. Shkruaj adresën ose hape hartën — mund të vazhdosh normalisht.',
          'error'
        );
        return false;
      }
    }
  };

  locationButton?.addEventListener('click',()=>requestLocation());

  shareLocationButton?.addEventListener('click',async()=>{
    const link=mapLink();
    if(!link)return;
    try{
      if(navigator.share){
        await navigator.share({title:'Lokacioni për vizitën',text:'Lokacioni i vizitës së fizioterapisë',url:link});
        setLocationStatus('Lokacioni u hap për ndarje.','success');
      }else{
        await navigator.clipboard.writeText(link);
        setLocationStatus('Linku i lokacionit u kopjua.','success');
      }
    }catch{}
  });

  copyLocationButton?.addEventListener('click',async()=>{
    const link=mapLink();
    if(!link)return;
    try{
      await navigator.clipboard.writeText(link);
      setLocationStatus('Linku i lokacionit u kopjua.','success');
    }catch{
      setLocationStatus('Hape hartën dhe kopjo linkun e lokacionit.','error');
    }
  });

  async function prepareLocationStep(){
    updateLocationActions();
    if(latInput?.value&&lngInput?.value){
      setLocationStatus('Lokacioni është gati'+(accuracyInput?.value?' · saktësi rreth '+accuracyInput.value+' m':''),'success');
      return;
    }
    if(!navigator.permissions?.query)return;
    try{
      const permission=await navigator.permissions.query({name:'geolocation'});
      if(permission.state==='granted'){
        setLocationStatus('Leja e GPS është aktive. Po marrim lokacionin…','loading');
        requestLocation({silent:true});
      }else if(permission.state==='denied'){
        setLocationStatus('GPS është i bllokuar për këtë faqe. Shkruaj adresën ose aktivizo Location.','error');
      }
    }catch{}
  }

  function updateSummary(){
    const problems=selectedProblems().join(', ');
    const time=selectedTime();
    const locationText=[
      addressInput?.value.trim(),
      cityInput?.value.trim(),
      locationNoteInput?.value.trim()
    ].filter(Boolean).join(', ')||(latInput?.value&&lngInput?.value?'Lokacion GPS':'—');
    const set=(selector,value)=>{
      const el=homeForm.querySelector(selector);
      if(el)el.textContent=value||'—';
    };
    set('[data-summary-name]',nameInput?.value.trim());
    set('[data-summary-phone]',phoneInput?.value.trim());
    set('[data-summary-problem]',problems);
    set('[data-summary-datetime]',formatDate(dateInput?.value)+' · '+time);
    set('[data-summary-location]',locationText);
  }

  const buildMessage=()=>{
    const name=nameInput?.value.trim()||'';
    const problems=selectedProblems();
    const time=selectedTime();
    const address=[addressInput?.value.trim(),cityInput?.value.trim()].filter(Boolean).join(', ');
    const detail=locationNoteInput?.value.trim();
    const link=mapLink();
    const accuracy=accuracyInput?.value;
    const note=noteInput?.value.trim();
    const firstName=name.split(/\s+/)[0]||name;

    const lines=[
      'Përshëndetje Shaban 👋',
      '',
      'Jam *'+name+'* dhe dua të kërkoj një *vizitë fizioterapie në shtëpi*.',
      '',
      '*Arsyeja e vizitës*',
      ...problems.map(problem=>'• '+problem),
      '',
      '*Termini i preferuar*',
      '• Data e preferuar: '+formatDate(dateInput?.value),
      '• Ora e preferuar: '+time,
      '',
      '*Kontakti*',
      '• Emri: '+name,
      '• Telefoni: '+phoneInput?.value.trim(),
      '',
      '*Lokacioni*'
    ];

    if(address)lines.push('• Adresa: '+address);
    if(detail)lines.push('• Detaj hyrjeje: '+detail);
    if(link)lines.push('• Harta: '+link);
    if(accuracy&&latInput?.value&&lngInput?.value)lines.push('• Saktësia GPS: rreth '+accuracy+' m');
    if(note)lines.push('','*Shënim shtesë*','• '+note);

    lines.push(
      '',
      'A mund të më konfirmoni nëse ky termin është i lirë?',
      '',
      'Faleminderit'+(firstName?' — '+firstName:'')+'.'
    );
    return lines.join('\n');
  };

  homeForm.addEventListener('submit',event=>{
    event.preventDefault();
    updateSummary();
    if(!validateStep()&&currentStep!==steps.length)return;
    safeStorage.set({...formState(),submittedAt:Date.now()});
    const url='https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(buildMessage());
    window.open(url,'_blank','noopener,noreferrer');
  });

  const restoredStep=restoreState();
  applyUrlPrefill();
  showStep(restoredStep,'forward',false);
  window.addEventListener('pagehide',()=>safeStorage.set(formState()));
}

/* Home blog preview — Sanity is the source of truth */
(()=>{
  const list=document.querySelector('[data-home-blog-list]');
  if(!list)return;

  const SANITY_PROJECT_ID='a1lswl1z';
  const SANITY_DATASET='production';
  const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;
  const query=`*[_type == "post"] | order(publishedAt desc)[0...3]{
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featured,
    coverImage{
      asset->{_id,url},
      alt
    },
    category->{title,slug,description},
    author->{
      _id,
      name,
      role,
      slug,
      image{asset->{_id,url}}
    }
  }`;

  const escapeHtml=(value='')=>String(value)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const imageUrl=(image,width)=>{
    const src=image?.asset?.url;
    if(!src)return '';
    try{
      const url=new URL(src);
      url.searchParams.set('auto','format');
      if(width)url.searchParams.set('w',String(width));
      url.searchParams.set('fit','max');
      return url.toString();
    }catch{return src}
  };

  const formatDate=(date)=>date
    ?new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date))
    :'';

  const authorLink=(author)=>author?.slug?.current
    ?'author.html?slug='+encodeURIComponent(author.slug.current)
    :'';

  const authorBadge=(post)=>{
    const author=post.author;
    const href=authorLink(author);
    if(!author?.name||!href)return '';
    const authorImage=imageUrl(author.image,96);
    const initials=author.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
    return `<a class="home-blog-author" href="${href}" aria-label="Rreth autorit ${escapeHtml(author.name)}">
      ${authorImage?`<img src="${escapeHtml(authorImage)}" alt="" width="32" height="32" loading="lazy" decoding="async">`:`<span aria-hidden="true">${escapeHtml(initials)}</span>`}
      <small>Nga <strong>${escapeHtml(author.name)}</strong></small>
    </a>`;
  };

  fetch(SANITY_API+'?query='+encodeURIComponent(query))
    .then(response=>{if(!response.ok)throw new Error('Sanity request failed');return response.json();})
    .then(({result=[]})=>{
      if(!result.length){
        list.innerHTML='<div class="home-blog-empty"><strong>Artikujt po përgatiten.</strong><span>Nuk ka artikuj të publikuar për t’u shfaqur.</span></div>';
        return;
      }
      list.innerHTML=result.map(post=>{
        const cover=imageUrl(post.coverImage,1000);
        const slug=post.slug?.current||'';
        const articleHref=slug?'post.html?slug='+encodeURIComponent(slug):'#';
        const category=post.category?.title?escapeHtml(post.category.title):'';
        return `<article class="home-blog-card">
          <a class="home-blog-media" href="${articleHref}" aria-label="Lexo: ${escapeHtml(post.title||'')}">
            ${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(post.coverImage?.alt||'')}" loading="lazy" decoding="async">`:'<span class="home-blog-placeholder" aria-hidden="true"></span>'}
          </a>
          <div class="home-blog-body">
            <div class="home-blog-meta">${category?`<span>${category}</span>`:''}<time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
            <h3><a href="${articleHref}">${escapeHtml(post.title||'')}</a></h3>
            ${post.excerpt?`<p>${escapeHtml(post.excerpt)}</p>`:''}
            ${authorBadge(post)}
            <a class="text-link" href="${articleHref}">Lexo artikullin <span aria-hidden="true">→</span></a>
          </div>
        </article>`;
      }).join('');
    })
    .catch(()=>{
      list.innerHTML='<div class="home-blog-empty"><strong>Blogu është përkohësisht i paarritshëm.</strong><span>Provo përsëri pas pak.</span></div>';
    });
})();
/* Mobile contact dock: hide it when an equivalent local CTA, booking card, closing CTA, or footer is visible. */
const contactDock=document.querySelector('.contact-dock');
if(contactDock&&'IntersectionObserver' in window){
  const suppressors=[...document.querySelectorAll('.home-booking-card,.card-whatsapp,.package-cta,.closing-actions,.site-footer')];
  const visibleSuppressors=new Set();
  const syncContactDock=()=>{
    const suppress=window.innerWidth<=620&&visibleSuppressors.size>0;
    contactDock.classList.toggle('is-suppressed',suppress);
    contactDock.toggleAttribute('inert',suppress);
    if(suppress)contactDock.setAttribute('aria-hidden','true');
    else contactDock.removeAttribute('aria-hidden');
  };
  const dockObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting)visibleSuppressors.add(entry.target);
      else visibleSuppressors.delete(entry.target);
    });
    syncContactDock();
  },{threshold:.2,rootMargin:'0px 0px 64px 0px'});
  suppressors.forEach(el=>dockObserver.observe(el));
  window.addEventListener('resize',syncContactDock,{passive:true});
}
