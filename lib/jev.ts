export const JEV_MODEL='jev-1.13.0';
export type Candidate={hts:string;description:string;hierarchyParts:string};
export type JevStatus='off'|'ok'|'cached'|'inconclusive'|'budget_exhausted'|'temporarily_unavailable';
export type JevAssist={status:JevStatus;model?:string;selectedHts?:string;confidence?:number;factsSufficient?:number;fits?:Record<string,number>;inputTokens?:number;estimatedCostUsd?:number;reason?:string};
type Entry={expires:number,value:JevAssist};
const cache=new Map<string,Entry>();let spentTokens=0;
const PRICE_PER_TOKEN=.042/1_000_000;
const MAX_INPUT_TOKENS=5000;
const BUDGET_USD=Number(process.env.JEV_BUDGET_USD||'4.50');
function enabled(){return process.env.JEV_AI_ENABLED==='true'}
function safeId(i:number){return `candidate_${i}`}
async function hash(value:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function resetJevState(){cache.clear();spentTokens=0}
export async function assistWithJev(product:string,candidates:Candidate[],fetcher:typeof fetch=fetch):Promise<JevAssist>{
 if(!enabled())return{status:'off'};
 const key=process.env.JEV_API_KEY;if(!key)return{status:'temporarily_unavailable',reason:'missing_key'};
 const shortlist=candidates.slice(0,12);if(!shortlist.length)return{status:'inconclusive',reason:'no_candidates'};
 const promptVersion='hts-v1';const cacheKey=await hash(JSON.stringify({promptVersion,product:product.trim().toLowerCase(),shortlist,model:JEV_MODEL}));
 const prior=cache.get(cacheKey);if(prior&&prior.expires>Date.now())return{...prior.value,status:'cached'};
 if(spentTokens*PRICE_PER_TOKEN>=BUDGET_USD)return{status:'budget_exhausted'};
 const state={product:product.slice(0,500),candidates:shortlist.map((c,i)=>({id:safeId(i),official_description:c.description,hierarchy:c.hierarchyParts}))};
 const criteria=Object.fromEntries(shortlist.map((c,i)=>[safeId(i),`${c.description}. Hierarchy: ${c.hierarchyParts}`]));criteria.none_of_these='The supplied product facts do not support any candidate.';
 const questions:any={best_candidate:{type:'choice',instructions:'Which one candidate is the closest semantic fit for the supplied product facts? Pick none_of_these when the facts do not support any candidate.',criteria},facts_sufficient:{type:'noul',instructions:'Are the supplied product facts sufficient to distinguish among this exact candidate list?',criteria:{true:'Enough material, use, construction, and other distinguishing facts are supplied.',false:'Important facts are missing or several candidates remain plausible.'}}};
 shortlist.forEach((c,i)=>questions[`fit_${i}`]={type:'noul',instructions:`Are the supplied product facts consistent with candidate ${safeId(i)}: ${c.description}?`,criteria:{true:'Facts fit the official description without contradiction.',false:'Facts conflict with it or are too incomplete to support it.'}});
 const body=JSON.stringify({state,model:JEV_MODEL,questions});
 if(Math.ceil(body.length/4)>MAX_INPUT_TOKENS)return{status:'inconclusive',reason:'request_too_large'};
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);let res:Response|undefined;
  for(let attempt=0;attempt<2;attempt++){res=await fetcher('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body,signal:controller.signal});if(![429,529].includes(res.status)||attempt===1)break;await new Promise(r=>setTimeout(r,150+Math.random()*150))}clearTimeout(timer);
  if(!res?.ok)return{status:res?.status===402?'budget_exhausted':'temporarily_unavailable',reason:`http_${res?.status||0}`};
  const data:any=await res.json(),tokens=Number(data?.usage?.input_tokens||0);spentTokens+=tokens;
  const choice=data?.answers?.best_candidate,fs=Number(data?.answers?.facts_sufficient?.noul);const selected=String(choice?.choice||'');
  const idx=/^candidate_(\d+)$/.exec(selected),confidence=Number(choice?.confidence);const fits=Object.fromEntries(shortlist.map((c,i)=>[c.hts,Number(data?.answers?.[`fit_${i}`]?.noul)]));
  let value:JevAssist={status:'inconclusive',model:String(data?.model||JEV_MODEL),confidence,factsSufficient:fs,fits,inputTokens:tokens,estimatedCostUsd:Number((tokens*PRICE_PER_TOKEN).toFixed(8))};
  if(idx&&shortlist[Number(idx[1])]&&fs>=.65&&fits[shortlist[Number(idx[1])].hts]>=.60)value={...value,status:'ok',selectedHts:shortlist[Number(idx[1])].hts};
  cache.set(cacheKey,{expires:Date.now()+30*86400_000,value});return value;
 }catch(e){return{status:'temporarily_unavailable',reason:e instanceof Error&&e.name==='AbortError'?'timeout':'network_error'}}
}
export function reorderWithAssist<T extends {hts:string}>(items:T[],assist:JevAssist){if(assist.status!=='ok'||!assist.selectedHts)return items;return [...items].sort((a,b)=>a.hts===assist.selectedHts?-1:b.hts===assist.selectedHts?1:0)}
