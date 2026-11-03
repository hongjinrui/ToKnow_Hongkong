import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[];
html=html.replace(/<link\b[^>]*href="styles\.css"[^>]*>/g,()=>'<style>'+fs.readFileSync('styles.css','utf8')+'</style>');
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g,(tag,src)=>{
  if(/^https?:/.test(src)) return tag;
  const absolute=path.resolve(root,src);
  if(!absolute.startsWith(root+path.sep)) throw new Error('Unsafe local script '+src);
  scripts.push('<script>'+fs.readFileSync(absolute,'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
  return '';
});
html=html.replace('</body>',scripts.join('\n')+'\n</body>');
html=html.replace(/href="(docs\/[^"]+|reader\.html|memory-cards\.html)"/g,(_,p)=>'href="https://github.com/hongjinrui/ToKnow_Hongkong/blob/main/'+p+'"');
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/hong-kong-story-atlas.html',html);
console.log('Portable atlas: artifacts/hong-kong-story-atlas.html ('+Buffer.byteLength(html)+' bytes)');
