import {test,expect} from '@playwright/test';
import handler,{extractOfficialRecord,normalizeSearch} from '../api/addresses.js';
import reverseHandler,{parseReverseAddress} from '../api/reverse-location.js';

test('official address parser keeps only Peja and Decan',()=>{
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

  expect(peja?.city).toBe('Pejë');
  expect(decan?.city).toBe('Deçan');
  expect(istog).toBeNull();
  expect(normalizeSearch('Mbretëresha')).toBe('mbreteresha');
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

test('reverse geocoder recognizes Decan municipality from district fields',()=>{
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
  expect(parsed.inServiceArea).toBeTruthy();
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
