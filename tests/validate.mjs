import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const box={window:{},URL};vm.createContext(box);
for(const file of ['core.js','data/stories.js','data/coast.js']){
  const code=fs.readFileSync(file,'utf8');
  new vm.Script(code,{filename:file}).runInContext(box);
}
const stories=JSON.parse(JSON.stringify(box.window.HK_STORIES));
assert.equal(stories.length,36,'Expected the curated 36-story edition');
const ids=new Set();const themes=new Set(['城市变迁','人物','食物','交通','灾难与公共卫生','抗争与制度','文化','迁徙']);
const regions=new Set(['香港岛','九龙','新界','离岛']);
let paragraphs=0;let references=0;let narrativeChars=0;
for(const s of stories){
  assert.match(s.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(!ids.has(s.id),'Duplicate '+s.id);ids.add(s.id);
  for(const field of ['title','subtitle','place','district','teaser','memory','today','locationNote','uncertainty'])assert.ok(typeof s[field]==='string'&&s[field].trim(),s.id+' missing '+field);
  assert.ok(regions.has(s.region),s.id+' invalid region');
  assert.ok(Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start>=1841&&s.end<=2026&&s.start<=s.end,s.id+' invalid story range');
  assert.equal(s.coordinates.length,2);
  assert.ok(s.coordinates.every(Number.isFinite));
  assert.ok(s.coordinates[0]>=22.1&&s.coordinates[0]<=22.6&&s.coordinates[1]>=113.8&&s.coordinates[1]<=114.5,s.id+' outside map bounds');
  assert.ok(s.themes.length&&s.themes.every(t=>themes.has(t)),s.id+' invalid theme');
  assert.ok(s.sources.length>=2,s.id+' needs multiple sources');
  const sourceIds=new Set();
  for(const src of s.sources){
    assert.ok(!sourceIds.has(src.id),s.id+' duplicate source ID');sourceIds.add(src.id);
    const url=new URL(src.url);assert.ok(['https:','http:'].includes(url.protocol),s.id+' unsafe source URL');
    for(const f of ['title','publisher','supports','type','accessed'])assert.ok(src[f],s.id+' source missing '+f);
    assert.equal(src.accessed,'2026-11-03');
    references++;
  }
  assert.ok(s.paragraphs.length>=4,s.id+' needs developed narrative');
  const chars=s.paragraphs.reduce((n,p)=>n+p.text.length,0);
  assert.ok(chars>=450&&chars<=1100,s.id+' narrative length '+chars);
  narrativeChars+=chars;
  assert.ok(s.chronology.length>=3,s.id+' needs chronology');
  for(const node of [...s.paragraphs,...s.chronology]){
    assert.ok(node.text&&node.sourceIds?.length,s.id+' uncited passage');
    assert.ok(node.sourceIds.every(id=>sourceIds.has(id)),s.id+' broken source reference');
    assert.ok(!/<script|javascript:/i.test(node.text),s.id+' unexpected executable text');
    if('year'in node)assert.ok(Number.isInteger(node.year)&&node.year>=1800&&node.year<=2026,s.id+' invalid chronology year');
  }
  paragraphs+=s.paragraphs.length;
}
for(const f of ['app.js','core.js'])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
const html=fs.readFileSync('index.html','utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)){
  const target=m[1];if(!/^(?:https?:|data:|mailto:)/i.test(target))assert.ok(fs.existsSync(target),'Missing asset '+target);
}
assert.ok(box.window.HK_COAST.features.length);
assert.equal(box.window.HK_COAST.features[0].geometry.type,'MultiPolygon');
const C=box.window.AtlasCore;assert.ok(C?.filterStories,'Missing testable filter engine');
assert.equal(C.filterStories(stories,{}).length,36);
console.log(JSON.stringify({stories:stories.length,paragraphs,references,narrativeChars,regions:[...regions],integrity:'passed'},null,2));

for(const region of C.REGIONS)assert.equal(C.filterStories(stories,{region}).length,stories.filter(s=>s.region===region).length);
assert.ok(C.filterStories(stories,{from:2003,to:2003}).some(s=>s.id==='prince-of-wales-sars'));
assert.equal(C.filterStories(stories,{from:1800,to:1840}).length,0);
assert.equal(C.filterStories(stories,{from:2020,to:1990}).length,0);
for(const [traditional,simplified] of [['瀝源','沥源'],['三棟屋','三栋屋'],['藍屋','蓝屋'],['孫中山','孙中山'],['蓮香','莲香'],['九龍','九龙']])assert.deepEqual(JSON.parse(JSON.stringify(C.filterStories(stories,{query:traditional}).map(s=>s.id))),JSON.parse(JSON.stringify(C.filterStories(stories,{query:simplified}).map(s=>s.id))));
assert.deepEqual(JSON.parse(JSON.stringify(C.filterStories(stories,{savedOnly:true,unreadOnly:true,saved:['mei-ho-house','blue-house-tenants'],read:['mei-ho-house']}).map(s=>s.id))),['blue-house-tenants']);
assert.deepEqual(JSON.parse(JSON.stringify(C.filterStories(stories,{routeIds:['chek-lap-kok','star-ferry']}).map(s=>s.id))),['chek-lap-kok','star-ferry']);
assert.equal(C.safeUrl('javascript:alert(1)'),'');
assert.equal(C.safeUrl('data:text/html,bad'),'');
assert.equal(C.safeUrl('https://www.amo.gov.hk/'),'https://www.amo.gov.hk/');
assert.equal(C.escapeHtml('<>&"'), '&lt;&gt;&amp;&quot;');
for(const s of stories)assert.ok(s.chronology.every(y=>y.year>=s.start&&y.year<=s.end),s.id+' chronology outside narrative range');
console.log('Filter intersections, reading route order, traditional place queries, citations and URL safety passed.');

assert.deepEqual(stories,JSON.parse(fs.readFileSync('data/stories.json','utf8')),'The offline JS and editable JSON must contain identical stories');
for(const s of stories){
  const md=fs.readFileSync('stories/'+s.id+'.md','utf8');
  for(const p of s.paragraphs)assert.ok(md.includes(p.text),s.id+' Markdown differs from canonical narrative');
}
console.log('Editable JSON, offline JS and GitHub-readable narratives match.');
