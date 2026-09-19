import fs from 'node:fs';

const source = new URL('../data/hts_2026_rev18.csv', import.meta.url);
const output = new URL('../data/hts.normalized.json', import.meta.url);
const text = fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '');
function parseCSV(input) {
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<input.length;i++) { const c=input[i], n=input[i+1];
    if(quoted) { if(c==='"'&&n==='"'){cell+='"';i++;} else if(c==='"') quoted=false; else cell+=c; }
    else if(c==='"') quoted=true; else if(c===','){row.push(cell);cell='';} else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';} else cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row);} return rows;
}
const [header,...rows]=parseCSV(text); const stack=[];
const records=[];
for(const r of rows){
  const [hts,indentRaw,description,unit,general,special,column2,,additional]=r;
  const indent=Number(indentRaw||0); stack[indent]=description?.trim()||''; stack.length=indent+1;
  if(!hts?.trim()) continue;
  const hierarchy=stack.filter(Boolean);
  records.push({h:hts.trim(),i:indent,d:description.trim(),p:hierarchy.slice(0,-1).join(' > '),u:unit?.trim()||'',g:general?.trim()||'',s:special?.trim()||'',c:column2?.trim()||'',a:additional?.trim()||''});
}
fs.writeFileSync(output, JSON.stringify(records));
console.log(`Wrote ${records.length} lines to ${output.pathname}`);
