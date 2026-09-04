/**
 * Global website media binding.
 * Sanity project a1lswl1z / production is the source of truth once siteMedia is published.
 * Existing markup remains a stable visual fallback if Sanity is unavailable or a field is empty.
 */
(()=>{
  const PROJECT_ID='a1lswl1z';
  const DATASET='production';
  const API=`https://${PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${DATASET}`;
  const QUERY=`*[_type == "siteMedia"][0]{
    _id,
    branding{
      logoPrimary{asset->{_id,url},alt,crop,hotspot},
      logoWhite{asset->{_id,url},alt,crop,hotspot},
      logoMark{asset->{_id,url},alt,crop,hotspot},
      favicon{asset->{_id,url},alt}
    },
    hero{
      mainImage{asset->{_id,url},alt,crop,hotspot},
      backgroundImage{asset->{_id,url},alt,crop,hotspot}
    },
    services{
      fizioterapi{asset->{_id,url},alt,crop,hotspot},
      elektroterapi{asset->{_id,url},alt,crop,hotspot},
      ultraze{asset->{_id,url},alt,crop,hotspot},
      limfodrenazh{asset->{_id,url},alt,crop,hotspot},
      shockwave{asset->{_id,url},alt,crop,hotspot},
      hixhame{asset->{_id,url},alt,crop,hotspot}
    },
    treatments{
      qafeShpine{asset->{_id,url},alt,crop,hotspot},
      nyje{asset->{_id,url},alt,crop,hotspot},
      ortopedike{asset->{_id,url},alt,crop,hotspot},
      reumatike{asset->{_id,url},alt,crop,hotspot},
      pediatrike{asset->{_id,url},alt,crop,hotspot}
    },
    general{
      homeVisit{asset->{_id,url},alt,crop,hotspot},
      approach{asset->{_id,url},alt,crop,hotspot},
      about{asset->{_id,url},alt,crop,hotspot},
      cta{asset->{_id,url},alt,crop,hotspot},
      ogDefault{asset->{_id,url},alt}
    }
  }`;

  const get=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);

  function optimized(image,width){
    const source=image?.asset?.url;
    if(!source)return '';
    try{
      const url=new URL(source);
      url.searchParams.set('auto','format');
      url.searchParams.set('fit','max');
      url.searchParams.set('q','86');
      if(width)url.searchParams.set('w',String(width));
      return url.toString();
    }catch{return source}
  }

  function bindImg(img,image,{eager=false}={}){
    if(!img||!image?.asset?.url)return;
    const width=img.classList.contains('hero-portrait')?1200:
      img.classList.contains('official-logo')||img.classList.contains('official-footer-logo')||img.classList.contains('official-closing-logo')?720:1200;
    img.src=optimized(image,width);
    if(image.alt!==undefined)img.alt=image.alt||'';
    img.decoding='async';
    if(eager){
      img.loading='eager';
      img.fetchPriority='high';
    }else if(!img.hasAttribute('loading')){
      img.loading='lazy';
    }
    img.dataset.sanityBound='true';
    if(img.classList.contains('official-logo')||img.classList.contains('official-footer-logo')||img.classList.contains('official-closing-logo'))img.parentElement?.setAttribute('data-sanity-bound','true');
  }

  function bindArt(container,image){
    if(!container||!image?.asset?.url)return;
    const img=document.createElement('img');
    img.className='sanity-card-art';
    img.src=optimized(image,900);
    img.alt=image.alt||'';
    img.loading='lazy';
    img.decoding='async';
    img.dataset.sanityBound='true';
    container.replaceChildren(img);
    container.dataset.sanityBound='true';
  }

  function bindFavicon(media){
    const image=media?.branding?.favicon||media?.branding?.logoMark;
    if(!image?.asset?.url)return;
    let link=document.querySelector('link[rel="icon"]');
    if(!link){link=document.createElement('link');link.rel='icon';document.head.append(link)}
    link.href=optimized(image,128);link.type='';link.sizes='any';link.dataset.sanityBound='true';
  }

  function bindOg(media){
    const image=media?.general?.ogDefault;
    if(!image?.asset?.url)return;
    const url=optimized(image,1600);
    document.querySelectorAll('[data-site-og-image]').forEach(meta=>meta.content=url);
  }

  function hasAsset(image){return Boolean(image?.asset?.url)}

  function apply(media){
    if(!media||typeof media!=='object'){document.documentElement.dataset.siteMedia='fallback';return}
    let boundCount=0;
    document.querySelectorAll('[data-site-media]').forEach(node=>{
      const image=get(media,node.dataset.siteMedia);
      if(!hasAsset(image))return;
      if(node.tagName==='IMG'){bindImg(node,image,{eager:node.classList.contains('hero-portrait')||node.classList.contains('official-logo')});boundCount+=1}
      else if(node.classList.contains('service-art')||node.classList.contains('treatment-art')){bindArt(node,image);boundCount+=1}
    });
    const faviconBefore=document.querySelector('link[rel="icon"]')?.href||'';
    bindFavicon(media);
    const faviconAfter=document.querySelector('link[rel="icon"]')?.href||'';
    if(faviconAfter&&faviconAfter!==faviconBefore)boundCount+=1;
    bindOg(media);
    const required=[media.branding?.logoPrimary,media.branding?.logoWhite,media.branding?.logoMark,media.branding?.favicon,media.hero?.mainImage,media.services?.fizioterapi,media.services?.elektroterapi,media.services?.ultraze,media.services?.limfodrenazh,media.services?.shockwave,media.services?.hixhame,media.treatments?.qafeShpine,media.treatments?.nyje,media.treatments?.ortopedike,media.treatments?.reumatike,media.treatments?.pediatrike];
    const complete=required.every(hasAsset);
    document.documentElement.dataset.siteMedia=boundCount?(complete?'ready':'partial'):'fallback';
    if(boundCount)document.dispatchEvent(new CustomEvent('site-media:ready',{detail:{id:media._id||null,complete}}));
  }

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4500);
  fetch(API+'?query='+encodeURIComponent(QUERY),{signal:controller.signal,headers:{Accept:'application/json'}})
    .then(response=>response.ok?response.json():Promise.reject(new Error('siteMedia request failed')))
    .then(payload=>apply(payload?.result))
    .catch(()=>{})
    .finally(()=>clearTimeout(timeout));

  const contentScript=document.createElement('script');
  contentScript.src='/site-content.js';
  contentScript.defer=true;
  document.head.append(contentScript);

  const contactScript=document.createElement('script');
  contactScript.src='/site-contact.js';
  contactScript.defer=true;
  document.head.append(contactScript);

  // Authentication is intentionally not injected into the public homepage.
  // Clerk remains available on the dedicated auth/dashboard pages only.
})();
