import {test,expect} from '@playwright/test';
import handler,{extractOfficialRecord,normalizeSearch,scoreRecords} from '../api/addresses.js';
import reverseHandler,{parseReverseAddress} from '../api/reverse-location.js';

test('official address parser keeps Peja municipality and rejects other municipalities',()=>{
  const peja=extractOfficialRecord({
    properties:{RoadName:'Rruga Mbretëresha Teutë',Municipality:'Pejë'},
    geometry:{type:'Point',coordinates:[20.2895,42.6601]}
  });
  const decan=extractOfficialRecord({
    properties:{RoadName:'Rruga Luan Haradinaj',Municipality:'Decan'},
    geometry:{type:'Point',coordinates:[20.287,42.54]}
  });
  const istog=extractOfficialRecord({
    properties:{RoadName:'Rruga Test',Municipality:'Istog'},
    geometry:{type:'Point',coordinates:[20.48,42.78]}
  });

  const surrounding=extractOfficialRecord({
    properties:{RoadName:'Rruga e Rugovës',Municipality:'Pejë',Settlement:'Vitomiricë'},
    geometry:{type:'Point',coordinates:[20.31,42.70]}
  });

  expect(peja?.city).toBe('Pejë');
  expect(surrounding?.city).toBe('Pejë');
  expect(surrounding?.locality).toBe('Vitomiricë');
  expect(decan).toBeNull();
  expect(istog).toBeNull();
  expect(normalizeSearch('Mbretëresha')).toBe('mbreteresha');
});


test('Peja street matching tolerates small realistic typos without becoming broad',()=>{
  const records=[
    {road:'Rruga Adem Jashari',city:'Pejë',search:normalizeSearch('Rruga Adem Jashari Pejë')},
    {road:'Rruga Mbretëresha Teutë',city:'Pejë',search:normalizeSearch('Rruga Mbretëresha Teutë Pejë')},
    {road:'Rruga UÇK',city:'Pejë',search:normalizeSearch('Rruga UÇK Pejë')},
    {road:'Rruga Bill Clinton',city:'Pejë',search:normalizeSearch('Rruga Bill Clinton Pejë')}
  ];

  expect(scoreRecords(records,'Adme Jashari')[0]?.road).toBe('Rruga Adem Jashari');
  expect(scoreRecords(records,'Mbretersha Teute')[0]?.road).toBe('Rruga Mbretëresha Teutë');
  expect(scoreRecords(records,'Adem Jasharii')[0]?.road).toBe('Rruga Adem Jashari');

  expect(scoreRecords(records,'zxqv')).toEqual([]);
  expect(scoreRecords(records,'Bi')).toEqual([{...records[3]}]);
});

test('address API returns filtered local roads from AKK',async()=>{
  const previousFetch=globalThis.fetch;
  globalThis.fetch=async()=>({
    ok:true,
    status:200,
    async json(){
      return {
        type:'FeatureCollection',
        features:[
          {properties:{RoadName:'Rruga Mbretëresha Teutë',Municipality:'Pejë'},geometry:{type:'Point',coordinates:[20.2895,42.6601]}},
          {properties:{RoadName:'Rruga Test',Municipality:'Istog'},geometry:{type:'Point',coordinates:[20.48,42.78]}}
        ]
      };
    }
  });

  const res={
    headers:{},
    code:200,
    payload:null,
    setHeader(name,value){this.headers[name]=value},
    status(code){this.code=code;return this},
    json(payload){this.payload=payload;return this}
  };

  try{
    await handler({method:'GET',query:{q:'Mbret'}},res);
  }finally{
    globalThis.fetch=previousFetch;
  }

  expect(res.code).toBe(200);
  expect(res.payload.source).toBe('AKK');
  expect(res.payload.records).toHaveLength(1);
  expect(res.payload.records[0].city).toBe('Pejë');
  expect(res.payload.records[0].road).toBe('Rruga Mbretëresha Teutë');
});


test('reverse geocoder resolves Peja district and street',()=>{
  const parsed=parseReverseAddress({
    display_name:'Rruga Mbretëresha Teutë, Pejë, Kosovo',
    address:{
      road:'Rruga Mbretëresha Teutë',
      house_number:'12',
      town:'Peja'
    }
  });
  expect(parsed.road).toBe('Rruga Mbretëresha Teutë 12');
  expect(parsed.city).toBe('Pejë');
  expect(parsed.inServiceArea).toBeTruthy();
});

test('reverse geocoder rejects Decan as outside the service area',()=>{
  const parsed=parseReverseAddress({
    display_name:'Carrabreg i Ulët, Deçan, Kosovo',
    address:{
      road:'Rruga e Dëshmorëve',
      village:'Carrabreg i Ulët',
      municipality:'Dečani'
    }
  });
  expect(parsed.road).toBe('Rruga e Dëshmorëve');
  expect(parsed.city).toBe('Deçan');
  expect(parsed.inServiceArea).toBeFalsy();
});

test('reverse location API validates coordinates and returns parsed address',async()=>{
  const previousFetch=globalThis.fetch;
  globalThis.fetch=async()=>({
    ok:true,
    status:200,
    async json(){
      return {
        display_name:'Rruga Adem Jashari, Pejë, Kosovo',
        address:{road:'Rruga Adem Jashari',city:'Pejë'}
      };
    }
  });

  const makeRes=()=>({
    headers:{},code:200,payload:null,
    setHeader(name,value){this.headers[name]=value},
    status(code){this.code=code;return this},
    json(payload){this.payload=payload;return this}
  });

  try{
    const bad=makeRes();
    await reverseHandler({method:'GET',query:{lat:'x',lng:'20.28'}},bad);
    expect(bad.code).toBe(400);

    const good=makeRes();
    await reverseHandler({method:'GET',query:{lat:'42.66',lng:'20.29'}},good);
    expect(good.code).toBe(200);
    expect(good.payload.city).toBe('Pejë');
    expect(good.payload.road).toBe('Rruga Adem Jashari');
    expect(good.payload.inServiceArea).toBeTruthy();
  }finally{
    globalThis.fetch=previousFetch;
  }
});


test('fallback search rejects results whose own metadata is outside Peja',async()=>{
  const previousFetch=globalThis.fetch;
  globalThis.fetch=async(input)=>{
    const url=String(input);
    if(url.includes('geoportal.rks-gov.net')){
      return {ok:false,status:503,async json(){return {}}};
    }
    return {
      ok:true,
      status:200,
      async json(){
        return [{
          display_name:'Rruga Luan Haradinaj, Deçan, Kosovo',
          lat:'42.54',
          lon:'20.287',
          address:{road:'Rruga Luan Haradinaj',municipality:'Deçan'}
        }];
      }
    };
  };
  const res={
    headers:{},code:200,payload:null,
    setHeader(name,value){this.headers[name]=value},
    status(code){this.code=code;return this},
    json(payload){this.payload=payload;return this}
  };
  try{
    await handler({method:'GET',query:{q:'Luan'}},res);
  }finally{
    globalThis.fetch=previousFetch;
  }
  expect(res.code).toBe(200);
  expect(res.payload.records).toEqual([]);
  expect(res.payload.source).toBe('none');
});
