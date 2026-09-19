import {NextRequest,NextResponse} from 'next/server';
import MiniSearch from 'minisearch';
import records from '../../../data/hts.normalized.json';
type Row={h:string;i:number;d:string;p:string;u:string;g:string;s:string;c:string;a:string};
const rows=records as Row[];
const search=new MiniSearch<Row>({fields:['d','p','h'],storeFields:['h','i','d','p','u','g','s','c','a'],searchOptions:{boost:{d:3,p:1.2,h:5},prefix:true,fuzzy:0.2,combineWith:'OR'}});
search.addAll(rows.map((r,id)=>({...r,id})));
export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get('q')||'').trim().slice(0,120);
 if(q.length<2)return NextResponse.json({query:q,revision:'2026 HTS Revision 18',results:[]});
 const raw=search.search(q,{prefix:true,fuzzy:q.length>5?0.2:false}); const ranked=raw.sort((a:any,b:any)=>((b.h?.startsWith('99')?-4:0)+b.score)-((a.h?.startsWith('99')?-4:0)+a.score)); const out=ranked.slice(0,12).map((r:any)=>({hts:r.h,description:r.d,hierarchy:r.p,unit:r.u,general:r.g||'Free',special:r.s,column2:r.c,additional:r.a,score:Number(r.score.toFixed(2)),source:`https://hts.usitc.gov/search?query=${encodeURIComponent(r.h)}`}));
 return NextResponse.json({query:q,revision:'2026 HTS Revision 18',retrievedAt:new Date().toISOString(),results:out});
}
