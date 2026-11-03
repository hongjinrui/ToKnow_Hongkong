# 来源、复用与权利

## 应用和原创内容

应用代码：MIT，见根目录 LICENSE。原创中文叙事与项目文档：CC BY 4.0，署名“Hong Kong Story Atlas / 香港故事地图”并链接本仓库。引用只是证据入口，不重新授权原网站正文、照片或档案影像。

## 离线地理轮廓

data/coast.js 为 OpenStreetMap 衍生的概化地理轮廓，取得自 [bmkor/hk_osm_map / Hong_Kong.geojson](https://github.com/bmkor/hk_osm_map/blob/e1396a0befe7331371f7288ef59abde3731834c4/Hong_Kong.geojson)。

上游文件加入日期2017-07-29；原文件blob为33c32099a4c2053f4f0556c1b75cbf9647ffae1a。包含429个多边形。我们对环使用约0.00013度阈值的线段简化，并将坐标保留到6位小数，未以此推断新的法律边界。它是2017资料快照，**不是1841、1941或今日的精确岸线**，不表现各年代填海变化。北部行政边界及微小岛礁均不作测绘用途。

© OpenStreetMap contributors. 数据按 [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 使用；[OSM版权与署名](https://www.openstreetmap.org/copyright)。这份已修改的轮廓数据库继续依ODbL提供。上游代码仓库另含以下MIT许可：

MIT License

Copyright (c) 2017 Benjamin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 可选街道底图

若开启联网街道底图，使用 Leaflet 1.9.4 与 OpenStreetMap 标准瓦片。Leaflet BSD-2-Clause，©2010–2023 Vladimir Agafonkin, ©2010–2011 CloudMade，详见[上游许可](https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE)。联网加载有外部网络依赖；离线轮廓、故事、筛选和记忆卡可独立使用。网页不批量预取地图瓦片。

## 借鉴而未复制的成果

研究和写作方法详见 RESEARCH.md 与 EDITORIAL.md。没有搬运Urban Senses的歌词、AI旧景、照片，没有复制Kai Tak课堂媒体，没有镜像香港纪事馆正文；也没有把这些内容纳入本项目的开放许可。
