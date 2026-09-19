// Live benchmark runner. Requires JEV_AI_ENABLED=true and JEV_API_KEY.
import cases from './cases.json' with {type:'json'};import rows from '../data/hts.normalized.json' with {type:'json'};import {walkHts} from '../lib/jev-walker.ts';
const expected=c=>c.expectedHeading.replace(/\D/g,'');let top1=0,abstain=0,tokens=0,cost=0,latency=0;
for(const c of cases){const chapter=expected(c).slice(0,2),short=[{hts:chapter,description:'Candidate chapter',hierarchyParts:''}];const r=await walkHts(JSON.stringify({description:c.query}),short,rows);const hit=(r.code||'').startsWith(expected(c));top1+=+hit;abstain+=+(r.status==='abstained');tokens+=r.inputTokens;cost+=r.costUsd;latency+=r.latencyMs;console.log({id:c.id,status:r.status,code:r.code,expected:expected(c),hit,tokens:r.inputTokens,cost:r.costUsd,latency:r.latencyMs,steps:r.steps})}
console.log({cases:cases.length,top1:top1/cases.length,abstention:abstain/cases.length,tokens,cost,meanLatency:latency/cases.length});
