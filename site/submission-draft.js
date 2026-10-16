const memory=new Map();
const key=kind=>`allsome-portfolio-submission-${kind}-v1`;
export function readDraft(kind){if(memory.has(kind))return {...memory.get(kind)};try{const data=JSON.parse(localStorage.getItem(key(kind))||'null');if(data&&typeof data==='object'&&!Array.isArray(data))return data;}catch{}return memory.get(kind)||{};}
export function writeDraft(kind,values){memory.set(kind,{...values});try{localStorage.setItem(key(kind),JSON.stringify(values));return true;}catch{return false;}}
export function clearDraft(kind){memory.delete(kind);try{localStorage.removeItem(key(kind));}catch{}}
