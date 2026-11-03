/* 香港故事地图 · static application; works from a downloaded ZIP. */
(function () {
  'use strict';
  const C = window.AtlasCore;
  if (!C) return;
  const $ = id => document.getElementById(id);
  const e = C.escapeHtml;
  const all = Array.isArray(window.HK_STORIES) ? window.HK_STORIES : [];
  const byId = new Map(all.map(s => [s.id,s]));
  const numberOf = new Map([...all].sort((a,b) => a.start-b.start || a.id.localeCompare(b.id)).map((s,i) => [s.id,i+1]));
  const storeKey = 'hk-story-atlas-v1';
  function getStored() {
    try {
      const v = JSON.parse(localStorage.getItem(storeKey) || '{}');
      return {read:Array.isArray(v.read)?v.read.filter(x=>byId.has(x)):[],saved:Array.isArray(v.saved)?v.saved.filter(x=>byId.has(x)):[]};
    } catch (_) { return {read:[],saved:[]}; }
  }
  const stored = getStored();
  const state = {read:new Set(stored.read),saved:new Set(stored.saved),selected:null,view:'map',filtered:[],basemap:'diagram',route:null,from:1841,to:2026};
  let lastFocus = null, toastTimer, leafletMap, leafletLayer, leafletLoading, streetLoadTimer;
  let vb = {x:0,y:0,w:1000,h:760};
  const baseBox = {x:0,y:0,w:1000,h:760};
  const geo = {west:113.78,east:114.49,north:22.61,south:22.10};
  const project = p => [(Number(p[0])-geo.west)/(geo.east-geo.west)*1000,(geo.north-Number(p[1]))/(geo.north-geo.south)*760];
  const routes = [
    {id:'moving-city',title:'城市如何移动',text:'从渡海到铁路，再从旧机场读到新机场。',label:'01 / 移动的城市',ids:['star-ferry','railway-clock-tower','tai-po-railway','kai-tak-airport','chek-lap-kok']},
    {id:'taste-of-hong-kong',title:'一口香港',text:'从奶茶与茶楼，读到艇上生活、迁徙、蚝业与节庆。',label:'02 / 味道与人',ids:['lan-fong-yuen','lin-heung','aberdeen-boat-kitchen','kowloon-city-thai','lau-fau-shan','cheung-chau-buns']},
    {id:'a-place-to-live',title:'住在哪里',text:'火灾、迁村、清拆与保育，把住处变成城市的命题。',label:'03 / 家与社区',ids:['mei-ho-house','lek-yuen','sam-tung-uk','kowloon-walled-city','blue-house-tenants','tai-o']},
    {id:'city-and-epidemics',title:'从疫病读城市',text:'两场疫症，相隔百年：医学、治理与信任怎样改变？',label:'04 / 医学与信任',ids:['blake-garden-plague','prince-of-wales-sars']},
    {id:'public-life',title:'公共空间里的转折',text:'从主权移交的会场，读到街头抗争与制度变化。',label:'05 / 街道与时代',ids:['hkcec-handover','admiralty-umbrellas','legco-2019-2024']},
    {id:'living-memory',title:'留下来的，不止建筑',text:'庙宇、大学、戏院与街坊，接起不同年代的文化生活。',label:'06 / 文化的传递',ids:['man-mo-tung-wah','hku-main-building','north-point-state-theatre','yau-ma-tei-theatre','blue-house-tenants']}
  ];
  function saveState() {
    try { localStorage.setItem(storeKey,JSON.stringify({read:[...state.read],saved:[...state.saved]})); }
    catch (_) { toast('已在这次浏览中记录；当前浏览器未允许长期保存。'); }
  }
  function toast(message) {
    $('toast').textContent = message;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; },3500);
  }
  function filters() {
    return {query:$('search').value,region:$('region').value,theme:$('theme').value,from:$('year-from').value,to:$('year-to').value,
      routeIds:state.route?state.route.ids:null,savedOnly:$('saved-only').checked,unreadOnly:$('unread-only').checked,saved:[...state.saved],read:[...state.read]};
  }
  function refs(s,ids) {
    return [...new Set(ids || [])].map(id => {
      const index = (s.sources || []).findIndex(x => x.id === id);
      return index < 0 ? '' : '<button class="source-ref" type="button" data-source-ref="'+e(id)+'" aria-label="查看来源'+(index+1)+'">['+(index+1)+']</button>';
    }).join('');
  }
  function readButton(s) {
    return '<button class="story-card '+(state.read.has(s.id)?'is-read ':'')+(state.selected===s.id?'active':'')+'" data-open="'+e(s.id)+'" aria-label="'+e(C.yearLabel(s)+'，'+s.place+'，'+s.title)+'"><span class="story-index">'+(state.read.has(s.id)?'✓':String(numberOf.get(s.id)).padStart(2,'0'))+'</span><span><span class="story-kicker"><span>'+e(s.region)+' · '+e(s.place)+'</span><span>'+e(C.yearLabel(s))+(state.saved.has(s.id)?' <span class="bookmark-label">◆</span>':'')+'</span></span><h3>'+e(s.title)+'</h3><p>'+e(s.teaser)+'</p></span></button>';
  }
  function emptyHTML() {
    return '<div class="empty"><strong>暂时没有相遇的故事。</strong>试着放宽年代，换一个关键词，或取消收藏与未读筛选。<br><button type="button" data-reset>清除筛选，重新探索</button></div>';
  }
  function update() {
    state.filtered = C.filterStories(all,filters());
    $('result-count').textContent = state.filtered.length;
    $('story-list').innerHTML = state.filtered.length ? state.filtered.map(readButton).join('') : emptyHTML();
    const from = Number($('year-from').value), to = Number($('year-to').value);
    $('filter-hint').textContent = from>to ? '起始年份应不晚于结束年份' : state.route ? state.route.title+' · 阅读顺序' : '按故事起点排列';
    $('year-to').setAttribute('aria-invalid',String(from>to));
    $('map-title').textContent=state.route?state.route.title:'香港 · 地方与记忆';
    $('map-subtitle').textContent=state.route?'已按建议顺序排列 '+state.filtered.length+'篇故事':'点选编号，进入故事';
    document.querySelectorAll('[data-era]').forEach(btn => {
      const [a,b] = btn.dataset.era.split(',').map(Number);
      btn.classList.toggle('active',a===from && b===to);
      btn.setAttribute('aria-pressed',String(a===from && b===to));
    });
    $('progress-label').textContent = state.read.size+' / '+all.length;
    $('progress').max = all.length || 1;
    $('progress').value = state.read.size;
    renderDiagram();
    renderTimeline();
    renderMemory();
    renderLeafletMarkers();
    $('canvas-status').textContent = '当前筛选有'+state.filtered.length+'篇故事，已读'+state.read.size+'篇。';
    $('cluster-panel').hidden = true;
    if (state.selected) updateReaderControls();
  }
  function resetFilters() {
    state.route=null;
    $('search').value='';$('region').value='';$('theme').value='';
    $('year-from').value='1841';$('year-to').value='2026';
    $('saved-only').checked=false;$('unread-only').checked=false;
    update();
  }
  function applyView(view) {
    state.view = view;
    ['map','timeline','memory'].forEach(x => {
      $(x+'-view').hidden = x!==view;
      $('view-'+x).classList.toggle('active',x===view);
      $('view-'+x).setAttribute('aria-pressed',String(x===view));
    });
    if (view==='map' && leafletMap && state.basemap==='street') setTimeout(()=>leafletMap.invalidateSize(),0);
  }
  function renderTimeline() {
    $('timeline-content').innerHTML = state.filtered.length ? C.groupYears(state.filtered).map(group =>
      '<section class="timeline-decade"><h3>'+group.year+'<small>年代</small></h3><div class="timeline-track">'+group.items.map(s=>
        '<button class="timeline-item" data-open="'+e(s.id)+'"><small>'+e(C.yearLabel(s))+' · '+e(s.place)+'</small><h4>'+e(s.title)+'</h4><p>'+e(s.teaser)+'</p></button>'
      ).join('')+'</div></section>'
    ).join('') : emptyHTML();
  }
  function renderMemory() {
    $('memory-content').innerHTML = state.filtered.length ? state.filtered.map(s=>
      '<article class="memory-card"><small>'+e(s.region)+' / '+e(C.yearLabel(s))+(state.read.has(s.id)?' / 已读':' / 尚未读过')+'</small><h3>'+e(s.place)+'</h3><p>这里经历过怎样的转折？试着先回想一个人、一件物，或一个年份。</p><details><summary>翻开一句话记忆</summary><p>'+e(s.memory)+'</p><button data-open="'+e(s.id)+'">回到故事，核对记忆 ↗</button></details></article>'
    ).join('') : emptyHTML();
  }
  function renderRoutes() {
    $('routes-grid').innerHTML = routes.map(r => {
      const count = r.ids.filter(id=>byId.has(id)).length;
      return '<button class="route-card" data-route="'+e(r.id)+'"><small>'+e(r.label)+'</small><strong>'+e(r.title)+'</strong><p>'+e(r.text)+'</p><span>'+count+'篇故事 →</span></button>';
    }).join('');
  }
  function setHash(id) {
    const h = id ? '#story='+encodeURIComponent(id) : '';
    try { history.replaceState(null,'',location.pathname+location.search+h); }
    catch (_) { if (location.hash!==h) location.hash = h; }
  }
  function openStory(id,fromHash) {
    const s = byId.get(id);
    if (!s) return;
    if (!state.selected) lastFocus = document.activeElement;
    state.selected=id;
    $('reader').hidden=false;
    syncReaderAccessibility();
    const related = all.filter(x => x.id!==id && (x.district===s.district || (x.themes||[]).some(t=>(s.themes||[]).includes(t))))
      .sort((a,b) => (a.district===s.district?-1:0)-(b.district===s.district?-1:0) || Math.abs(a.start-s.start)-Math.abs(b.start-s.start)).slice(0,3);
    const sourceList = (s.sources||[]).map((src,i)=>{
      const url=C.safeUrl(src.url);
      return '<li id="source-'+e(s.id)+'-'+e(src.id)+'">'+(url?'<a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+e(src.title)+' ↗</a>':e(src.title))+'<small>'+e(src.publisher)+' · '+e(src.type||'文献')+' · 查阅 '+e(src.accessed||'2026-11-03')+'</small><p>'+e(src.supports||'')+'</p></li>';
    }).join('');
    const osm = 'https://www.openstreetmap.org/?mlat='+Number(s.coordinates[0])+'&mlon='+Number(s.coordinates[1])+'#map=17/'+Number(s.coordinates[0])+'/'+Number(s.coordinates[1]);
    $('reader-content').innerHTML =
      '<div class="reader-kicker"><span>'+e(s.region)+' / '+e(s.district)+' / '+e(s.place)+'</span><span>约'+C.readingMinutes(s)+'分钟</span></div>'+
      '<h2 class="reader-title" id="reader-title" tabindex="-1">'+e(s.title)+'</h2><p class="reader-subtitle">'+e(s.subtitle||'')+'</p>'+
      '<div class="reader-tags"><span>'+e(C.yearLabel(s))+'</span>'+(s.themes||[]).map(x=>'<span>'+e(x)+'</span>').join('')+'</div>'+
      (!state.filtered.some(x=>x.id===id)?'<p class="reader-context">这篇故事来自直接链接，当前筛选未包含它。你可以继续阅读，或重置筛选后在地图寻找它。</p>':'')+
      '<div class="reader-prose">'+(s.paragraphs||[]).map(p=>'<p>'+e(p.text)+refs(s,p.sourceIds)+'</p>').join('')+'</div>'+
      '<blockquote class="memory-anchor"><small>带走一句记忆</small><p>'+e(s.memory)+'</p></blockquote>'+
      ((s.people||[]).length?'<section class="reader-section"><h3>故事里的人</h3><ul class="people-list">'+s.people.map(p=>'<li><strong>'+e(p.name)+'</strong><span>'+e(p.role)+'</span></li>').join('')+'</ul></section>':'')+
      '<section class="reader-section"><h3>把时间理清</h3><ol class="chronology">'+(s.chronology||[]).map(c=>'<li><time>'+e(c.year)+'</time><p>'+e(c.text)+refs(s,c.sourceIds)+'</p></li>').join('')+'</ol></section>'+
      '<section class="reader-section"><h3>回到今天的这个地方</h3><p>'+e(s.today)+'</p><p class="location-note">'+e(s.locationNote||'坐标为叙事定位点，不代表历史场所的完整边界。')+'</p><a class="today-link" href="'+e(osm)+'" target="_blank" rel="noopener noreferrer">在街道地图查看定位 ↗</a></section>'+
      (s.uncertainty?'<section class="reader-section uncertainty"><h3>史料的边界</h3><p>'+e(s.uncertainty)+'</p></section>':'')+
      '<details class="reader-section source-details" id="story-sources"><summary>出处与继续阅读 · '+(s.sources||[]).length+'项</summary><p>方括号对应本篇来源。叙事是根据文献所作的原创转述，不是当事人的逐字口述。请点开原文，继续核对。</p><ol class="source-list">'+sourceList+'</ol></details>'+
      (related.length?'<section class="reader-section"><h3>接着读，线索还在延伸</h3>'+related.map(readButton).join('')+'</section>':'');
    $('reader').scrollTop=0;
    if (!fromHash) setHash(id);
    updateReaderControls();
    renderDiagram();renderLeafletMarkers();
    document.querySelectorAll('#story-list [data-open]').forEach(btn => btn.classList.toggle('active',btn.dataset.open===id));
    setTimeout(()=>{if (state.selected===id)$('reader-title').focus({preventScroll:true});},0);
  }
  function readerSequence() {
    if(state.filtered.some(s=>s.id===state.selected)) return state.filtered;
    const eligible=C.filterStories(all,{...filters(),savedOnly:false,unreadOnly:false});
    if(eligible.some(s=>s.id===state.selected)) {
      const visible=new Set(state.filtered.map(s=>s.id));visible.add(state.selected);
      return eligible.filter(s=>visible.has(s.id));
    }
    return [...all].sort((a,b)=>a.start-b.start || a.id.localeCompare(b.id));
  }
  function updateReaderControls() {
    const id=state.selected;if(!id)return;
    const saved=state.saved.has(id),read=state.read.has(id),seq=readerSequence(),i=seq.findIndex(s=>s.id===id);
    $('save-story').textContent=saved?'已收藏 ◆':'收藏 ◇';$('save-story').classList.toggle('active',saved);$('save-story').setAttribute('aria-pressed',String(saved));
    $('mark-read').textContent=read?'已读 ✓ · 撤销':'标为读过';$('mark-read').classList.toggle('active',read);$('mark-read').setAttribute('aria-pressed',String(read));
    $('previous-story').disabled=i<=0;$('next-story').disabled=i<0||i>=seq.length-1;
  }
  function syncReaderAccessibility() {
    const modal=!$('reader').hidden && window.matchMedia('(max-width: 760px)').matches;
    $('reader').setAttribute('aria-modal',String(modal));
    $('atlas').inert=modal;document.querySelector('.masthead').inert=modal;
  }
  function closeReader(fromHash) {
    if ($('reader').hidden) return;
    $('reader').hidden=true;state.selected=null;syncReaderAccessibility();
    if (!fromHash)setHash('');
    renderDiagram();renderLeafletMarkers();
    document.querySelectorAll('#story-list .story-card').forEach(x=>x.classList.remove('active'));
    if(lastFocus && lastFocus.isConnected)lastFocus.focus({preventScroll:true});
    else $('search').focus({preventScroll:true});
  }
  function syncHash() {
    let id;
    try { id=decodeURIComponent(location.hash.replace(/^#(?:story=)?/,'')); } catch(_){ return; }
    if(id && byId.has(id)) {if(state.selected!==id)openStory(id,true);}
    else if(!id)closeReader(true);
    else toast('这条故事链接暂未收录；你仍可从地图与列表探索。');
  }
  function toggleSet(set,id) { if(set.has(id))set.delete(id);else set.add(id);saveState();update(); }
  async function share() {
    if(!state.selected)return;
    const s=byId.get(state.selected),url=location.href;
    if(location.protocol==='file:') {toast('本地文件地址无法跨设备分享。请分享故事编号：'+s.id+'，或使用已部署网站中的链接。');return;}
    try {await navigator.clipboard.writeText(url);toast('故事链接已复制。');}
    catch(_) {
      const input=document.createElement('textarea');input.value=url;input.style.position='fixed';input.style.left='-9999px';document.body.appendChild(input);input.select();
      let ok=false;try{ok=document.execCommand('copy');}catch(_e){}
      input.remove();toast(ok?'故事链接已复制。':'浏览器未允许复制。可以复制地址栏中的完整故事链接。');
    }
  }
  function renderAbout() {
    const paragraphs=all.reduce((n,s)=>n+(s.paragraphs||[]).length,0), sourceCount=C.uniqueSources(all).length;
    $('about-content').innerHTML =
      '<p class="about-stat"><strong>'+all.length+'</strong>篇地方故事 · <strong>'+sourceCount+'</strong>个独立文献链接</p>'+
      '<p>这是一张近代以来的香港故事地图。我们挑选能说明城市转折的地方，沿地点、人物、食物与年代展开，而不是收齐所有景点。正文有'+paragraphs+'段带来源的叙事；具体日期与不确定性请以各篇说明为准。</p>'+
      '<h3>怎么读</h3><ul><li>在地图点选编号，或从左侧列表进入故事。地点密集时，点开数字组合可选择其中每一篇。</li><li>年代筛选按文章所讲时间跨度的交集计算。时间线按叙事起点排列，不能当作完整香港大事年表。</li><li>读完亲手标记“已读”，收藏想再来的故事，再用记忆卡回想。记录只保存在这台浏览器，不会上传。</li><li>地图坐标用于帮助理解空间关系。旧址、迁址、填海与资料差异在各篇另注；这不是导航或营业状态查询工具。</li></ul>'+
      '<h3>先让现成成果继续被读到</h3><p>相关工作各有长处。本项目保留它们的入口，不搬运其受版权保护的长文、歌词和图片。</p><ul>'+
      '<li><a href="https://daisywuh.github.io/Urban-Senses-of-Hong-Kong/" target="_blank" rel="noopener noreferrer">Urban Senses of Hong Kong ↗</a>：从歌曲与流行文化进入城市记忆。</li>'+
      '<li><a href="https://github.com/Peippa/kaitak-memory" target="_blank" rel="noopener noreferrer">Kai Tak Memory ↗</a>：围绕启德的时代、地点与历史资料。</li>'+
      '<li><a href="https://hongkongstory.org/" target="_blank" rel="noopener noreferrer">香港纪事馆 ↗</a>：查地点实体轴、年表与带文献线索的深度专题。</li>'+
      '<li><a href="https://cswbrian.github.io/street-naming-map/" target="_blank" rel="noopener noreferrer">Hong Kong Streets Timeline ↗</a>：从街道命名追索城市年代。</li></ul>'+
      '<h3>写作与核实</h3><p>叙事结构参考公开的故事写作技能：从具体物件和处境进入，保留转折与地理位置。史料之外不添加对白、心理、天气或感官；争议与来源口径分开说明。没有把小说方法当成编造事实的许可。</p>'+
      '<p><a href="https://github.com/hongjinrui/ToKnow_Hongkong/blob/main/docs/RESEARCH.md" target="_blank" rel="noopener noreferrer">项目检索与复用决定 ↗</a> · <a href="https://github.com/hongjinrui/ToKnow_Hongkong/blob/main/docs/EDITORIAL.md" target="_blank" rel="noopener noreferrer">叙事与考证规范 ↗</a> · <a href="https://github.com/hongjinrui/ToKnow_Hongkong/blob/main/docs/SOURCES.md" target="_blank" rel="noopener noreferrer">完整文献目录 ↗</a></p>'+
      '<h3>地图与阅读版本</h3><p>离线底图来自2017年OpenStreetMap衍生几何，经过概化，用于辨认地点方位，并非历史岸线。<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors，ODbL 1.0 ↗</a>。街道底图使用Leaflet与OpenStreetMap，切换时才加载网络资源；离线故事阅读不受影响。</p>'+
      '<p><a href="reader.html">纯文字阅读 ↗</a> · <a href="memory-cards.html">打印记忆卡 ↗</a> · <a href="https://github.com/hongjinrui/ToKnow_Hongkong" target="_blank" rel="noopener noreferrer">源代码与资料仓库 ↗</a></p>'+
      '<p>编写与查阅日期：2026年11月3日。内容覆盖和可核实的最新事件以每篇来源为准；这不是实时更新的新闻站。</p>';
  }
  function about() { const d=$('about-dialog');if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open',''); }
  function coastPaths() {
    const fc=window.HK_COAST;
    if(!fc || !Array.isArray(fc.features))return '';
    let out='';
    const polygon= rings => {
      const d=rings.map(ring => ring.map((p,i)=>{const [x,y]=project(p);return (i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);}).join('')+'Z').join('');
      return '<path class="coast" d="'+d+'"/>';
    };
    fc.features.forEach(f=>{
      const g=f.geometry;if(!g)return;
      if(g.type==='Polygon')out+=polygon(g.coordinates);
      else if(g.type==='MultiPolygon')g.coordinates.forEach(p=>{out+=polygon(p);});
    });
    return out;
  }
  const coastline=coastPaths();
  function svgText(lng,lat,text,className) {
    const [x,y]=project([lng,lat]);return '<text x="'+x+'" y="'+y+'" class="'+className+'">'+text+'</text>';
  }
  function clusters() {
    const rect=$('atlas-svg').getBoundingClientRect();
    const pixelsPerUnit=Math.min(rect.width/vb.w,rect.height/vb.h) || 1;
    const buckets=new Map(), threshold=40/pixelsPerUnit;
    state.filtered.forEach(s=>{
      const p=project([s.coordinates[1],s.coordinates[0]]);
      const key=Math.floor(p[0]/threshold)+':'+Math.floor(p[1]/threshold);
      if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({s,p});
    });
    return [...buckets.values()];
  }
  function renderDiagram() {
    const svg=$('atlas-svg');if(!svg)return;
    svg.setAttribute('viewBox',[vb.x,vb.y,vb.w,vb.h].join(' '));
    const rect=svg.getBoundingClientRect();
    const factor=1/(Math.min(rect.width/vb.w,rect.height/vb.h)||1);
    const grid = Array.from({length:11},(_,i)=>'<path class="map-grid" d="M'+(i*100)+' 0V760"/>').join('')+
      Array.from({length:9},(_,i)=>'<path class="map-grid" d="M0 '+(i*100)+'H1000"/>').join('');
    const markers=clusters().map(group=>{
      const x=group.reduce((a,v)=>a+v.p[0],0)/group.length,y=group.reduce((a,v)=>a+v.p[1],0)/group.length;
      const first=group[0].s, count=group.length, id=first.id;
      const allRead=group.every(v=>state.read.has(v.s.id)),selected=group.some(v=>v.s.id===state.selected);
      const label=count>1?count+'':String(numberOf.get(id)).padStart(2,'0');
      const r=count>1?16:14, ids=group.map(v=>v.s.id).join('|');
      const title=count>1?count+'篇故事：'+group.map(v=>v.s.place).join('、'):first.place+'：'+first.title;
      return '<g class="map-mark '+(allRead?'read ':'')+(selected?'selected':'')+'" transform="translate('+x+' '+y+') scale('+factor+')" role="button" tabindex="0" data-map-ids="'+e(ids)+'" aria-label="'+e(title)+'"><title>'+e(title)+'</title><circle class="marker-halo" r="'+(r+4)+'"/><circle class="marker-dot" r="'+r+'"/><text>'+e(label)+'</text>'+(vb.w<620 && count===1?'<text class="marker-name" x="19" y="1">'+e(first.place.length>10?first.place.slice(0,10)+'…':first.place)+'</text>':'')+'</g>';
    }).join('');
    svg.innerHTML = '<rect x="-10000" y="-10000" width="20000" height="20000" fill="#173f3d"/>'+grid+coastline+
      svgText(114.05,22.45,'新 界','map-region-label')+svgText(114.165,22.34,'九 龙','map-region-label')+
      svgText(114.18,22.26,'香港岛','map-region-label')+svgText(113.94,22.25,'大屿山','map-region-label')+
      svgText(114.13,22.20,'南丫岛','map-small-label')+svgText(114.30,22.17,'南 中 国 海','map-water-label')+markers;
  }
  function setBox(box) {
    const w=Math.max(140,Math.min(1200,box.w)),h=w*.76;
    vb={x:Math.max(-100,Math.min(1100-w,box.x)),y:Math.max(-100,Math.min(860-h,box.y)),w,h};
    renderDiagram();
  }
  function zoom(mult,cx,cy) {
    if(state.basemap==='street'&&leafletMap){mult<1?leafletMap.zoomIn():leafletMap.zoomOut();return;}
    const x=cx==null?vb.x+vb.w/2:cx,y=cy==null?vb.y+vb.h/2:cy;
    const w=vb.w*mult,h=vb.h*mult;
    setBox({x:x-(x-vb.x)*mult,y:y-(y-vb.y)*mult,w,h});
  }
  function chooseCluster(ids) {
    const stories=ids.map(id=>byId.get(id)).filter(Boolean);
    if(stories.length===1){openStory(stories[0].id);return;}
    $('cluster-panel').innerHTML='<div><span>'+stories.length+'篇邻近的故事</span><button class="quiet" data-cluster-close aria-label="关闭邻近故事列表">×</button></div>'+
      stories.map(s=>'<button data-open="'+e(s.id)+'"><small>'+e(C.yearLabel(s))+' · '+e(s.place)+'</small>'+e(s.title)+'</button>').join('');
    $('cluster-panel').hidden=false;
    const p=project([stories[0].coordinates[1],stories[0].coordinates[0]]);
    if(vb.w>400)setBox({x:p[0]-200,y:p[1]-152,w:400,h:304});
    $('cluster-panel').querySelector('[data-open]').focus({preventScroll:true});
  }
  function loadLeaflet() {
    if(window.L)return Promise.resolve();
    if(leafletLoading)return leafletLoading;
    leafletLoading=new Promise((resolve,reject)=>{
      const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(link);
      const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='anonymous';
      const timer=setTimeout(()=>{leafletLoading=null;reject(new Error('timeout'));},12000);
      script.onload=()=>{clearTimeout(timer);window.L?resolve():reject(new Error('unavailable'));};
      script.onerror=()=>{clearTimeout(timer);leafletLoading=null;reject(new Error('offline'));};
      document.head.appendChild(script);
    });
    return leafletLoading;
  }
  async function toggleBasemap() {
    if(state.basemap==='street'){showDiagram();return;}
    $('basemap-toggle').disabled=true;$('basemap-toggle').textContent='正在载入街道底图…';
    try {
      await loadLeaflet();
      state.basemap='street';$('diagram-map').hidden=true;$('street-map').hidden=false;
      $('map-view').classList.add('street-active');$('basemap-toggle').textContent='切回离线方位图';
      if(!leafletMap) {
        leafletMap=window.L.map('street-map',{zoomControl:false,attributionControl:true,minZoom:8,maxZoom:19}).setView([22.32,114.14],11);
        let loaded=false,errors=0;
        const tiles=window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(leafletMap);
        tiles.on('tileload',()=>{loaded=true;clearTimeout(streetLoadTimer);});
        tiles.on('tileerror',()=>{errors++;if(errors>5&&!loaded){showDiagram();toast('街道底图暂不可用，已保留可离线阅读的方位地图。');}});
        streetLoadTimer=setTimeout(()=>{if(!loaded&&state.basemap==='street'){showDiagram();toast('街道底图未能载入，已切回离线方位图。');}},12000);
        leafletLayer=window.L.layerGroup().addTo(leafletMap);
      }
      setTimeout(()=>{leafletMap.invalidateSize();renderLeafletMarkers();},0);
    }catch(_){showDiagram();toast('网络底图暂不可用；所有故事与离线方位图仍可阅读。');}
    finally{$('basemap-toggle').disabled=false;}
  }
  function showDiagram() {
    state.basemap='diagram';$('diagram-map').hidden=false;$('street-map').hidden=true;$('map-view').classList.remove('street-active');
    $('basemap-toggle').textContent='切换街道底图 ↗';clearTimeout(streetLoadTimer);
  }
  function renderLeafletMarkers() {
    if(!leafletMap||!leafletLayer)return;
    leafletLayer.clearLayers();
    state.filtered.forEach(s=>{
      const html='<span>'+String(numberOf.get(s.id)).padStart(2,'0')+'</span>';
      const icon=window.L.divIcon({className:'leaflet-story-icon '+(state.read.has(s.id)?'read ':'')+(state.selected===s.id?'selected':''),html,iconSize:[28,28],iconAnchor:[14,14]});
      const marker=window.L.marker(s.coordinates,{icon,title:s.place+'：'+s.title,keyboard:true}).addTo(leafletLayer);
      const content=document.createElement('span');content.textContent=s.place+' · '+s.title;
      marker.bindTooltip(content).on('click',()=>openStory(s.id));
    });
  }
  function resetMap() {
    if(state.basemap==='street'&&leafletMap){
      const points=state.filtered.map(s=>s.coordinates);
      if(points.length)leafletMap.fitBounds(window.L.latLngBounds(points),{padding:[45,100],maxZoom:13});
      else leafletMap.setView([22.32,114.14],11);
    }else{vb={...baseBox};renderDiagram();}
    $('cluster-panel').hidden=true;
  }
  function bindMap() {
    const svg=$('atlas-svg');
    let drag=null,moved=false;
    svg.addEventListener('pointerdown',evt=>{
      if(evt.target.closest('[data-map-ids]'))return;
      const r=svg.getBoundingClientRect();
      drag={x:evt.clientX,y:evt.clientY,bx:vb.x,by:vb.y,w:vb.w,h:vb.h,rect:r};moved=false;
      svg.setPointerCapture(evt.pointerId);svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove',evt=>{
      if(!drag)return;
      const scale=Math.max(drag.w/drag.rect.width,drag.h/drag.rect.height);
      const dx=(evt.clientX-drag.x)*scale,dy=(evt.clientY-drag.y)*scale;
      if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
      setBox({x:drag.bx-dx,y:drag.by-dy,w:drag.w,h:drag.h});
    });
    function endDrag(){drag=null;svg.classList.remove('dragging');}
    svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
    svg.addEventListener('wheel',evt=>{evt.preventDefault();zoom(evt.deltaY>0?1.18:.85);},{passive:false});
    svg.addEventListener('click',evt=>{
      const mark=evt.target.closest('[data-map-ids]');
      if(mark&&!moved)chooseCluster(mark.dataset.mapIds.split('|'));
      moved=false;
    });
    svg.addEventListener('keydown',evt=>{
      const mark=evt.target.closest('[data-map-ids]');
      if(mark&&(evt.key==='Enter'||evt.key===' ')){evt.preventDefault();chooseCluster(mark.dataset.mapIds.split('|'));}
    });
  }
  function bind() {
    $('filters').addEventListener('submit',evt=>evt.preventDefault());
    ['search','year-from','year-to'].forEach(id=>$(id).addEventListener('input',update));
    ['region','theme','saved-only','unread-only'].forEach(id=>$(id).addEventListener('change',update));
    $('reset-filters').addEventListener('click',resetFilters);
    document.querySelectorAll('[data-era]').forEach(btn=>btn.addEventListener('click',()=>{
      const[a,b]=btn.dataset.era.split(',');$('year-from').value=a;$('year-to').value=b;update();
    }));
    document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>applyView(btn.dataset.view)));
    $('routes-toggle').addEventListener('click',()=>{
      $('routes-panel').hidden=!$('routes-panel').hidden;$('routes-toggle').setAttribute('aria-expanded',String(!$('routes-panel').hidden));
    });
    document.addEventListener('click',evt=>{
      const open=evt.target.closest('[data-open]');if(open){openStory(open.dataset.open);$('cluster-panel').hidden=true;return;}
      const reset=evt.target.closest('[data-reset]');if(reset){resetFilters();return;}
      const route=evt.target.closest('[data-route]');if(route){
        resetFilters();state.route=routes.find(r=>r.id===route.dataset.route)||null;update();$('routes-panel').hidden=true;$('routes-toggle').setAttribute('aria-expanded','false');applyView('map');resetMap();toast(state.route?'已按“'+state.route.title+'”的建议阅读顺序排列。':'已恢复全部故事。');return;
      }
      const source=evt.target.closest('[data-source-ref]');
      if(source&&state.selected){
        $('story-sources').open=true;
        const target=$('source-'+state.selected+'-'+source.dataset.sourceRef);
        if(target){target.setAttribute('tabindex','-1');target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});target.focus({preventScroll:true});}
      }
      if(evt.target.closest('[data-cluster-close]'))$('cluster-panel').hidden=true;
    });
    $('reader-close').addEventListener('click',()=>closeReader());
    $('save-story').addEventListener('click',()=>{if(state.selected)toggleSet(state.saved,state.selected);});
    $('mark-read').addEventListener('click',()=>{if(state.selected)toggleSet(state.read,state.selected);});
    $('share-story').addEventListener('click',share);
    $('previous-story').addEventListener('click',()=>{const seq=readerSequence(),i=seq.findIndex(s=>s.id===state.selected);if(i>0)openStory(seq[i-1].id);});
    $('next-story').addEventListener('click',()=>{const seq=readerSequence(),i=seq.findIndex(s=>s.id===state.selected);if(i>=0&&i<seq.length-1)openStory(seq[i+1].id);});
    $('random-story').addEventListener('click',()=>{const pool=state.filtered;if(pool.length)openStory(pool[Math.floor(Math.random()*pool.length)].id);else toast('当前筛选没有故事，请先放宽条件。');});
    $('about-open').addEventListener('click',about);$('sources-open').addEventListener('click',about);
    $('about-close').addEventListener('click',()=>{const d=$('about-dialog');if(d.close)d.close();else d.removeAttribute('open');});
    $('about-dialog').addEventListener('click',evt=>{if(evt.target===$('about-dialog')){const r=$('about-dialog').getBoundingClientRect();if(evt.clientX<r.left||evt.clientX>r.right||evt.clientY<r.top||evt.clientY>r.bottom)$('about-dialog').close();}});
    $('zoom-in').addEventListener('click',()=>zoom(.72));$('zoom-out').addEventListener('click',()=>zoom(1.38));$('zoom-reset').addEventListener('click',resetMap);
    $('basemap-toggle').addEventListener('click',toggleBasemap);
    document.addEventListener('keydown',evt=>{
      if(evt.key==='Tab' && !$('reader').hidden && window.matchMedia('(max-width: 760px)').matches) {
        const controls=[...$('reader').querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
        const first=controls[0],last=controls[controls.length-1],active=document.activeElement;
        if(first&&((evt.shiftKey&&(active===first||!$('reader').contains(active)))||(!evt.shiftKey&&active===last))){evt.preventDefault();(evt.shiftKey?last:first).focus();}
      }
      if(evt.key==='Escape'){
        if($('about-dialog').open)return;
        if(!$('reader').hidden)closeReader();
        else if(!$('cluster-panel').hidden)$('cluster-panel').hidden=true;
        else {$('routes-panel').hidden=true;$('routes-toggle').setAttribute('aria-expanded','false');}
      }
      const target=evt.target,typing=target && (['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable);
      if(evt.key==='/'&&!typing&&$('reader').hidden&&!$('about-dialog').open){evt.preventDefault();$('search').focus();}
    });
    window.addEventListener('hashchange',syncHash);
    window.addEventListener('resize',()=>{renderDiagram();syncReaderAccessibility();if(leafletMap&&state.basemap==='street')leafletMap.invalidateSize();});
    bindMap();
  }
  function init() {
    C.THEMES.forEach(theme=>{const opt=document.createElement('option');opt.value=theme;opt.textContent=theme;$('theme').appendChild(opt);});
    renderRoutes();renderAbout();bind();update();syncHash();
    if(!all.length)toast('故事资料未能载入。请确认下载了完整项目，并保留data文件夹。');
    if(!coastline)$('map-attribution').textContent='底图资料未载入；地点坐标仍可选择。请确认保留data/coast.js。';
  }
  init();
})();
