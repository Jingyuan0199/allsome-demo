import {searchCopy} from './search-copy.js?v=55877283ecfa';

// Shared by the homepage and directories. No network or generated answers.
const aliases = [
 ['机器人助手','bots?','bot'],
 ['会议待办|会议行动(?:清单|项)?','meeting action (?:items?|list)|meeting to-?dos?','会议 行动项'],
 ['待办|行动清单|下一步','action items?|next steps?|to-?dos?','行动项'],
 ['会议','meetings?','会议'],['录音','recordings?|recorder','录音'],
 ['图片|图像','images?|pictures?','图片'],['尺寸|大小','dimensions?|sizes?','尺寸'],
 ['批量','bulk|batch','批量'],['压缩','compress(?:ion|ing|ed)?','压缩'],
 ['重复|反复','repetitive|repeated|repeat(?:ing)?','重复'],
 ['(?:token\\s*)?(?:余额|额度|配额)|剩余(?:额度|次数)','(?:token\\s+)?(?:balance|quotas?|credits?)','额度'],['账号|帐户|账户','accounts?','账号'],
 ['切换','switch(?:ing)?','切换'],['设计','design','设计'],
 ['代码','code','代码'],['文档','documents?','文档'],
 ['表格','spreadsheets?','表格'],['插件','extensions?','插件'],
 ['本地工具','local tools?','本地工具'],['客户端','desktop apps?','客户端'],
 ['创作者|作者','contributors?|creators?|authors?','创作者'],
 ['有趣|好玩','fun','生活趣味'],
].map(([zh,en,term])=>[new RegExp(`${zh}|\\b(?:${en})\\b`,'gi'),term]);
const formatPattern=/制作过程|制作分享|制作小记|制作|过程|教程|分享|文章|跟着做|how (?:it(?:’s|'s| is)|.*? is) made|how to|tutorials?|guides?|stories|story|build notes/gi;
const noise=new Set('any 做 做的 最好 还要 只想 已经 我已经 提取 有 没有 查 查看 查询 回顾 复盘 how check review revisit work available 我 我想 只要能 想 要 需要 找 查找 寻找 搜 搜索 搜搜 一个 一些 一款 一下 有没有 有什么 可以 能 能够 帮 帮我 帮助 用来 用 用的 的 地 得 了 吗 呢 请 只 只要 看 看看 怎么 如何 进行 处理 整理 减少 操作 工具 作品 创作者 完成 关于 相关 支持 it i me my want need find search a an the for to in on of with and can could help use using tool tools creation creations please show see cut process organize'.split(' '));
const segmenter=new Intl.Segmenter('zh',{granularity:'word'});
function normalize(value){let text=String(value??'').normalize('NFKC').toLowerCase();for(const [pattern,term] of aliases)text=text.replace(pattern,` ${term} `);return text.replace(/\s+/g,' ').trim();}
function terms(value){value=String(value).replace(/token\s*(?:余额|额度|配额)/gi,'额度').replace(/有没有|有什么|有无|是否有/g,' ');return [...new Set([...segmenter.segment(normalize(value))].filter(part=>part.isWordLike).map(part=>part.segment).filter(word=>!noise.has(word)))];}
export function parseSearch(query='') {
 const original=String(query??'').trim();
 const excluded=[];
 const positive=original.replace(/(?:不要|不需要|不想要)(?!联网)([^，,。；;]+)/g,(_,value)=>{excluded.push(...terms(value));return ' ';}).replace(/\b(?:without|exclude)\s+(?!internet|network)([^,;.]+)/gi,(_,value)=>{excluded.push(...terms(value));return ' ';});
 const storyIntent=new RegExp(formatPattern.source,'i').test(positive);
 const offline=/离线|无需联网|不联网|不(?:需要|用|要)联网|offline|without (?:internet|network)/i.test(positive);
 const subject=positive.replace(formatPattern,' ').replace(/离线(?:使用|用)?|无需联网|不联网|不(?:需要|用|要)联网|offline|without (?:internet|network)/gi,' ');
 return {query:original,terms:terms(subject),storyIntent,offline,excluded};
}
export function scoreSearch(item,kind,query) {
 const parsed=typeof query==='string'?parseSearch(query):query;
 if((kind==='work'?item.publicationStatus:item.status)!=='published')return 0;
 if(!parsed.query)return 1;
 if(parsed.offline&&(kind!=='work'||!(item.offline===true||/^(?:完全离线|无需联网|不需要联网|works offline)/i.test(item.network||''))))return 0;
 const en=searchCopy(item,kind,'en');
 const title=normalize([item.name,item.title,en.title].filter(Boolean).join(' '));
 const body=normalize([item.lead,item.summary,item.scene,item.category,item.label,item.type,item.owner,item.author|| (kind==='story'?'Lin An':''),item.project,...(item.uses||[]),en.description].filter(Boolean).join(' '));
 if(!parsed.terms.length)return !parsed.query||parsed.offline||(parsed.storyIntent&&kind==='story')?1:0;
 if(parsed.excluded?.some(term=>title.includes(term)||body.includes(term)))return 0;
 // Every meaningful task term must be grounded in this item's metadata.
 if(!parsed.terms.every(term=>title.includes(term)||body.includes(term)))return 0;
 let score=parsed.terms.reduce((sum,term)=>sum+(title.includes(term)?8:3),0);
 if(title.includes(normalize(parsed.query)))score+=30;
 if(parsed.storyIntent&&kind==='story')score+=4;
 return score;
}
export function rankSearch(items,kind,query=''){
 const parsed=parseSearch(query);
 return items.map((item,index)=>({item,index,score:scoreSearch(item,kind,parsed)})).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
}
export function findContent(query,{works=[],stories=[]}={}){
 const parsed=parseSearch(query);
 const workRows=parsed.storyIntent?[]:rankSearch(works,'work',query);
 const storyRows=rankSearch(stories,'story',query);
 const rows=[...workRows.map(row=>({...row,kind:'work'})),...storyRows.map(row=>({...row,kind:'story'}))].sort((a,b)=>a.kind===b.kind?b.score-a.score||a.index-b.index:a.kind==='work'?-1:1);
 const seen=new Set();
 const preview=rows.filter(({item,kind})=>{const key=kind+':'+(item.name||item.title).split(' · ')[0];if(seen.has(key))return false;seen.add(key);return true;}).slice(0,3);
 return {preview,workCount:workRows.length,storyCount:storyRows.length,total:rows.length,parsed};
}
export function findRelatedProblem(query,problems=[]){
 // Only the curated public list is passed here, never browser-local drafts.
 const candidates=problems.filter(p=>!p.localOnly&&['looking','matched','discussing','building','solved'].includes(p.status)).map(problem=>{
  const en=searchCopy(problem,'problem','en');
  return {id:problem.id,name:problem.title,lead:problem.summary,uses:[problem.context,en.title,en.description],publicationStatus:'published',problem};
 });
 return rankSearch(candidates,'work',query)[0]?.item.problem||null;
}

export function rankCreators(makers,works,query=''){
 const raw=String(query).trim();
 const exact=makers.find(m=>m.name.toLowerCase()===raw.toLowerCase());
 const parsed=parseSearch(raw.replace(/创作者|作者|\b(?:contributors?|creators?|makers?|authors?)\b/gi,''));
 return makers.map((item,index)=>{
  const owned=works.filter(w=>w.publicationStatus==='published'&&w.creatorId===item.id);
  const profile=normalize([item.name,item.bio,item.department].join(' '));
  const searchable={name:item.name,lead:[item.bio,item.department].join(' '),uses:owned.flatMap(w=>[w.name,w.lead,w.scene,searchCopy(w,'work','en').title,searchCopy(w,'work','en').description]),publicationStatus:'published'};
  const score=exact?(item.id===exact.id?100:0):!parsed.terms.length&&!parsed.offline?1:scoreSearch(searchable,'work',parsed);
  return {item,index,score:score+(score>0&&parsed.terms.length&&parsed.terms.every(t=>profile.includes(t))?30:0),count:owned.length};
 }).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||b.count-a.count||a.index-b.index);
}
