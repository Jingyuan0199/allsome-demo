const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function detailText(value){
 const lines=String(value||'').split(/\r?\n/);let out='',paragraph=[],list='',items=[];
 const flush=()=>{if(paragraph.length){out+=`<p>${paragraph.map(esc).join('<br>')}</p>`;paragraph=[];}if(items.length){out+=`<${list}>${items.map(s=>`<li>${esc(s)}</li>`).join('')}</${list}>`;items=[];}};
 for(const line of lines){const heading=line.match(/^#{1,3}\s+(.+)/),bullet=line.match(/^\s*(?:[-*]\s+|\d+[.、]\s*)(.+)/);if(!line.trim()){flush();continue;}if(heading){flush();out+=`<h2>${esc(heading[1])}</h2>`;}else if(bullet){const next=/^\s*\d/.test(line)?'ol':'ul';if(paragraph.length||list!==next)flush();list=next;items.push(bullet[1]);}else{if(items.length)flush();paragraph.push(line);}}flush();return out;
}
export function workDetailTemplate({top='',heading='',main='',sidebar='',bottom=''}){return `<article class="work-page">${top}${heading}<div class="work-layout${sidebar?'':' work-layout-solo'}"><div class="work-main">${main}</div>${sidebar?`<aside class="work-sidebar">${sidebar}</aside>`:''}</div>${bottom}</article>`;}
