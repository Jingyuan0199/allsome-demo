// Each record owns its cover. Association never changes cover resolution.
export function coverDecision({kind,id,uploaded=null,currentCover=null}={}){
 if(!['work','story'].includes(kind)||!id)throw new TypeError('Cover requires kind and record id');
 if(uploaded)return {state:'ready',url:uploaded};
 if(currentCover)return {state:'ready',url:currentCover};
 return {state:'needs-generation',key:`${kind}:${id}`,skill:kind==='work'?'allsome-work-cover':'allsome-cover'};
}
