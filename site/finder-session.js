import {parseSearch} from './search.js?v=55877283ecfa';
export const emptySession=()=>({parts:[],excluded:[],turns:[]});
export const sessionQuery=s=>[...s.parts,...s.excluded.map(term=>'不要'+term)].join('，');
const unique=values=>[...new Set(values.filter(Boolean))];
export function advanceSession(state,message,mode='auto'){
 const raw=String(message).trim().slice(0,300);if(!raw)return {state};
 const next={parts:[...state.parts],excluded:[...state.excluded],turns:[...state.turns,raw]};
 const fresh=/^(?:换个问题|重新找|换成|算了[，, ]*找|new topic|start over|instead find)[:：，,\s]*/i;
 if(!state.parts.length||mode==='new'||fresh.test(raw))return {state:{parts:[raw.replace(fresh,'')||raw],excluded:[],turns:next.turns}};
 const correction=raw.match(/^(?:不对[，,\s]*)?(?:不是|不要)\s*(.+?)[，,；;]\s*(?:而?是|改成|我要|我想要)\s*(.+)$/)||raw.match(/^not\s+(.+?)[,;]\s*(?:but|instead|i want)\s+(.+)$/i);
 if(correction){
  const [,removed,replacement]=correction;
  next.parts=next.parts.map(part=>part.split(removed.trim()).join(' ').trim()).filter(Boolean);
  next.parts=unique([...next.parts,replacement.trim()]);next.excluded=unique([...next.excluded,removed.trim()]);
  return {state:next};
 }
 if(/^(不对|不是这个|不是这些|没找到|不合适|wrong|not (?:this|these)|not a fit)[。.!！]?$/i.test(raw))return {state,pending:{message:raw,type:'clarify'}};
 if(mode==='auto'&&/^(?:不对|不是|not\s)/i.test(raw))return {state,pending:{message:raw,type:'clarify'}};
 const supplement=/^(?:最好|还要|只要|另外|而且|希望|补充|需要|支持|不要|不需要|不想要|prefer|also|only|without|must|i also)|离线|offline/i.test(raw);
 const previous=parseSearch(sessionQuery(state)).terms, incoming=parseSearch(raw).terms;
 if(mode==='add'||supplement||incoming.some(term=>previous.includes(term))){next.parts=unique([...next.parts,raw]);return {state:next};}
 // A self-contained new subject starts a new search; no internal mode picker.
 if(incoming.length||parseSearch(raw).storyIntent)return {state:{parts:[raw],excluded:[],turns:next.turns}};
 return {state,pending:{message:raw,type:'clarify'}};
}
