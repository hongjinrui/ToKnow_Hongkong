# 先找现成成果，再补缺少的一层

检索与审读日期：2026-11-03。检索包含 GitHub 仓库名/描述及公开网页；没有检索到不等于不存在。检索词包括 Hong Kong history map、Hong Kong story map、香港 故事 地图、Hong Kong historical map stories、Hong Kong memory map、StoryMapJS、storytelling SKILL.md、creative writing skill。

## 可直接浏览的现成成果

| 成果 | 实际审读范围与发现 | 本项目的处理 |
| --- | --- | --- |
| [Urban Senses of Hong Kong](https://github.com/daisywuh/Urban-Senses-of-Hong-Kong) · [网站](https://daisywuh.github.io/Urban-Senses-of-Hong-Kong/) | 读 README、LICENSE、index/app 及 places.geojson。34点，主体为31首歌曲；另有红馆、菠萝包店、电视剧。仅12点介绍非空；年份主要为歌曲年份，无逐段历史来源。 | 直接保留入口，参考地图点、分类、阅读进度思路。没有复制歌词、照片或AI旧景。代码MIT，不能推定第三方媒体也属MIT。 |
| [Kai Tak Memory](https://github.com/Peippa/kaitak-memory) | 读 README、目录及 js/data.js。27地点、8时代，有旧地图、口述史和时间线；部分出处URL留空或指课堂材料。 | 直接链接这一现成地方传记；参考“地点＋时代＋原始材料”工作流。范围限启德及周边；README内容CC BY-NC 4.0，不搬课堂媒体。 |
| [Hong Kong Streets Timeline](https://github.com/cswbrian/street-naming-map) · [网站](https://cswbrian.github.io/street-naming-map/) | 读 README、research-street-history/SKILL.md。宪报→OCR→核实事件→连接街段→年代图，区分最早记载与正式命名。未发现明确根目录许可证。 | 参考史料工作流；未复制代码或数据。 |
| [香港纪事馆](https://hongkongstory.org/) · [深度专题](https://hongkongstory.org/dossiers) · [实体轴](https://hongkongstory.org/chronicle/entities) | 实读首页、专题及实体轴索引、疫症/航空专题、许可与条款。具有带页码的文献索引、时间线与缺口说明。已读入口主要是索引/卡片，未发现用户所需的自由地图探索界面。尚未找到公开源码。 | 作为已有深度阅读入口及史料线索，回到原文核对。不批量复制长文，不镜像数据库。结构化API的CC BY4.0不覆盖散文、翻译、图片；详见其[许可](https://hongkongstory.org/licence)与[条款](https://hongkongstory.org/terms)。 |
| [Knight Lab StoryMapJS](https://github.com/NUKnightLab/StoryMapJS) | 实读 README、LICENSE。结构化JSON支持地理叙事，MPL2.0。 | 借鉴叙事顺序；线性游历不能单独满足全港多维探索。未复制代码。 |
| [CDIL storymapjs-template](https://github.com/thecdil/storymapjs-template) | 实读 README、LICENSE及 docs/storymap.md。CSV/JSON、媒体与网页同仓，自托管。 | 采用内容/程序分离、静态可移植、GitHub可审阅的流程。模板MIT，依赖另计。 |

这些成果各有用途。本项目补上的是“有出处的中文地方故事＋自由地图＋时间/主题/地区交叉探索”，没有重建他人的资料馆或复制现成长文。

## 资料到故事的流程

1. 以能说明城市变化的地点选题，检查地理范围与时代缺口。
2. 实际阅读档案说明、官方年报、大学研究、博物馆和新闻原文。档案目录与研究指引只用于说明它确实支持的事项，不冒称已经读过其指向的所有原档。
3. 将事件日期、人物动作、地点迁移及统计口径拆开记录；不同来源不强拼成精确数字。
4. 阅读叙事写作技能后组织原创中文短篇；段落与时间节点均连接局部 sourceIds。
5. 检查今天的坐标是否对应旧址、遗存、纪念点或代表区域，分别标注。
6. 以程序检查引用完整性、时间区间、坐标、链接协议与数据可读性；人工检查叙事和争议表述。
7. 数据、正文、网页、纯文字版、打印记忆卡和验证脚本一并提交。

本项目的来源是可复核的证据入口，不表示资料没有立场。殖民政府年报、商号自述、机构纪念史与口述历史各有边界；故事内保留必要提示。政府材料不能代表所有居民的感受；商号宣称的“发明”不自动成为唯一历史结论。

## 具体查阅限制

沥源篇房委会《互信》（2013-01-11）网页后续读取超时，1975入伙及沙田首条公屋这一事实可见于该页搜索索引；另以完整阅读的土木工程拓展署与2015年口述访问支持故事。未声称读通整份原文。所有来源的支持范围写在故事末尾；链接未来可能改版或失效。
