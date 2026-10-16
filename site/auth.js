const key='allsome-portfolio-items-v1',starsKey='allsome-portfolio-stars-v1';
export let account={user:{id:'visitor',name:'体验访客',email:'',picture:''},configured:false};
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
export async function refreshAccount(){dispatchEvent(new Event("accountchange"));return account;}
export async function mountGoogle(){}
export async function signOut(){location.hash='#top';}
export async function getMyWorks(){return read(key,[]);}
export async function saveWork(fields){const item={...fields,id:crypto.randomUUID(),status:'local',createdAt:new Date().toISOString()};const items=read(key,[]);localStorage.setItem(key,JSON.stringify([item,...items]));return item;}
export async function saveStory(fields){return saveWork({...fields,kind:'story'});}
export async function getStars(){const starred=read(starsKey,[]);return {starred,counts:Object.fromEntries(starred.map(id=>[id,1]))};}
export async function setStar(id,on){const set=new Set(read(starsKey,[]));on?set.add(id):set.delete(id);localStorage.setItem(starsKey,JSON.stringify([...set]));return getStars();}
