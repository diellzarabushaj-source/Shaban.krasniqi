const TARGET_CITIES=new Set(['Pejë','Deçan']);

const normalize=(value)=>String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('sq-AL').trim();

const targetCity=(value)=>{
  const n=normalize(value).replace(/[._-]/g,' ');
  if(/\b(peje|peja|pec)\b/.test(n))return 'Pejë';
  if(/\b(decan|decani|deqan|deqani)\b/.test(n))return 'Deçan';
  return '';
};

const finiteCoord=(value,min,max)=>{
  const n=Number(value);
  return Number.isFinite(n)&&n>=min&&n<=max?n:null;
};

export const parseReverseAddress=(payload)=>{
  const address=payload?.address||{};
  const primaryPlaces=[
    address.city,
    address.town,
    address.municipality,
    address.village,
    address.suburb
  ].filter(Boolean);
  const city=primaryPlaces.map(targetCity).find(Boolean)||'';
  const road=address.road||address.pedestrian||address.residential||address.path||address.neighbourhood||'';
  const houseNumber=address.house_number||'';
  const locality=address.village||address.suburb||address.city_district||address.town||address.city||'';
  const street=[road,houseNumber].filter(Boolean).join(' ').trim();
  return {
    road:street,
    city,
    locality:String(locality||'').trim(),
    displayName:String(payload?.display_name||'').trim(),
    inServiceArea:TARGET_CITIES.has(city),
    source:'OpenStreetMap'
  };
};

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'method_not_allowed'});
  }

  const lat=finiteCoord(req.query?.lat,-90,90);
  const lng=finiteCoord(req.query?.lng,-180,180);
  if(lat===null||lng===null)return res.status(400).json({error:'invalid_coordinates'});

  const url=new URL('https://nominatim.openstreetmap.org/reverse');
  url.search=new URLSearchParams({
    format:'jsonv2',
    addressdetails:'1',
    zoom:'18',
    lat:String(lat),
    lon:String(lng)
  }).toString();

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4200);
  try{
    const response=await fetch(url,{
      signal:controller.signal,
      headers:{
        Accept:'application/json',
        'Accept-Language':'sq,en;q=0.8',
        'User-Agent':'ShabanKrasniqiFizioterapi/1.0 (smart location)'
      }
    });
    if(!response.ok)return res.status(502).json({error:'reverse_lookup_failed'});
    const payload=await response.json();
    const location=parseReverseAddress(payload);
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(location);
  }catch(error){
    return res.status(error?.name==='AbortError'?504:502).json({
      error:error?.name==='AbortError'?'reverse_lookup_timeout':'reverse_lookup_failed'
    });
  }finally{
    clearTimeout(timeout);
  }
}
