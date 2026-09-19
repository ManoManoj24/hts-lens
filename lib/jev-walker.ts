import {JEV_MODEL,type Candidate} from './jev';
export type HtsRow={h:string;d:string;p:string};
export type WalkStep={level:number;parent?:string;choice?:string;confidence?:number;factsSufficient?:number;inputTokens:number;costUsd:number;options:number;status:'chosen'|'abstained'|'failed'};
export type WalkResult={status:'complete'|'abstained'|'failed';code?:string;steps:WalkStep[];inputTokens:number;costUsd:number;model:string;latencyMs:number;reason?:string};
const digits=(h:string)=>h.replace(/\D/g,'');
const price=.042/1_000_000;
function label(row:HtsRow){return `${row.h}: ${row.d}${row.p?` | ${row.p}`:''}`.slice(0,900)}
function unique(rows:HtsRow[],level:number,prefixes:string[]){const map=new Map<string,HtsRow>();for(const r of rows){const d=digits(r.h);if(d.length!==level||!prefixes.some(p=>d.startsWith(p)))continue;if(!map.has(d))map.set(d,r)}return [...map.values()]}
async function decide(product:string,options:HtsRow[],level:number,parent:string|undefined,key:string,fetcher:typeof fetch){
 const criteria:any=Object.fromEntries(options.map((r,i)=>[`option_${i}`,label(r)]));criteria.none='None fit, or the facts are insufficient to select at this level.';
 const questions:any={pick:{type:'choice',instructions:`Choose the best ${level}-digit HTS node for the product. Compare only these sibling/shortlisted nodes. Choose none when facts are insufficient.`,criteria},sufficient:{type:'noul',instructions:`Are the supplied product facts sufficient to select one ${level}-digit node from these options?`,criteria:{true:'One option is supported over the alternatives.',false:'Facts are missing, ambiguous, or multiple options remain plausible.'}}};
 const t=Date.now();
 const payload={model:JEV_MODEL,state:{product,level,parent,options:options.map((r,i)=>({id:`option_${i}`,code:r.h,description:r.d,hierarchy:r.p}))},questions};
 const res=await fetcher('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const latency=Date.now()-t;
 if(!res.ok)throw new Error(`http_${res.status}`);const data:any=await res.json();const token=Number(data?.usage?.input_tokens||0),pick=data?.answers?.pick,suff=Number(data?.answers?.sufficient?.noul),m=/^option_(\d+)$/.exec(String(pick?.choice||'')),selected=m?options[Number(m[1])]:undefined;
 return{selected,confidence:Number(pick?.confidence||0),suff,tokens:token,cost:token*price,latency,model:String(data?.model||JEV_MODEL)};
}
export async function walkHts(product:string,shortlist:Candidate[],rows:HtsRow[],fetcher:typeof fetch=fetch):Promise<WalkResult>{
 const started=Date.now(),key=process.env.JEV_API_KEY;if(process.env.JEV_AI_ENABLED!=='true'||!key)return{status:'failed',steps:[],inputTokens:0,costUsd:0,model:JEV_MODEL,latencyMs:0,reason:'disabled'};
 const chapters=[...new Set(shortlist.map(c=>digits(c.hts).slice(0,2)).filter(x=>x.length===2))].slice(0,3);let prefixes=chapters,parent: string|undefined;const steps:WalkStep[]=[];let total=0,cost=0,model=JEV_MODEL;
 try{for(const level of [4,6,8,10]){let options=unique(rows,level,prefixes);if(!options.length){if(parent)return{status:'complete',code:parent,steps,inputTokens:total,costUsd:cost,model,latencyMs:Date.now()-started};return{status:'failed',steps,inputTokens:total,costUsd:cost,model,latencyMs:Date.now()-started,reason:'no_options'}}
   const d=await decide(product,options,level,parent,key,fetcher);total+=d.tokens;cost+=d.cost;model=d.model;const ok=!!d.selected&&d.suff>=.65&&d.confidence>=.5;steps.push({level,parent,choice:d.selected?.h,confidence:d.confidence,factsSufficient:d.suff,inputTokens:d.tokens,costUsd:d.cost,options:options.length,status:ok?'chosen':'abstained'});if(!ok)return{status:'abstained',code:parent,steps,inputTokens:total,costUsd:cost,model,latencyMs:Date.now()-started,reason:'insufficient_facts'};parent=digits(d.selected!.h);prefixes=[parent];}
   return{status:'complete',code:parent,steps,inputTokens:total,costUsd:cost,model,latencyMs:Date.now()-started};
 }catch(e){return{status:'failed',code:parent,steps,inputTokens:total,costUsd:cost,model,latencyMs:Date.now()-started,reason:e instanceof Error?e.message:'unknown'}}
}
