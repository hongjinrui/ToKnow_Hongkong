/* Hong Kong Story Atlas — pure, testable helpers. No external dependencies. */
(function (root) {
  'use strict';
  const THEMES = ['城市变迁','人物','食物','交通','灾难与公共卫生','抗争与制度','文化','迁徙'];
  const REGIONS = ['香港岛','九龙','新界','离岛'];
  const pairs = '瀝沥 棟栋 藍蓝 孫孙 蓮莲 蘭兰 園园 樂乐 紀纪 黃黄 顯显 擴扩 議议 羅罗 遜逊 濟济 萬万 壓压 楊杨 蘇苏 傳传 廣广 賦赋 濃浓 馬马 車车 戰战 敗败 傘伞 籠笼 醬酱 蠔蚝 嶼屿 嶺岭 輪轮 燒烧 曉晓 國国 總总 統统 聲声 時时 船船 島岛 九九 龍龙 灣湾 區区 廟庙 舊旧 華华 門门 東东 觀观 塘塘 碼码 頭头 機机 場场 歷历 史史 記记 憶忆 體体 間间 後后 來来 開开 埠埠 災灾 難难 與与 變变 遷迁 爭争 制制 度度 風风 臺台 灣湾 藝艺 樓楼 會会 運运 輸输 學学 醫医 療疗 絲丝 襪袜 飲饮 茶茶 廠厂 難难 民民 鐵铁 路路 線线 處处 親亲 見见 聞闻 長长 發发 慶庆 標标 題题 讀读 寫写 實实 驗验 讓让 這这 個个 們们 複复 興兴 億亿 擇择 護护 衛卫 現现 態态 裏里'.split(' ');
  const conversion = Object.fromEntries(pairs.filter(Boolean).map(p => [p[0], p[1]]));
  function normalize(value) {
    return String(value == null ? '' : value).toLocaleLowerCase('zh-HK').replace(/\s+/g,' ').replace(/[\u3400-\u9fff]/g, c => conversion[c] || c).trim();
  }
  function safeUrl(value) {
    try {
      const u = new URL(String(value));
      return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
    } catch (_) { return ''; }
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function storyText(s) {
    return normalize([
      s.title,s.subtitle,s.place,s.district,s.region,s.teaser,s.memory,
      ...(s.themes || []), ...(s.people || []).map(p => p.name + ' ' + p.role),
      ...(s.paragraphs || []).map(p => p.text)
    ].filter(Boolean).join(' '));
  }
  function filterStories(stories, filters) {
    const f = filters || {};
    const q = normalize(f.query || f.q || '');
    const terms = q.split(/\s+/).filter(Boolean);
    const routeIds = Array.isArray(f.routeIds) ? f.routeIds : null;
    const from = Number.isFinite(Number(f.from)) && f.from !== '' && f.from != null ? Number(f.from) : 1841;
    const to = Number.isFinite(Number(f.to)) && f.to !== '' && f.to != null ? Number(f.to) : 2026;
    if (from > to) return [];
    return (Array.isArray(stories) ? stories : []).filter(s => {
      if (Number(s.end) < from || Number(s.start) > to) return false;
      if (routeIds && !routeIds.includes(s.id)) return false;
      if (f.region && f.region !== '全部' && s.region !== f.region && s.district !== f.region) return false;
      if (f.theme && f.theme !== '全部' && !(s.themes || []).includes(f.theme)) return false;
      if (f.savedOnly && !(f.saved || []).includes(s.id)) return false;
      if (f.unreadOnly && (f.read || []).includes(s.id)) return false;
      const haystack = terms.length ? storyText(s) : '';
      return terms.every(term => haystack.includes(term));
    }).sort((a,b) => (routeIds ? routeIds.indexOf(a.id) - routeIds.indexOf(b.id) : 0) || Number(a.start) - Number(b.start) || a.id.localeCompare(b.id));
  }
  function groupYears(stories) {
    const groups = new Map();
    [...stories].sort((a,b) => a.start - b.start).forEach(s => {
      const decade = Math.floor(s.start / 10) * 10;
      if (!groups.has(decade)) groups.set(decade, []);
      groups.get(decade).push(s);
    });
    return [...groups].map(([year,items]) => ({year,items}));
  }
  function yearLabel(s) { return s.start === s.end ? String(s.start) : s.start + '—' + s.end; }
  function readingMinutes(s) {
    const n = (s.paragraphs || []).reduce((sum,p) => sum + (p.text || '').length,0);
    return Math.max(2, Math.ceil(n / 280));
  }
  function uniqueSources(stories) {
    return [...new Set(stories.flatMap(s => (s.sources || []).map(x => safeUrl(x.url))).filter(Boolean))];
  }
  const api = {THEMES,REGIONS,normalize,safeUrl,escapeHtml,filterStories,groupYears,yearLabel,readingMinutes,uniqueSources};
  root.AtlasCore = Object.freeze(api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
