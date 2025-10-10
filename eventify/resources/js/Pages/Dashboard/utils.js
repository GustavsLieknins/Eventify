// utils.js
import axios from 'axios';

export const DEFAULT_GL = 'uk';
export const DEFAULT_HL = 'en';
export const DEFAULT_EVENT_LOCATION = 'United Kingdom';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad2 = n => String(n).padStart(2,'0');
const iso = (y,m,d)=>`${y}-${pad2(m)}-${pad2(d)}`;
export const join = (arr, sep=' • ')=>arr.filter(Boolean).join(sep);
export const fmtInt = n => (typeof n==='number'?n.toLocaleString():n);

export function fmtDuration(mins){
  if(!mins||isNaN(mins))return '';
  const h=Math.floor(mins/60),m=mins%60;
  return `${h?`${h}h `:''}${m?`${m}m`:''}`.trim();
}

export function fmtDateTimeSimple(s){
  if(!s||typeof s!=='string')return '';
  const [d,t]=s.split(' ');
  if(!d)return s;
  const [Y,M,D]=d.split('-').map(Number);
  const label=isNaN(D)?d:`${pad2(D)} ${MONTHS[(M||1)-1]}`;
  return t?`${label} • ${t}`:label;
}

export function parseWhenToISO(s){
  if(!s)return '';
  const a=s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if(a)return`${a[1]}-${a[2]}-${a[3]}`;
  const mm={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12,'dec.':12};
  const b=s.toLowerCase().match(/(\d{1,2})\s([a-z\.]{3,5})/);
  if(b){const d=+b[1],m=mm[b[2]];if(!m)return'';const now=new Date();let y=now.getFullYear();const cand=new Date(y,m-1,d);if(cand<now)y+=1;return iso(y,m,d);}
  const c=s.toLowerCase().match(/([a-z]{3,10})\s(\d{1,2}),?\s(\d{4})/);
  if(c){const m=mm[c[1]],d=+c[2],y=+c[3];return(m&&y&&d)?iso(y,m,d):'';}
  return '';
}

const STATE_PROVINCE_TO_COUNTRY = {
  AL:'US',AK:'US',AZ:'US',AR:'US',CA:'US',CO:'US',CT:'US',DE:'US',FL:'US',GA:'US',
  HI:'US',ID:'US',IL:'US',IN:'US',IA:'US',KS:'US',KY:'US',LA:'US',ME:'US',MD:'US',
  MA:'US',MI:'US',MN:'US',MS:'US',MO:'US',MT:'US',NE:'US',NV:'US',NH:'US',NJ:'US',
  NM:'US',NY:'US',NC:'US',ND:'US',OH:'US',OK:'US',OR:'US',PA:'US',RI:'US',SC:'US',
  SD:'US',TN:'US',TX:'US',UT:'US',VT:'US',VA:'US',WA:'US',WV:'US',WI:'US',WY:'US',DC:'US',
  AB:'CA',BC:'CA',MB:'CA',NB:'CA',NL:'CA',NS:'CA',NT:'CA',NU:'CA',ON:'CA',PE:'CA',QC:'CA',SK:'CA',YT:'CA'
};

export function getCityFromAddress(addr){
  if(!Array.isArray(addr)||!addr.length)return'';
  const last=String(addr[addr.length-1]||'').trim();
  if(!last)return'';
  const parts=last.split(',').map(s=>s.trim()).filter(Boolean);
  if(!parts.length)return'';
  const city=parts[0];
  const tail=parts[parts.length-1]||'';
  const prev=parts[parts.length-2]||'';
  let iso2='';
  if(/^[A-Z]{2}$/.test(tail)) iso2=STATE_PROVINCE_TO_COUNTRY[tail]||'';
  if(!iso2&&/^[A-Z]{2}$/.test(prev)) iso2=STATE_PROVINCE_TO_COUNTRY[prev]||'';
  if(!iso2&&/^[A-Za-z\s\.]+$/.test(tail)){
    const m=tail.toLowerCase();
    if(['united kingdom','uk','great britain','britain','england'].includes(m)) iso2='GB';
    else if(['united states','usa','america','united states of america','us'].includes(m)) iso2='US';
    else if(['canada','ca'].includes(m)) iso2='CA';
  }
  return iso2?`${city}, ${iso2}`:city;
}

export function normalizeEvents(payload){
  const raw=payload?.eventsResults||payload?.events||payload?.data?.events||payload?.results?.events||payload?.results||payload?.items||[];
  return (raw||[]).map((e,i)=>{
    const address=Array.isArray(e?.address)?e.address:[];
    const whenTxt=e?.date?.when||e?.when||e?.date||e?.startDate||'';
    const startFrom=e?.date?.startDate||e?.startDate||'';
    const startISO=typeof startFrom==='string'&&/^(\d{4}-\d{2}-\d{2})/.test(startFrom)?RegExp.$1:parseWhenToISO(whenTxt);
    return {
      position:e?.position??i+1,
      title:e?.title||e?.name||`Event #${i+1}`,
      when:whenTxt,
      startDate:startISO||'',
      venue:e?.venue?.name||'',
      address,
      city:getCityFromAddress(address),
      link:e?.link||'',
      thumbnail:e?.thumbnail||'',
      description:e?.description||'',
      ticketInfo:Array.isArray(e?.ticketInfo)?e.ticketInfo:[],
      eventLocationMap:e?.eventLocationMap||null,
      venueDetails:e?.venue||null,
      _raw:e
    };
  });
}

const airportCache=new Map();

export async function resolveCityToIataList(cityLabel=''){
  const key=(cityLabel||'').trim();
  if(!key)return[];
  if(airportCache.has(key))return airportCache.get(key);
  const {data}=await axios.get('/api/geo/airports',{params:{cityLabel:key}});
  const list=Array.isArray(data?.codes)?data.codes:[];
  airportCache.set(key,list);
  return list;
}

export function extractFlightOptions(d){
  return (Array.isArray(d?.otherFlights)&&d.otherFlights)||(Array.isArray(d?.results)&&d.results)||(Array.isArray(d?.items)&&d.items)||(Array.isArray(d?.flights)&&d.flights)||[];
}

export const hasAnyFlights=d=>extractFlightOptions(d).length>0;

export function getEventTravelDates(evt){
  const base=(evt?.startDate&&/^\d{4}-\d{2}-\d{2}/.test(evt.startDate))?evt.startDate.slice(0,10):parseWhenToISO(evt?.when||evt?._raw?.date?.when||'');
  if(!base)return{eventISO:'',departISO:'',returnISO:''};
  const d=new Date(`${base}T12:00:00`);
  const before=new Date(d);before.setDate(d.getDate()-1);
  const after=new Date(d);after.setDate(d.getDate()+1);
  return{eventISO:base,departISO:iso(before.getFullYear(),before.getMonth()+1,before.getDate()),returnISO:iso(after.getFullYear(),after.getMonth()+1,after.getDate())};
}

export function normalizeFlightOption(opt){
  const legs=Array.isArray(opt?.flights)?opt.flights:(Array.isArray(opt?.legs)?opt.legs:[]);
  const first=legs[0]||{},last=legs.length?legs[legs.length-1]:first;
  return{
    price:opt?.price??opt?.priceTotal??opt?.priceFrom??null,
    type:opt?.type||(legs.length>1?'Multi-leg':'Trip'),
    totalDuration:opt?.totalDuration||opt?.duration||legs.reduce((s,l)=>s+(l?.duration||0),0)||undefined,
    legs,
    fromId:first?.departureAirport?.id||first?.departureAirportCode||'',
    fromName:first?.departureAirport?.name||'',
    toId:last?.arrivalAirport?.id||last?.arrivalAirportCode||'',
    toName:last?.arrivalAirport?.name||'',
    depart:first?.departureAirport?.time||first?.departureTime||first?.departure||'',
    arrive:last?.arrivalAirport?.time||last?.arrivalTime||last?.arrival||'',
    airlines:[...new Set(legs.map(l=>l?.airline).filter(Boolean))],
    flightNumbers:legs.map(l=>l?.flightNumber).filter(Boolean),
    travelClass:first?.travelClass||opt?.travelClass||'',
    emissions:opt?.carbonEmissions||{}
  };
}

export function normalizeHotel(h){
  return{
    title:h?.title||'Hotel',
    thumbnail:h?.thumbnail||'',
    rating:h?.rating||null,
    reviews:h?.reviews||null,
    type:h?.type||'',
    stars:h?.stars||null,
    address:h?.address||'',
    phone:h?.phone||'',
    website:h?.website||'',
    gps:h?.gpsCoordinates||null,
    tags:Array.isArray(h?.serviceOptions)?h.serviceOptions:(Array.isArray(h?.extensions?.crowd)?h.extensions.crowd:[])
  };
}

export function mapsLinkFromHotel(h){
  if(h?.gps?.latitude&&h?.gps?.longitude)return`https://www.google.com/maps/search/?api=1&query=${h.gps.latitude},${h.gps.longitude}`;
  const q=encodeURIComponent(`${h?.title||''} ${h?.address||''}`.trim());
  return`https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function suggestTripTitle(evt,arrivalId){
  const title=evt?.title||evt?.name||'';
  const city=evt?.city||'';
  const date=(evt?.startDate||'').toString().slice(0,10);
  const base=(title&&city)?`${title} — ${city}`:(title||city)||'My Trip';
  const hints=[];if(arrivalId)hints.push(arrivalId);if(date)hints.push(date);
  return hints.length?`${base} (${hints.join(' · ')})`:base;
}

export async function guessOriginIata(defaultIata='RIX'){
  try{
    const k='ef.originIata'; const c=sessionStorage.getItem(k); if(c) return c;
    const loc=await requestBrowserLocation(); const val=loc?'':defaultIata; sessionStorage.setItem(k,val||defaultIata); return val||defaultIata;
  }catch{ return defaultIata; }
}

export function inferCurrencySymbol(data){
  const url=data?.requestMetadata?.url||'';
  const curr=(url.match(/curr=([A-Z]{3})/)?.[1])||'EUR';
  if(curr==='EUR')return '€'; if(curr==='USD')return '$'; if(curr==='GBP')return '£'; if(curr==='NOK')return 'kr';
  return curr+' ';
}
