import {rankSearch,rankCreators} from './search.js?v=55877283ecfa';
import {STORIES} from './stories.js?v=55877283ecfa';
import { PRODUCTS } from './catalog-data.js?v=55877283ecfa';
import {CREATOR_PICTURES} from './creator-assets.js?v=55877283ecfa';

export const TYPE_LABELS={all:'全部',web:'小产品',bot:'Bot',extension:'插件',skill:'Skill',desktop:'客户端',local:'本地工具',other:'好玩'};
const actualCreators=[
 {id:'chen-yu',name:'Chen Yu',bio:'把复杂的账号和模型配置，收进一个工作台。',tone:'blue',picture:CREATOR_PICTURES['chen-yu']},
 {id:'lin-an',name:'Lin An',bio:'把设计经验，做成工具。',tone:'rust',picture:CREATOR_PICTURES['lin-an']},
 {id:'mu-yan',name:'Mu Yan',bio:'给工作流，省一点麻烦。',tone:'blue',picture:CREATOR_PICTURES['mu-yan']},
 {id:'su-he',name:'Su He',bio:'从日常里，捡一点灵感。',tone:'sage',picture:CREATOR_PICTURES['su-he']},
];
const names=['An Ran','He Jia','Lin Yi','Shu Tong','Ke Xin','Chen Mo','Zhao Xia','Su Man','Yue Shan','Jiang Chuan','Nan Xing','Mu Qing','Zhou Qing','Bei An','Yu An','Qin He','Lu Xiao','Xu Yuan','Song Yuan','Mu Yan'];
const bios=['把重复交给工具。','小想法，也认真做。','写代码，也收集生活。','工作之外，还有好奇心。','让信息变得好理解。','喜欢做一点有趣的实验。'];
const sampleNames=names.slice(0,20);
export const MAKERS=[...actualCreators.map(m=>({...m,department:'创作社区'})),...sampleNames.map((name,i)=>({id:`sample-maker-${i+1}`,name,department:'创作社区',bio:bios[i%bios.length],tone:['blue','sage','yellow','rust'][i%4],picture:CREATOR_PICTURES[`sample-maker-${i+1}`],sample:true}))];
export const makerName=maker=>maker.name;
const topics=[
 ['网页配色提取','extension','设计创作','从网页中收集一组配色，留给下一次设计。'],
 ['接口请求便签','local','开发效率','把常用请求收在一起，调试时少翻几页文档。'],
 ['会议行动清单','skill','日常协作','从讨论里找到下一步，整理成清楚的行动项。'],
 ['午饭吃什么','web','生活趣味','收集午餐备选，让每天的选择轻松一点。'],
 ['设计交付检查','skill','设计创作','交付前检查遗漏的状态、文案与适配。'],
 ['JSON 小工坊','local','开发效率','格式化、比较和整理零散的 JSON 数据。'],
 ['周报素材盒','bot','日常协作','收好这一周的进展，写周报时不再四处翻找。'],
 ['散步路线卡','web','生活趣味','把附近走过的路线记成可分享的小卡片。'],
 ['图片尺寸管家','desktop','设计创作','批量查看图片尺寸，为素材整理节省时间。'],
 ['代码阅读伙伴','skill','Agent 工作流','沿着关键调用理解一个陌生项目。'],
 ['文档目录助手','extension','知识整理','为长文档生成清楚的导航，快速找到重点。'],
 ['专注小电台','web','生活趣味','搭配背景声音，给自己一段专注时间。'],
 ['图标关键词卡','web','设计创作','换一种关键词描述，找到更贴切的图标。'],
 ['终端片段收藏','local','开发效率','给常用命令加上说明，随时检索和复用。'],
 ['数据解释便签','skill','Agent 工作流','把表格里的变化写成容易读懂的解释。'],
 ['读书摘录盒','web','知识整理','保存触动你的段落，按主题慢慢整理。'],
 ['无障碍检查卡','extension','设计创作','检查对比度与键盘路径，发现容易忽略的细节。'],
 ['日志线索助手','bot','开发效率','从长日志中定位异常前后的关键线索。'],
 ['团队词语本','web','日常协作','给缩写和团队术语留下共同的解释。'],
 ['桌面植物日记','other','生活趣味','记录植物的新叶子，也提醒自己停下来看看。'],
 ['Prompt 整理架','web','Agent 工作流','给常用指令加上用途说明和使用例子。'],
 ['网页阅读书签','extension','知识整理','把稍后想读的内容按主题放好。'],
 ['时区碰头助手','web','日常协作','把几个城市的时间放在一起，方便约时间。'],
 ['照片故事卡','other','生活趣味','为喜欢的一张照片写一段短短的故事。'],
 ['组件状态清单','skill','设计创作','从使用场景梳理组件需要覆盖的状态。'],
 ['提交说明助手','skill','开发效率','把改动整理成方便同事阅读的提交说明。'],
 ['待办小纸条','desktop','日常协作','让今天最重要的几件事留在手边。'],
 ['播客片段笔记','local','知识整理','记住值得回听的时间点和当时的想法。'],
 ['灵感连连看','other','生活趣味','把不相干的两个词连起来，试着想一个新点子。'],
 ['表格清理助手','skill','Agent 工作流','整理重复、空白和格式不一致的数据。'],
 ['截图标注盒','desktop','日常协作','在截图上说清楚重点，再交给同事。'],
 ['阅读进度条','extension','知识整理','记录读到哪里，让长文章可以分几次读完。'],
 ['小票收纳簿','local','生活趣味','按日期收好小票与备注，需要时方便查找。'],
 ['发布前检查单','skill','开发效率','把上线前反复确认的项目收成检查清单。'],
 ['访谈摘录助手','bot','设计创作','按主题整理访谈片段，保留原话的上下文。'],
 ['个人知识索引','web','知识整理','连接笔记和文档，为自己的资料建一份索引。'],
 ['测试样例盒','local','开发效率','把常用测试输入和期望结果成组保存。'],
 ['读稿计时器','web','日常协作','演示前读一遍，知道内容大约需要多久。'],
 ['色彩情绪日历','other','生活趣味','每天用一种颜色记下心情。'],
];
const trustById=Object.fromEntries(PRODUCTS.map(p=>[p.id,{publicationStatus:'published',availability:'交互示例',source:'作品集示例内容',access:'无需登录即可浏览',setup:'使用现代浏览器查看',network:'无需连接外部服务',dataHandling:'体验记录只保存在当前浏览器',maintenanceStatus:'交互原型',lastConfirmed:'2026 年 10 月',officialRelation:'用于说明产品设计，不代表真实服务'}]));
const base=PRODUCTS.map((p,i)=>({...p,...trustById[p.id],creatorId:actualCreators.find(m=>m.name===p.owner).id,scene:p.category||'日常协作',tone:p.tone,sample:false,rank:i,createdAt:p.createdAt||`2026-09-${String(11-i).padStart(2,'0')}`,cover:p.cover}));
const variants=['',' · 轻量版',' · 团队版',' · 随手版',' · 实验版'];
export const WORKS=[...base,...Array.from({length:18},(_,i)=>{
 const [name,type,scene,lead]=topics[i%topics.length],maker=MAKERS[actualCreators.length+i%sampleNames.length];
 return {id:`sample-work-${i+1}`,name:name+variants[Math.floor(i/topics.length)],type,label:TYPE_LABELS[type],category:scene,scene,creatorId:maker.id,owner:maker.name,lead,
  description:lead,audience:`经常遇到“${scene}”相关小麻烦，希望少做一点重复工作的同事。`,uses:[lead,'按作品说明开始使用，需要时可以联系创作者。'],note:'先阅读作品说明，再按创作者提供的方式开始使用。',sample:true,tone:maker.tone,rank:i+5,createdAt:new Date(Date.UTC(2026,8,10)-i*86400000).toISOString().slice(0,10),
  publicationStatus:'published',availability:'联系创作者使用',source:`${maker.name} 维护的${TYPE_LABELS[type]}`,access:'通过创作者提供的入口使用',setup:'按作品说明完成必要的安装或配置',network:'按作品说明和现有工作环境访问',dataHandling:'只提交有权处理的内容，并遵循作品说明中的数据边界',maintenanceStatus:'持续维护',lastConfirmed:'2026 年 9 月',officialRelation:'个人创作，不代表官方产品能力'};
})];
export const SCENES=[...new Set(WORKS.map(w=>w.scene))];
export const isPublicWork=work=>work?.publicationStatus==='published';
export function queryWorks({q='',type='all',scene='all',owner='',sort='recommended',page=1,pageSize=24,realOnly=false}={},works=WORKS){
 const ranked=rankSearch(works,'work',q);
 const scores=new Map(ranked.map(row=>[row.item.id,row.score]));
 const filtered=ranked.map(row=>row.item).filter(w=>(!realOnly||!w.sample)&&(type==='all'||w.type===type)&&(scene==='all'||w.scene===scene)&&(!owner||w.creatorId===owner));
 filtered.sort(sort==='newest'?(a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id):(a,b)=>(q?scores.get(b.id)-scores.get(a.id):0)||a.rank-b.rank);
 const size=Math.max(1,Math.min(48,Math.floor(Number(pageSize))||24));
 const pages=Math.max(1,Math.ceil(filtered.length/size)),current=Math.min(pages,Math.max(1,Math.floor(Number(page))||1));
 return {items:filtered.slice((current-1)*size,current*size),total:filtered.length,page:current,pages,pageSize:size};
}
export function makerWorks(id,realOnly=false){return WORKS.filter(w=>isPublicWork(w)&&w.creatorId===id&&(!realOnly||!w.sample));}
export function makerStats(id,counts={}){
 const works=makerWorks(id);
 return {count:works.length,likes:STORIES.filter(s=>s.authorId===id).reduce((sum,s)=>sum+(counts?.[`story:${s.id}`]||0),0)+works.reduce((sum,w)=>sum+(Number.isSafeInteger(counts?.[w.id])&&counts[w.id]>0?counts[w.id]:0),0)};
}
export function queryMakers({q='',sort='likes',page=1,pageSize=12,realOnly=false,counts={}}={}){
 const term=String(q??'').trim().toLocaleLowerCase();
 const matching=new Set(rankCreators(MAKERS,WORKS,term).map(row=>row.item.id));
 const items=MAKERS.map((m,order)=>({...m,order,...makerStats(m.id,counts)})).filter(m=>(!realOnly||!m.sample)&&matching.has(m.id));
 items.sort(sort==='works'?(a,b)=>b.count-a.count||b.likes-a.likes||a.order-b.order:(a,b)=>b.likes-a.likes||a.order-b.order);
 const size=Math.max(1,Math.min(48,Math.floor(Number(pageSize))||12));
 const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(pages,Math.max(1,Math.floor(Number(page))||1));
 return {items:items.slice((current-1)*size,current*size),total:items.length,page:current,pages};
}
