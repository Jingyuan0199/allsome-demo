export const PREFILL_FIELDS=['scene','details','usageLink','platform','access','setup','network','dataHandling','maintainer','maintenanceStatus','title','description','type','link','sourceLink','docsLink','instructions','body','workId','context','currentApproach','desiredOutcome','cover','coverStyle'];
export function planPrefill(current,incoming,defaults={}){
 const fill={},conflicts=[];
 for(const key of PREFILL_FIELDS){const value=incoming[key];if(typeof value!=='string'||!value.trim()||value===current[key])continue;
 if(!String(current[key]||'').trim()||current[key]===defaults[key])fill[key]=value;else conflicts.push({key,before:current[key],after:value});}
 return {fill,conflicts};
}
export function undoPrefill(current,change){const patch={};for(const key of Object.keys(change.after))if(JSON.stringify(current[key])===JSON.stringify(change.after[key]))patch[key]=change.before[key]??'';return patch;}
