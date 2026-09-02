const OFFICIAL_WFS='https://geoportal.rks-gov.net/wms/ows';
const OFFICIAL_LAYERS=['AR_DEV_WS:v_findAddresses','KG_DEV_WS:RoadNameView','KG_DEV_WS:Addresses_in_geopoertal'];
const SERVICE_BBOX='20.05,42.55,20.50,42.82,EPSG:4326';
const CACHE_TTL=15*60*1000;
const cache=globalThis.__shabanAddressCache||(globalThis.__shabanAddressCache=new Map());

export const normalizeSearch=(value)=>String(value||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('sq-AL').trim();

const targetCity=(value)=>{
  const normalized=normalizeSearch(value).replace(/[._-]/g,' ');
  if(/\b(peje|peja|pec)\b/.test(normalized))return 'Pejë';
  if(/\b(decan|decani|deqan|deqani)\b/.test(normalized))return 'Deçan';
  return '';
};

const featureCoordinate=(geometry)=>{
  const coords=geometry?.coordinates;
  if(!Array.isArray(coords))return null;
  if(typeof coords[0]==='number'&&typeof coords[1]==='number')return [coords[1],coords[0]];
  let node=coords;
  while(Array.isArray(node)&&Array.isArray(node[0]))node=node[0];
  return Array.isArray(node)&&typeof node[0]==='number'&&typeof node[1]==='number'?[node[1],node[0]]:null;
};

export const extractOfficialRecord=(feature)=>{
  const props=feature?.properties||{};
  const entries=Object.entries(props)
    .filter(([,value])=>['string','number'].includes(typeof value)&&String(value).trim());
  const pick=(regex)=>entries.find(([key])=>regex.test(key))?.[1];
  const road=pick(/road.?name|street|rrug|adresa|address|name/i);
  if(!road)return null;
  const municipality=pick(/municip|komun|city|qytet/i);
  const settlement=pick(/settle|vendban|village|fshat|place/i);
  const number=pick(/house.?no|address.?no|num(ber|ri)?|nr[_-]?/i);
  const city=targetCity(municipality);
  if(city!=='Pejë')return null;
  const coord=featureCoordinate(feature.geometry);
  const roadText=String(road).trim();
  const numberText=String(number||'').trim();
  const locality=String(settlement||'').trim();
  const label=[roadText,numberText,locality&&normalizeSearch(locality)!=='peje'?locality:'',city].filter(Boolean).join(', ');
  return {
    label,
    road:roadText,
    city,
    locality,
    lat:coord?.[0]||null,
    lng:coord?.[1]||null,
    search:normalizeSearch([roadText,numberText,city].filter(Boolean).join(' ')),
    source:'AKK'
  };
};

const uniqueRecords=(records)=>{
  const unique=new Map();
  records.forEach(record=>{
    const key=normalizeSearch(record.road)+'|'+normalizeSearch(record.city);
    if(key&&!unique.has(key))unique.set(key,record);
  });
  return [...unique.values()];
};

const fetchOfficialLayer=async(layer)=>{
  const cached=cache.get(layer);
  if(cached&&Date.now()-cached.at<CACHE_TTL)return cached.records;

  const url=new URL(OFFICIAL_WFS);
  url.search=new URLSearchParams({
    service:'WFS',
    version:'1.0.0',
    request:'GetFeature',
    typeName:layer,
    outputFormat:'application/json',
    srsName:'EPSG:4326',
    bbox:SERVICE_BBOX,
    maxFeatures:'5000'
  }).toString();

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4200);
  try{
    const response=await fetch(url,{
      signal:controller.signal,
      headers:{Accept:'application/json','User-Agent':'ShabanKrasniqiFizioterapi/1.0'}
    });
    if(!response.ok)throw new Error('official-http-'+response.status);
    const payload=await response.json();
    const records=uniqueRecords((payload.features||[]).map(extractOfficialRecord).filter(Boolean));
    if(!records.length)throw new Error('official-empty');
    cache.set(layer,{at:Date.now(),records});
    return records;
  }finally{
    clearTimeout(timeout);
  }
};

const scoreRecords=(records,query)=>{
  const q=normalizeSearch(query);
  const tokens=q.split(/\s+/).filter(Boolean);
  return records
    .filter(record=>tokens.every(token=>record.search.includes(token)))
    .map(record=>{
      const road=normalizeSearch(record.road);
      const starts=road.startsWith(q);
      const word=road.includes(' '+q);
      return {record,score:starts?0:word?1:2};
    })
    .sort((a,b)=>a.score-b.score||a.record.road.localeCompare(b.record.road,'sq'))
    .slice(0,8)
    .map(item=>item.record);
};

const officialSearch=async(query)=>{
  const settled=await Promise.allSettled(OFFICIAL_LAYERS.map(layer=>fetchOfficialLayer(layer)));
  const records=uniqueRecords(settled.flatMap(result=>result.status==='fulfilled'?result.value:[]));
  if(records.length)return scoreRecords(records,query);
  const failure=settled.find(result=>result.status==='rejected');
  if(failure)throw failure.reason;
  return [];
};

const nominatimSearch=async(query)=>{
  const cities=['Pejë'];
  const tasks=cities.map(async city=>{
    const url=new URL('https://nominatim.openstreetmap.org/search');
    url.search=new URLSearchParams({
      format:'jsonv2',
      addressdetails:'1',
      limit:'6',
      countrycodes:'xk',
      q:query+', '+city+', Kosovo'
    }).toString();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),3500);
    try{
      const response=await fetch(url,{
        signal:controller.signal,
        headers:{
          Accept:'application/json',
          'User-Agent':'ShabanKrasniqiFizioterapi/1.0 (address autocomplete)'
        }
      });
      if(!response.ok)return [];
      const payload=await response.json();
      return payload.flatMap(item=>{
        const address=item.address||{};
        const detected=targetCity(address.municipality)||targetCity(address.county)||targetCity(address.city)||targetCity(address.town)||targetCity(city);
        if(detected!=='Pejë')return [];
        const road=address.road||address.pedestrian||address.residential||address.neighbourhood||String(item.display_name||'').split(',')[0];
        if(!road)return [];
        return [{
          label:[road,address.village||address.suburb||'',detected].filter(Boolean).join(', '),
          road:String(road).trim(),
          city:detected,
          locality:String(address.village||address.suburb||'').trim(),
          lat:Number(item.lat)||null,
          lng:Number(item.lon)||null,
          search:normalizeSearch([road,detected].join(' ')),
          source:'OpenStreetMap'
        }];
      });
    }catch{
      return [];
    }finally{
      clearTimeout(timeout);
    }
  });
  const settled=await Promise.all(tasks);
  return scoreRecords(uniqueRecords(settled.flat()),query);
};

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'method_not_allowed'});
  }
  const query=String(req.query?.q||'').trim().slice(0,80);
  if(query.length<2)return res.status(200).json({records:[],source:'none'});

  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=1800');
  try{
    const records=await officialSearch(query);
    if(records.length)return res.status(200).json({records,source:'AKK'});
  }catch{}

  const fallback=await nominatimSearch(query);
  return res.status(200).json({records:fallback,source:fallback.length?'OpenStreetMap':'none'});
}
