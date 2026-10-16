import {searchCopy} from './search-copy.js?v=55877283ecfa';
const types={web:['小产品','Web app'],bot:['Bot','Bot'],extension:['浏览器插件','Browser extension'],skill:['Skill','Skill'],desktop:['客户端','Desktop app'],local:['本地工具','Local tool'],other:['好玩','For fun']};
const accessEnglish={
 'quota-note':'Download the matching Mac installer from GitLab Releases.',
 'quota-card':'Contact Su He for the compatible version.',
};
export function cardDetails(item,kind,query,{works=[],makers=[],language='zh'}={}){
 const en=language==='en',t=(zh,english)=>en?english:zh;
 const fields=[];
 if(kind==='work'){
  const owner=makers.find(m=>m.id===item.creatorId);
  if(item.access)fields.push([t('获取方式','Access'),en?(accessEnglish[item.id]||(/^联系/.test(item.access)?'Contact the creator for access.':'See the access requirements in the creation details.')):item.access]);
  if(owner||item.owner)fields.push([t('创作者','By'),owner?.name||item.owner]);
  return {badge:(types[item.type]||[item.label||'作品','Creation'])[en?1:0],fields};
 }
 if(kind==='story'){
  const formats={guide:['跟着做','Guide'],note:['制作小记','Build note'],demo:['过程演示','Walkthrough']};
  const format=(formats[item.type]||['分享','Story'])[en?1:0];
  fields.push([t('内容形式','Format'),format+(item.minutes?t(` · 约 ${item.minutes} 分钟`,` · ${item.minutes} min read`):'')]);
  const related=works.filter(w=>w.publicationStatus==='published'&&item.workIds?.includes(w.id));
  if(related.length)fields.push([t('关联作品','Related creation'),related.map(w=>searchCopy(w,'work',language).title).join(' / ')]);
  const author=makers.find(m=>m.id===item.authorId)?.name||item.author;if(author)fields.push([t('作者','By'),author]);
  return {badge:t('分享','Story'),fields};
 }
 const owned=works.filter(w=>w.publicationStatus==='published'&&w.creatorId===item.id);
 if(!en&&item.bio)fields.push(['创作方向',item.bio]);
 if(owned.length)fields.push([t('代表作','Creations'),owned.slice(0,2).map(w=>searchCopy(w,'work',language).title).join(' / ')]);
 return {badge:t('创作者','Contributor'),fields};
}

export function cardThumbnail(item,kind){
 if(kind==='maker')return item.picture||'';
 if(kind==='work')return item.id==='quota-note'?'assets/works/quota-note-dashboard.png':'';
 if(kind==='story'){
  if(item.extra)return 'assets/stories/'+(item.type==='demo'?'home.png':'sketch-redrawn-v1.png');
  if(item.cover==='credits')return 'assets/stories/quota-note-cover-v1.png';
  if(['clone','quota'].includes(item.cover))return `assets/stories/${item.cover}-cover-v1-thumb.webp`;
  return 'assets/stories/home.webp';
 }
 return '';
}
