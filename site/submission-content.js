// Convert earlier structured drafts into one editable, authoritative introduction.
const sections={scene:['适用场景','Use case'],platform:['适用平台','Platforms'],access:['访问条件','Access'],instructions:['开始使用','Getting started'],setup:['安装与权限','Installation'],network:['联网要求','Network'],dataHandling:['数据处理','Data handling'],maintainer:['维护人','Maintainer'],maintenanceStatus:['维护情况','Maintenance']};
export function consolidateWorkDraft(draft,language='zh'){
 if(draft.kind&&draft.kind!=='work')return {...draft};
 const result={...draft};let details=String(draft.details||'');
 for(const [key,labels]of Object.entries(sections)){const value=String(draft[key]||'').trim();if(value&&!details.includes(value))details+=(details?'\n\n':'')+labels[language==='en'?1:0]+'\n'+value;result[key]='';}
 result.details=details;return result;
}
