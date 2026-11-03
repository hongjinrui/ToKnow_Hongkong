import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const repository=process.env.GITHUB_REPOSITORY;
const expected=process.env.GITHUB_SHA;
const token=process.env.GH_TOKEN;
assert.ok(repository&&expected&&token,'This check runs inside the GitHub Pages publishing workflow.');
const apiBase=process.env.GITHUB_API_URL||'https://api.github.com';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
async function api(path){
  const response=await fetch(apiBase+'/repos/'+repository+path,{
    headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},
    signal:AbortSignal.timeout(20000)
  });
  assert.ok(response.ok,'GitHub Pages metadata request failed: '+response.status);
  return response.json();
}
let build;
for(let attempt=0;attempt<90;attempt++){
  build=await api('/pages/builds/latest');
  if(build.commit===expected&&build.status==='built')break;
  if(build.commit===expected&&build.status==='errored')throw new Error('Pages build failed: '+(build.error?.message||'unknown build error'));
  if(attempt===89)throw new Error('Timed out waiting for Pages to publish '+expected);
  await pause(5000);
}
const config=await api('/pages');
const site=new URL(config.html_url.replace(/\/?$/,'/'));
assert.equal(site.protocol,'https:');
assert.equal(config.source.branch,'gh-pages');
const targets=[
  ['','index.html'],['core.js','core.js'],['app.js','app.js'],['styles.css','styles.css'],
  ['data/stories.js','data/stories.js'],['data/coast.js','data/coast.js'],
  ['reader.html','reader.html'],['memory-cards.html','memory-cards.html'],
  ['hong-kong-story-atlas.html','hong-kong-story-atlas.html']
];
const results=[];
for(const [route,localFile]of targets){
  const url=new URL(route,site);
  const expectedHash=hash(fs.readFileSync(localFile));
  let result;
  for(let attempt=0;attempt<24;attempt++){
    const response=await fetch(url,{
      headers:{'Cache-Control':'no-cache'},
      signal:AbortSignal.timeout(20000)
    });
    const bytes=Buffer.from(await response.arrayBuffer());
    const actualHash=hash(bytes);
    result={url:url.href,status:response.status,sha256:actualHash,bytes:bytes.length,expectedSha256:expectedHash};
    if(response.ok&&actualHash===expectedHash)break;
    if(attempt===23)throw new Error('Published asset is unavailable or stale: '+url.href+' (HTTP '+response.status+')');
    await pause(5000);
  }
  results.push(result);
  console.log('Verified HTTP '+result.status+' '+url.pathname+' ('+result.bytes+' bytes; SHA256 '+result.sha256.slice(0,16)+')');
}
const stories=JSON.parse(fs.readFileSync('data/stories.json','utf8'));
const storyUrl=new URL('#story=kowloon-walled-city',site).href;
const report={status:'passed',site:site.href,commit:expected,source:config.source,buildStatus:build.status,stories:stories.length,storyUrl,checkedAt:new Date().toISOString(),assets:results};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/pages-verification.json',JSON.stringify(report,null,2)+'\n');
fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### 香港故事地图已发布\n\n[打开在线地图]('+site.href+') · [故事链接示例]('+storyUrl+')\n\n36篇故事；首页、数据、脚本及阅读页均通过HTTP与内容版本检查。\n');
console.log('PAGES_VERIFIED '+JSON.stringify({url:site.href,commit:expected,storyUrl,assets:results.length,stories:stories.length}));
