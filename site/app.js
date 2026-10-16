import {workDetailTemplate,detailText} from './detail-template.js?v=55877283ecfa';
import {renderListingCard} from './listing-card.js?v=55877283ecfa';
import {mountSubmission} from './submission.js?v=55877283ecfa';
import {creationLinks,safeSource} from './creation-intake.js?v=55877283ecfa';
import {pageHeading} from './page-heading.js?v=55877283ecfa';
import {STORIES, STORY_TYPES, storiesByAuthor, storiesByWork, queryStories, storyCard, articleMarkup} from './stories.js?v=55877283ecfa';
let setScrollProgress=()=>{};
import('./scene.js').then(scene=>{setScrollProgress=scene.setScrollProgress;requestScroll();}).catch(error=>console.warn('Scene unavailable; content remains usable.',error));
import { clamp, scrollFrame, foregroundFrame } from './home-state.js?v=55877283ecfa';
import { WORKS, MAKERS, TYPE_LABELS, SCENES, queryWorks, queryMakers, makerWorks, makerName, makerStats, isPublicWork } from './discovery.js?v=55877283ecfa';
import { PROBLEM_STATUSES, getProblem, saveProblemDraft } from './problems.js?v=55877283ecfa';
import { displayStarCounts, previewStarCounts } from './preview-data.js?v=55877283ecfa';
import { consultation } from './catalog-data.js?v=55877283ecfa';
import { account, refreshAccount, mountGoogle, signOut, saveWork, saveStory, getMyWorks, getStars, setStar } from './auth.js?v=55877283ecfa';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hero=$('.hero-track'),heroStage=$('.hero-stage'),scene=$('#scene-scroll'),heroCopy=$('.hero-copy');
const login=$('#login-dialog'),directory=$('#directory-view');
let reduced=document.documentElement.dataset.reduced==='true',scrollRAF=0,realOnly=false,homeType='all',homeStoryType='all',current=null,route={},pendingShare=false,searchTimer,toastTimer;
let renderedProfile='';
let starCounts=null,starred=new Set(),starGeneration=0,starLoading=true,homeMakerSort='works',pendingStar=null,starWrites=Promise.resolve();
const starBusy=new Set();
let myGeneration=0;
const openers=new WeakMap();
const avatar=(m,size='')=>`<span class="person-avatar tone-${esc(m.tone||'blue')} ${size}">${m.picture?`<img src="${esc(m.picture)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:`<span aria-hidden="true">${esc(m.name?.trim().slice(0,1)||'·')}</span>`}</span>`;
const decodePath=value=>{try{return decodeURIComponent(value);}catch{return '';}};
const makerLink=id=>`#maker/${encodeURIComponent(id)}`;
const sampleBadge=()=>'';
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('is-visible'),3500);}
const appreciationItems=[...WORKS.filter(isPublicWork),...STORIES.map(s=>({id:`story:${s.id}`,name:s.title}))];
const appreciationIds=appreciationItems.map(item=>item.id);
const starIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.9 6 6.7 1-4.9 4.7 1.2 6.7-5.9-3.1-6 3.1 1.2-6.7-4.8-4.7 6.7-1Z"/></svg>';
function starButton(item){
 const selected=starred.has(item.id),count=starCounts?.[item.id];
 return `<button class="star-button" type="button" data-star="${esc(item.id)}" aria-pressed="${selected}" aria-label="${selected?'取消对':'点赞'}《${esc(item.name)}》${selected?'的点赞':''}" title="${account.user?(selected?'取消点赞':'喜欢，就点个赞'):'登录后点赞'}" ${starBusy.has(item.id)?'disabled aria-busy="true"':''}>${starIcon}<span data-star-count>${count??'—'}</span></button>`;
}
function makerMetrics(m){const stats=makerStats(m.id,starCounts);return `<span class="maker-metrics" data-maker-metrics="${esc(m.id)}"><span><b>${stats.count}</b> 件作品</span><span><b>${storiesByAuthor(m.id).length}</b> 篇分享</span><span>${starIcon}<b>${starCounts?stats.likes:'—'}</b> 获赞</span></span>`;}
function refreshStarUI(){
 for(const button of $$('[data-star]')){
  const id=button.dataset.star,item=appreciationItems.find(w=>w.id===id),selected=starred.has(id);
  button.setAttribute('aria-pressed',String(selected));button.disabled=starBusy.has(id);button.setAttribute('aria-busy',String(starBusy.has(id)));
  button.setAttribute('aria-label',`${selected?'取消对':'点赞'}《${item.name}》${selected?'的点赞':''}`);
  button.title=account.user?(selected?'取消点赞':'喜欢，就点个赞'):'登录后点赞';button.querySelector('[data-star-count]').textContent=starCounts?.[id]??'—';
 }
 for(const status of $$('[data-stars-status]'))status.innerHTML=starLoading?'正在读取获赞…':starCounts?'':'获赞暂时无法加载 <button type="button" data-retry-stars>重试</button>';
 for(const metric of $$('[data-maker-metrics]')){const stats=makerStats(metric.dataset.makerMetrics,starCounts);const numbers=metric.querySelectorAll('b');numbers[0].textContent=stats.count;numbers[2].textContent=starCounts?stats.likes:'—';}
}
function acceptStars(data){starCounts=displayStarCounts(data.counts,appreciationIds);starred=new Set(data.starred);starLoading=false;renderHomeMakers();if(route.path==='makers')renderMakerResults();refreshStarUI();}
async function refreshStars(){
 const generation=++starGeneration;starLoading=true;refreshStarUI();
 try{const data=await getStars();if(generation!==starGeneration)return false;acceptStars(data);return true;}
 catch{if(generation===starGeneration){starLoading=false;starCounts=previewStarCounts(appreciationIds);starred.clear();renderHomeMakers();if(route.path==='makers')renderMakerResults();refreshStarUI();}return false;}
}
async function changeStar(id,desired){
 if(starBusy.has(id)||!appreciationItems.some(w=>w.id===id))return;
 if(!account.user){pendingStar={id};openLogin($(`[data-star="${id}"]`));return;}
 if(!starCounts&&!await refreshStars()){toast('暂时无法读取点赞状态，请稍后再试。');return;}
 const userId=account.user?.id;if(!userId)return;
 const next=desired??!starred.has(id);starBusy.add(id);++starGeneration;starLoading=false;refreshStarUI();
 try{
  const operation=starWrites.then(()=>{if(account.user?.id!==userId)throw new Error('账号已变化，请重新点赞。');return setStar(id,next);});starWrites=operation.catch(()=>{});
  const data=await operation;if(account.user?.id===userId){++starGeneration;acceptStars(data);toast(next?'已点赞，谢谢你的喜欢。':'已取消点赞。');}
 }
 catch(error){toast(error.message);}
 finally{starBusy.delete(id);refreshStarUI();}
}
function cover(item){
 const template=item.cover&&$('#cover-'+item.cover);if(template)return template.innerHTML;
 const symbol={web:'www.',bot:'Hi!',skill:'{ }',extension:'＋',desktop:'⌘',local:'~/ ',other:'☺'}[item.type]||'·';
 return `<div class="cover cover-simple tone-${esc(item.tone)}" aria-hidden="true"><span class="cover-corner">${esc(TYPE_LABELS[item.type])} / ${esc(item.scene)}</span><span class="simple-symbol">${esc(symbol)}</span><span class="cover-foot">${esc(item.name.split(' · ')[0])}</span></div>`;
}
function productCard(item){
 const maker=MAKERS.find(m=>m.id===item.creatorId)||{name:item.owner,tone:item.tone};
 return renderListingCard({id:item.id,name:item.name.replace('Lin An｜',''),lead:item.lead,label:item.label,scene:item.scene,coverHtml:cover(item),badgeHtml:sampleBadge(item.sample),href:'#work/'+encodeURIComponent(item.id),footerHtml:`<a class="byline" href="${makerLink(item.creatorId)}">${avatar(maker,'avatar-small')}<span>${esc(item.owner)}</span></a>${starButton(item)}`});
}
function makerCard(m,large=false){return `<a class="${large?'maker-tile':'creator-card'}" href="${makerLink(m.id)}" aria-label="查看 ${esc(makerName(m))} 的全部作品">${avatar(m)}<div class="creator-info"><strong>${esc(makerName(m))}</strong>${m.sample?sampleBadge(true):''}<span class="maker-department">${esc(m.department||'部门待补充')}</span>${makerMetrics(m)}</div></a>`;}
function renderHomeMakers(){
 const makers=queryMakers({sort:homeMakerSort,realOnly,pageSize:12,counts:starCounts}).items;
 $('#home-makers').innerHTML=makers.map(m=>makerCard(m)).join('');
 $$('#home-maker-sort [data-maker-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.makerSort===homeMakerSort)));updateCarousel();
}
function typeButtons(selected,counts=false){return Object.entries(TYPE_LABELS).map(([key,label])=>`<button type="button" data-type="${key}" aria-pressed="${selected===key}">${label}${counts?` <span class="filter-count">${queryWorks({realOnly,type:key,pageSize:1}).total}</span>`:''}</button>`).join('');}
function renderHome(){
 renderHomeStories();
 renderHomeMakers();
 $('#home-filters').innerHTML=typeButtons(homeType,true);
 const result=queryWorks({realOnly,type:homeType,pageSize:12});$('#product-grid').innerHTML=result.items.map(productCard).join('');$('#home-empty').hidden=result.total>0;
 updateCarousel();refreshStarUI();
}
function updateCarousel(){const row=$('#home-makers');$('#makers-prev').disabled=row.scrollLeft<5;$('#makers-next').disabled=row.scrollLeft+row.clientWidth>=row.scrollWidth-5;}
$('#home-makers').addEventListener('scroll',updateCarousel,{passive:true});
$('#home-maker-sort').addEventListener('click',e=>{const b=e.target.closest('[data-maker-sort]');if(!b)return;homeMakerSort=b.dataset.makerSort;renderHomeMakers();$('#home-makers').scrollLeft=0;});
$('#makers-prev').addEventListener('click',()=>$('#home-makers').scrollBy({left:-$('#home-makers').clientWidth*.8,behavior:reduced?'instant':'smooth'}));
$('#makers-next').addEventListener('click',()=>$('#home-makers').scrollBy({left:$('#home-makers').clientWidth*.8,behavior:reduced?'instant':'smooth'}));
$('#home-filters').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(!b)return;homeType=b.dataset.type;renderHome();$(`#home-filters [data-type="${homeType}"]`).focus({preventScroll:true});});
function renderHomeStories(){
 $('#home-story-filters').innerHTML=Object.entries(STORY_TYPES).map(([key,label])=>`<button type="button" data-story-type="${key}" aria-pressed="${homeStoryType===key}"><span>${label}</span> <span class="filter-count">${queryStories({type:key}).length}</span></button>`).join('');
 $('#home-stories').innerHTML=queryStories({type:homeStoryType}).slice(0,3).map(storyCard).join('');refreshStarUI();
}
$('#home-story-filters').addEventListener('click',e=>{const b=e.target.closest('[data-story-type]');if(!b)return;homeStoryType=b.dataset.storyType;renderHomeStories();$(`#home-story-filters [data-story-type="${homeStoryType}"]`).focus({preventScroll:true});});
function updateScroll(){
 scrollRAF=0;const isHome=!$('#home-view').hidden;
 $('.site-header').classList.toggle('is-solid',!isHome||scrollY>40);
 $('.floating-back').hidden=!isHome||scrollY<700;
 if(!isHome){setScrollProgress(0);return;}
 const rect=hero.getBoundingClientRect(),range=Math.max(380,innerHeight*.66),progress=clamp(-rect.top/range),view=scrollFrame(progress,reduced);
 const compact=progress*progress*(3-2*progress);
 const invitation=$('.scroll-invitation'),invitationOpacity=1-clamp(progress/.5);
 invitation.style.opacity=String(invitationOpacity);
 invitation.style.visibility=invitationOpacity===0?'hidden':'visible';
 invitation.setAttribute('aria-hidden',String(invitationOpacity===0));
 invitation.tabIndex=invitationOpacity===0?-1:0;
 const stageHeight=innerHeight*(1-.42*compact);
 hero.style.height=`${range+stageHeight}px`;heroStage.style.height=`${stageHeight}px`;heroStage.style.minHeight='0';
 scene.style.top=`${(innerWidth<=760?innerHeight*.43:innerHeight*.40)*(1-compact)+150*compact}px`;
 scene.style.transformOrigin='50% 0';
 setScrollProgress(progress);hero.dataset.scrollProgress=progress.toFixed(3);heroCopy.style.opacity=view.titleOpacity;heroCopy.style.transform=`translateY(${view.titleY}px) scale(${view.titleScale})`;heroCopy.setAttribute('aria-hidden',String(view.titleOpacity<.03));
 scene.style.transform=`translateX(-50%) translateY(${view.sceneY}px) scale(${1-.12*compact})`;
 for(const element of $$('[data-float]')){const frame=foregroundFrame(element.dataset.float,progress,reduced);element.style.transform=`translate3d(${frame.x}px,${frame.y}px,0) rotate(${frame.rotation}deg) scale(${frame.scale})`;element.style.opacity=view.decorationsOpacity;}
}
let introductionRAF=0;
addEventListener('introductioncancel',()=>{cancelAnimationFrame(introductionRAF);introductionRAF=0;});
addEventListener('introductioncomplete',()=>{
 if(reduced || $('#home-view').hidden || scrollY>10){dispatchEvent(new Event('introductionend'));return;}
 const start=performance.now(),from=scrollY,to=hero.getBoundingClientRect().top+scrollY+Math.max(380,innerHeight*.66);
 function advance(now){const t=Math.min(1,(now-start)/950),ease=t*t*(3-2*t);window.scrollTo({top:from+(to-from)*ease,behavior:'instant'});updateScroll();if(t<1)introductionRAF=requestAnimationFrame(advance);else {introductionRAF=0;dispatchEvent(new Event('introductionend'));}}
 introductionRAF=requestAnimationFrame(advance);
});
const requestScroll=()=>{if(!scrollRAF)scrollRAF=requestAnimationFrame(updateScroll);};
addEventListener('finderlayout',requestScroll);
addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',()=>{requestScroll();updateCarousel();},{passive:true});
addEventListener('motionpreferencechange',e=>{reduced=e.detail.reduced;requestScroll();});
function parseRoute(){const [pathname,search='']=(location.hash.slice(1)||'top').split('?');return{path:pathname,params:new URLSearchParams(search)};}
function urlFor(path,params){const q=new URLSearchParams(params);return '#'+path+(q.size?'?'+q:'');}
function navigate(hash,{replace=false,state={}}={}){
 history.replaceState({...history.state,scroll:scrollY},'');history[replace?'replaceState':'pushState']({scroll:0,...state},'',hash);current='';renderRoute();
}
function updateParams(patch){for(const [key,value]of Object.entries(patch)){if(value===null||value===''||value==='all'||(key==='page'&&Number(value)===1))route.params.delete(key);else route.params.set(key,value);}history.replaceState({...history.state,scroll:scrollY},'',urlFor(route.path,route.params));current=location.hash;}
function queryFromRoute(){return {q:route.params.get('q')||'',type:route.params.get('type')||'all',scene:route.params.get('scene')||'all',sort:route.params.get('sort')||'recommended',owner:route.path.startsWith('maker/')?decodePath(route.path.slice(6)):'',page:route.params.get('page')||1,realOnly};}
function pageLinks(result){if(result.pages<2)return'';const pages=new Set([1,result.pages,result.page-1,result.page,result.page+1].filter(p=>p>=1&&p<=result.pages));let last=0;
 return `<nav class="pagination" aria-label="作品分页"><button data-page="${result.page-1}" ${result.page===1?'disabled':''}>← 上一页</button>${[...pages].sort((a,b)=>a-b).map(p=>{const gap=p-last>1?'<span aria-hidden="true">…</span>':'';last=p;return gap+`<button data-page="${p}" ${p===result.page?'aria-current="page"':''}>${p}</button>`;}).join('')}<button data-page="${result.page+1}" ${result.page===result.pages?'disabled':''}>下一页 →</button></nav>`;
}
function renderCatalogShell(maker){
 if(maker&&route.params.get('tab')==='stories'){renderAuthorStories(maker);return;}
 const query=queryFromRoute();
 directory.innerHTML=`<div class="directory-topline"><a href="${maker?'#makers':'#top'}">← ${maker?'全部创作者':'回到首页'}</a></div>${maker?`<div class="maker-profile">${avatar(maker)}<div><p class="section-kicker">THE MAKER</p><h1>${esc(makerName(maker))} ${sampleBadge(maker.sample)}</h1><p>${esc(maker.department||'部门待补充')}</p><p>${esc(maker.bio)}</p>${makerMetrics(maker)}</div></div>`:`${pageHeading({"title": "每一个，", "accent": "都有点东西。", "description": "从一个小麻烦，到一个好点子。在这里找找看。"})}`}
 <div class="browse-controls"><label class="search-field"><span aria-hidden="true">⌕</span><input id="work-search" type="search" autocomplete="off" placeholder="搜作品、用途、创作者…" aria-label="搜索作品、用途或创作者" value="${esc(query.q)}"></label><label class="select-field">排序<select id="work-sort"><option value="recommended" ${query.sort==='recommended'?'selected':''}>推荐</option><option value="newest" ${query.sort==='newest'?'selected':''}>最新</option></select></label></div>
 <div class="filter-panel"><div class="filters" id="directory-types" role="group" aria-label="按作品形态筛选">${typeButtons(query.type)}</div><div class="scene-filters"><span>想用来</span><button data-scene="all" aria-pressed="${query.scene==='all'}">都看看</button>${SCENES.map(s=>`<button data-scene="${esc(s)}" aria-pressed="${query.scene===s}">${esc(s)}</button>`).join('')}</div></div>
 <div class="result-toolbar"><p id="results-status" role="status" tabindex="-1"></p><button class="text-link" id="reset-search" type="button">清除筛选</button></div><div class="product-grid" id="results-grid"></div><div id="results-empty" class="empty-state" hidden><p>暂时没有找到这类好东西。</p><span>试试更具体的用途，或说说还没解决的事。</span><a class="outline-button" id="empty-problem-link" href="#problem/new">说说我想解决的事 ↗</a><button class="text-link" data-clear-results>重新看看全部</button></div><div id="pagination-slot"></div>`;
 if(maker)directory.querySelector('.maker-profile').insertAdjacentHTML('afterend',authorTabs(maker,'works'));
 renderResults();
 $('#work-search').addEventListener('input',e=>{clearTimeout(searchTimer);const value=e.target.value;searchTimer=setTimeout(()=>{updateParams({q:value,page:null});renderResults();},160);});
 $('#work-sort').addEventListener('change',e=>{updateParams({sort:e.target.value,page:null});renderResults();});
 $('#directory-types').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(!b)return;updateParams({type:b.dataset.type,page:null});renderResults();});
 $('.scene-filters').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(!b)return;updateParams({scene:b.dataset.scene,page:null});renderResults();});
 $('#reset-search').addEventListener('click',clearResults);$('[data-clear-results]').addEventListener('click',clearResults);
}
function clearResults(){clearTimeout(searchTimer);updateParams({q:null,type:null,scene:null,sort:null,page:null});$('#work-search').value='';$('#work-sort').value='recommended';renderResults();$('#work-search').focus({preventScroll:true});}
function renderResults(){
 const q=queryFromRoute(),result=queryWorks(q);if($('#maker-work-count'))$('#maker-work-count').textContent=makerWorks(q.owner,realOnly).length+' 件作品';if(result.page!==Number(q.page))updateParams({page:result.page});
 $('#results-grid').innerHTML=result.items.map(productCard).join('');$('#results-empty').hidden=result.total>0;
 $('#empty-problem-link').href=urlFor('problem/new',{q:q.q});
 $('#results-status').textContent=`${result.total} 件好东西${result.total?` · 第 ${(result.page-1)*24+1}–${Math.min(result.page*24,result.total)} 件`:''}`;
 $('#reset-search').hidden=!q.q&&q.type==='all'&&q.scene==='all';
 $$('#directory-types [data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===q.type)));
 $$('.scene-filters [data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===q.scene)));
 $('#pagination-slot').innerHTML=pageLinks(result);bindPagination(renderResults);refreshStarUI();
}
function bindPagination(render){$$('#pagination-slot [data-page]').forEach(b=>b.addEventListener('click',()=>{updateParams({page:b.dataset.page});render();$('.browse-controls').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});$('#results-status')?.focus({preventScroll:true});}));}
function renderMakers(){
 directory.innerHTML=`<div class="directory-topline"><a href="#top">← 回到首页</a></div>${pageHeading({"title": "有意思的人，", "accent": "都在这里。", "description": "从 TA 的第一个小点子，逛到下一件好东西。"})}<div class="browse-controls"><label class="search-field"><span aria-hidden="true">⌕</span><input id="maker-search" type="search" placeholder="搜索姓名或部门…" aria-label="搜索创作者" value="${esc(route.params.get('q')||'')}"></label><label class="select-field">排序<select id="maker-sort"><option value="works">作品最多</option><option value="likes">获赞最多</option></select></label></div><div class="result-toolbar"><p id="results-status" role="status" tabindex="-1"></p></div><div class="stars-status" data-stars-status role="status"></div><div class="makers-grid" id="makers-grid"></div><div id="pagination-slot"></div>`;
 $('#maker-sort').value=route.params.get('sort')==='likes'?'likes':'works';renderMakerResults();
 $('#maker-search').addEventListener('input',e=>{clearTimeout(searchTimer);const v=e.target.value;searchTimer=setTimeout(()=>{updateParams({q:v,page:null});renderMakerResults();},160);});
 $('#maker-sort').addEventListener('change',e=>{updateParams({sort:e.target.value,page:null});renderMakerResults();});
}
function renderMakerResults(){const result=queryMakers({q:route.params.get('q'),sort:route.params.get('sort'),page:route.params.get('page'),realOnly,counts:starCounts});if(result.page!==Number(route.params.get('page')||1))updateParams({page:result.page});$('#results-status').textContent=`${result.total} 位创作者${!realOnly?'':''}`;$('#makers-grid').innerHTML=result.items.length?result.items.map(m=>makerCard(m,true)).join(''):'<p class="empty-state">还没找到这位创作者，换个名字试试。</p>';$('#pagination-slot').innerHTML=pageLinks(result);bindPagination(renderMakerResults);refreshStarUI();}
function openDialog(dialog,opener=document.activeElement){if(dialog.open)return;openers.set(dialog,opener);document.body.classList.add('modal-open');dialog.showModal();dialog.scrollTop=0;}
for(const dialog of [login]){
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');const opener=openers.get(dialog);if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});});
 let down=false;const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>down=e.target===dialog&&outside(e));dialog.addEventListener('pointerup',e=>{if(down&&e.target===dialog&&outside(e))dialog.close();down=false;});dialog.addEventListener('pointercancel',()=>down=false);
}
function renderProduct(item){
 const maker=MAKERS.find(m=>m.id===item.creatorId);
 const back=history.state?.workReturn||'#explore';
 const relatedStories=storiesByWork(item.id);
 const relatedWorks=WORKS.filter(work=>isPublicWork(work)&&work.id!==item.id&&(!realOnly||!work.sample)&&(work.scene===item.scene||work.type===item.type)).slice(0,3);
 const primaryHref=safeSource(item.usageLink)||safeSource(item.link)||safeSource(item.docsLink)||safeSource(item.sourceLink);
 const startAction=primaryHref?`<a class="ink-button" href="${esc(primaryHref)}" target="_blank" rel="noopener noreferrer">${/releases|download/i.test(primaryHref)?'下载作品':'访问作品'} ↗</a>`:`<button class="ink-button" data-contact-author type="button">查看示例说明</button>`;
 const startFootnote=primaryHref?'将在新窗口打开创作者提供的使用入口。':'这是作品集示例，没有真实下载或联系入口。';
 directory.innerHTML=workDetailTemplate({top:`<div class="directory-topline"><a href="${esc(back)}" data-work-back>← 返回作品列表</a><a href="#explore">逛逛全部好东西 ↗</a></div>`,heading:`<header class="work-heading"><div class="product-meta"><span>${esc(item.label)}</span><span>${esc(item.scene)}</span></div><h1>${esc(item.name.replace('Lin An｜',''))}</h1><p>${esc(item.lead)}</p><div class="detail-actions">${startAction}${[[item.sourceLink,'查看源码'],[item.docsLink,'使用说明']].filter(([url])=>safeSource(url)&&url!==primaryHref).map(([url,label])=>`<a class="outline-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</div></header>`,main:`<div class="work-cover">${cover(item)}</div><section class="work-section"><span class="work-section-number" aria-hidden="true">01</span><div><h2>这是个什么东西？</h2>${detailText(item.details||item.description||item.lead)}</div></section><section class="work-section"><span class="work-section-number" aria-hidden="true">02</span><div><h2>也许刚好适合你</h2><p>${esc(item.audience)}</p><ul>${item.uses.map(u=>`<li>${esc(u)}</li>`).join('')}</ul></div></section><section class="work-section" id="work-start"><span class="work-section-number" aria-hidden="true">03</span><div><h2>怎么开始使用</h2>${detailText(item.note)}${startAction}<p class="detail-footnote">${startFootnote}</p><p id="copy-status" class="copy-status" role="status"></p><textarea id="copy-fallback" class="copy-text" aria-label="联系创作者的信息，供手动复制" rows="6" readonly hidden></textarea></div></section><section class="work-section work-guidance"><span class="work-section-number" aria-hidden="true">04</span><div><h2>使用前了解</h2><p class="work-guidance-intro">先了解访问方式、权限和维护情况，再决定它是否适合当前任务。</p><dl><div><dt>访问与安装</dt><dd>${esc(item.access)}；${esc(item.setup)}</dd></div><div><dt>联网与数据</dt><dd>${esc(item.network)}；${esc(item.dataHandling)}</dd></div><div><dt>来源与关系</dt><dd>${esc(item.source)}；${esc(item.officialRelation)}</dd></div><div><dt>维护信息</dt><dd>${esc(item.maintenanceStatus)} · 最近确认于 ${esc(item.lastConfirmed)}</dd></div></dl></div></section>${relatedStories.length?`<section class="related-stories"><p class="section-kicker">BEHIND THE CREATION</p><h2>作者聊制作</h2>${relatedStories.map(storyCard).join('')}</section>`:''}`,sidebar:`<div class="work-author"><p class="section-kicker">MADE BY</p><a href="${makerLink(maker.id)}">${avatar(maker)}<strong>${esc(makerName(maker))}</strong></a><p>${esc(maker.department)}</p><p class="work-author-bio">${esc(maker.bio)}</p>${makerMetrics(maker)}<a class="section-link" href="${makerLink(maker.id)}">看看 TA 的全部作品 ↗</a></div><div class="work-support"><h2>这个好东西，你喜欢吗？</h2><p>给一点鼓励，让好点子继续发生。</p>${starButton(item)}</div>`,bottom:`${relatedWorks.length?`<section class="work-more"><div class="work-more-heading"><div><p class="section-kicker">KEEP EXPLORING</p><h2>解决相似问题的好东西</h2></div><a class="section-link" href="${urlFor('explore',{scene:item.scene})}">继续找找看 ↗</a></div><div class="product-grid">${relatedWorks.map(productCard).join('')}</div></section>`:''}<footer class="work-report"><span>使用中发现入口失效、权限变化或其他风险？</span><a class="section-link" href="${urlFor('problem/new',{about:item.id,q:`反馈《${item.name.replace('Lin An｜','')}》的使用问题`})}">告诉我们 ↗</a></footer>`});
 $('#work-start-link')?.addEventListener('click',()=>$('#work-start').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'}));
 directory.querySelectorAll('[data-contact-author]').forEach(button=>button.addEventListener('click',()=>{$('#work-start').scrollIntoView({block:'center'});$('#copy-status').textContent='这是作品集交互示例，不提供真实下载或联系入口。';}));
 refreshStarUI();
}
async function finishLogin(){
 const star=pendingStar,share=pendingShare;pendingStar=null;pendingShare=false;login.close();
 if(star)await changeStar(star.id,true);else if(share||route.path==='share')navigate(route.path==='share'?location.hash:'#share',{replace:route.path==='share'});
}
login.addEventListener('close',()=>{pendingStar=null;pendingShare=false;});
async function openLogin(opener){
 $('#login-title').textContent=pendingStar?'喜欢，也让 TA 知道。':'你也有点东西。';
 $('#login-description').innerHTML=pendingStar?'使用企业 体验身份登录，<br>为这个好东西点个赞。':'使用企业 体验身份登录，<br>把你的创作带到这张桌上。';
 $('#login-feedback').textContent='正在连接…';$('#google-signin').replaceChildren();$('#login-unavailable').hidden=true;$('#retry-login').hidden=true;openDialog(login,opener);
 await refreshAccount();if(!login.open)return;
 if(account.user){await finishLogin();return;}
 $('#login-feedback').textContent='';$('#login-unavailable').hidden=account.configured;
 if(account.configured)await mountGoogle($('#google-signin'),()=>{toast('欢迎，'+account.user.name);void finishLogin();},message=>{$('#login-feedback').textContent=message;$('#retry-login').hidden=false;});
}
$('#login-trigger').addEventListener('click',e=>openLogin(e.currentTarget));$('#retry-login').addEventListener('click',()=>openLogin(openers.get(login)));
$('#sign-out').addEventListener('click',async()=>{try{await signOut();await refreshAccount();$('#account-menu').open=false;toast('已退出登录。');}catch{toast('暂时未能退出，请重试。');}});
function renderAccount(){
 const signature=account.user?JSON.stringify([account.user.id,account.user.name,account.user.picture]):'';const changed=signature!==renderedProfile;renderedProfile=signature;
 $('#login-trigger').hidden=!!account.user;$('#account-menu').hidden=!account.user;
 if(account.user){$('#account-summary').innerHTML=avatar(account.user,'avatar-small')+'<span aria-hidden="true">⌄</span>';$('#account-name').textContent=account.user.name;}
 if(changed&&route.path==='share')renderShare();if(changed&&route.path==='mine')renderMine();
}
addEventListener('accountchange',()=>{starred.clear();renderAccount();void refreshStars();});
function shareAuthor(){return account.user?`<div class="verified-author">${avatar(account.user)}<div><strong>${esc(account.user.name)}</strong><span>${esc(account.user.email)}</span><small>来自你的 体验身份，自动署名</small></div></div>`:`<div class="login-required"><div><strong>先认识你，再认识你的好东西。</strong><p>登录后会自动带上 Google 头像和名称。</p></div><button class="ink-button" type="button" data-login>使用企业 体验身份登录</button></div>`;}
function renderShare(){
 const kind=route.params.get('kind')==='story'?'story':'work';
 mountSubmission(directory,{kind,account,onLogin:()=>{pendingShare=true;openLogin();},onSave:async values=>{await (kind==='story'?saveStory:saveWork)(values);navigate('#mine');toast('已保存到当前浏览器，未发送或公开。');}});
}
async function renderMine(){
 const generation=++myGeneration;
 directory.innerHTML=`<div class="directory-topline"><a href="#top">← 回到首页</a><a class="section-link" href="#share">分享新作品 ＋</a></div>${pageHeading({"title": "我的", "accent": "好东西。", "description": "从一个念头，到第一次分享。"})}${account.user?`<div class="verified-author">${avatar(account.user)}<div><strong>${esc(account.user.name)}</strong><span>体验身份</span></div></div><div id="my-works" class="my-works"><p role="status">正在找你的作品…</p></div>`:shareAuthor()}`;
 if(!account.user)return;try{const works=await getMyWorks();if(generation!==myGeneration||route.path!=='mine')return;$('#my-works').innerHTML=works.length?works.map(w=>`<article class="my-work"><div><span class="status-tag">${w.status==='published'?'已上架':'本地体验草稿'}</span><h2>${esc(w.title)}</h2><p>${esc(w.description)}</p><small>${esc(w.kind==='story'?STORY_TYPES[w.type]:TYPE_LABELS[w.type])} · ${esc(w.createdAt.slice(0,10))}</small></div></article>`).join(''):'<div class="empty-state"><p>你的第一个好东西，会是什么？</p><a class="outline-button" href="#share">分享第一件作品 ＋</a></div>';}catch(e){if($('#my-works'))$('#my-works').innerHTML=`<p role="alert">${esc(e.message)}</p><button id="retry-mine" class="text-link">重新加载</button>`;$('#retry-mine')?.addEventListener('click',renderMine);}
}

function renderMakerHome(maker){const works=WORKS.filter(w=>isPublicWork(w)&&w.creatorId===maker.id&&(!realOnly||!w.sample)),stories=[...new Map(storiesByAuthor(maker.id).map(s=>[s.id,s])).values()];
 directory.innerHTML=`<div class="directory-topline"><a href="#makers">← 全部创作者</a></div><header class="maker-overview">${avatar(maker)}<div><h1>${esc(makerName(maker))}</h1><p>${esc(maker.department)}</p></div>${makerMetrics(maker)}</header><div class="maker-dual">${works.length?`<section><h2>我做的东西 <small>${works.length}</small></h2><div class="product-grid">${works.map(productCard).join('')}</div></section>`:''}${stories.length?`<section><h2>我分享的过程 <small>${stories.length}</small></h2><div class="maker-story-list">${stories.map(storyCard).join('')}</div></section>`:''}</div>`;refreshStarUI();}
function authorTabs(maker,active){return `<nav class="maker-content-tabs" aria-label="创作者内容"><a href="#maker/${maker.id}" aria-current="${active==='works'?'page':'false'}">作品 ${WORKS.filter(w=>isPublicWork(w)&&w.creatorId===maker.id&&(!realOnly||!w.sample)).length}</a><a href="#maker/${maker.id}?tab=stories" aria-current="${active==='stories'?'page':'false'}">分享 ${storiesByAuthor(maker.id).length}</a></nav>`;}
function renderAuthorStories(maker){const items=storiesByAuthor(maker.id);directory.innerHTML=`<div class="directory-topline"><a href="#makers">← 全部创作者</a></div><div class="maker-profile">${avatar(maker)}<div><p class="section-kicker">THE MAKER</p><h1>${esc(makerName(maker))}</h1><p>${esc(maker.department)}</p><p>${esc(maker.bio)}</p>${makerMetrics(maker)}</div></div>${authorTabs(maker,'stories')}<div>${items.length?items.map(storyCard).join(''):'<div class="empty-state"><p>这位作者还没有分享制作过程。</p><a class="section-link" href="#maker/'+maker.id+'">先看看 TA 的作品 ↗</a></div>'}</div>`;}
function renderStories(){directory.innerHTML=`<div class="story-browser"><div class="directory-topline"><a href="#top">← 回到首页</a><a class="section-link" href="#share?kind=story">分享我的过程 ＋</a></div>${pageHeading({"title": "好东西，", "accent": "也有来时的路。", "description": "制作小记、过程演示，或者一份可以跟着做的教程。"})}<div class="browse-controls"><label class="search-field"><span aria-hidden="true">⌕</span><input id="story-search" type="search" aria-label="搜索分享" placeholder="搜标题、作品或作者…" value="${esc(route.params.get('q')||'')}"></label><label class="select-field">内容形式<select id="story-type">${Object.entries(STORY_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label></div><p id="story-result-count" class="story-meta" role="status"></p><div id="story-results"></div></div>`;$('#story-type').value=STORY_TYPES[route.params.get('type')]?route.params.get('type'):'all';const render=()=>{const items=queryStories({q:route.params.get('q')||'',type:route.params.get('type')||'all'});$('#story-result-count').textContent=items.length+' 篇分享';$('#story-results').innerHTML=items.length?items.map(storyCard).join(''):'<div class="empty-state"><p>还没有找到这样的分享。</p><button class="text-link" id="clear-stories">看看全部分享</button></div>';$('#clear-stories')?.addEventListener('click',()=>{updateParams({q:null,type:null});renderStories();});};render();$('#story-search').addEventListener('input',e=>{updateParams({q:e.target.value});render();});$('#story-type').addEventListener('change',e=>{updateParams({type:e.target.value});render();});}
function renderProblemForm(){
 const q=route.params.get('q')||'';
 mountSubmission(directory,{kind:'problem',account,initial:{title:q.slice(0,120),context:q.length>120?q:''},onSave:async values=>{const result=saveProblemDraft(values);if(!result.saved)throw new Error('当前浏览器无法保存，请下载草稿后再试。');navigate(`#problem/${encodeURIComponent(result.problem.id)}`);}});
}
function renderProblem(problem){
 const status=problem.localOnly?{label:'本地草稿',labelEn:'Local draft'}:(PROBLEM_STATUSES[problem.status]||PROBLEM_STATUSES.pending),related=(problem.relatedWorkIds||[]).map(id=>WORKS.find(w=>isPublicWork(w)&&w.id===id)).filter(Boolean);
 directory.innerHTML=`<article class="problem-page"><div class="directory-topline"><a href="#top">← 回到首页</a><a href="#problem/new">我也有个问题 ＋</a></div><header class="problem-heading"><span class="problem-status status-${esc(problem.status)}">${esc(status.label)}</span><h1 data-no-translate>${esc(problem.title)}</h1><p data-no-translate>${esc(problem.summary||problem.desiredOutcome)}</p>${problem.localOnly?'<small>只保存在当前浏览器，尚未公开。</small>':''}</header><div class="problem-layout"><main><section><p class="section-kicker">CONTEXT</p><h2>发生了什么</h2><p data-no-translate>${esc(problem.context)}</p></section><section><p class="section-kicker">CURRENT WAY</p><h2>现在怎么处理</h2><p data-no-translate>${esc(problem.currentApproach||'还没有稳定的处理办法。')}</p></section><section><p class="section-kicker">DESIRED OUTCOME</p><h2>希望变成什么样</h2><p data-no-translate>${esc(problem.desiredOutcome)}</p></section></main><aside><p class="section-kicker">VISIBILITY</p><strong>${esc(problem.visibility||'团队内可见')}</strong><p>问题不等于功能清单。平台会先匹配已有作品，再决定是否需要共创。</p></aside></div><section class="problem-matches"><div><p class="section-kicker">POSSIBLE MATCHES</p><h2>${related.length?'已经有这些办法可以看看':'还没有匹配到现成办法'}</h2></div>${related.length?`<div class="product-grid">${related.map(productCard).join('')}</div>`:`<p>可以先逛逛全部作品；有合适的内容时，再把它连接回来。</p><a class="outline-button" href="#explore">去找东西 ↗</a>`}</section></article>`;refreshStarUI();
}

function renderRoute({restore=false}={}){
 if(current===location.hash)return;directory.querySelectorAll('video').forEach(v=>v.pause());current=location.hash;clearTimeout(searchTimer);route=parseRoute();
 for(const d of [login])if(d.open)d.close();$('#account-menu').open=false;
 $('.compact-nav').open=false;
 const home=['top','catalog','stories-home','creators','about',''].includes(route.path);$('#home-view').hidden=!home;directory.hidden=home;
 $$('[data-nav]').forEach(a=>a.setAttribute('aria-current',(a.dataset.nav===route.path||(a.dataset.nav==='stories'&&route.path.startsWith('story/')))?'page':'false'));
 if(home){renderHome();document.title='有点东西 — 这儿，有点东西。';}
 else if(route.path==='explore'){renderCatalogShell();document.title='全部好东西 · 有点东西';}
 else if(route.path==='stories'){renderStories();document.title='看分享 · 有点东西';}
 else if(route.path.startsWith('story/')){const story=STORIES.find(s=>s.id===decodePath(route.path.slice(6)));if(story){directory.innerHTML=articleMarkup(story)+`<div class="article-appreciation"><p>喜欢这篇分享？给作者一点鼓励。</p>${starButton({id:'story:'+story.id,name:story.title})}</div>`;document.title=story.title+' · 有点东西';}else renderNotFound();}
 else if(route.path==='makers'){renderMakers();document.title='找创作者 · 有点东西';}
 else if(route.path.startsWith('maker/')){const maker=MAKERS.find(m=>m.id===decodePath(route.path.slice(6)));if(maker){renderMakerHome(maker);document.title=maker.name+' 的好东西';}else renderNotFound();}
 else if(route.path.startsWith('work/')){const item=WORKS.find(w=>isPublicWork(w)&&w.id===decodePath(route.path.slice(5)));if(item){renderProduct(item);document.title=item.name.replace('Lin An｜','')+' · 有点东西';}else renderNotFound();}
 else if(route.path==='problem/new'){renderProblemForm();document.title='说说想解决的事 · 有点东西';}
 else if(route.path.startsWith('problem/')){const problem=getProblem(decodePath(route.path.slice(8)));if(problem){renderProblem(problem);document.title=problem.title+' · 有点东西';}else renderNotFound();}
 else if(route.path==='share'){renderShare();document.title='分享好东西 · 有点东西';}
 else if(route.path==='mine'){renderMine();document.title='我的好东西 · 有点东西';}
 else renderNotFound();
 refreshStarUI();
 requestAnimationFrame(()=>{if(restore)scrollTo({top:history.state?.scroll||0,behavior:'instant'});else if(home){document.getElementById(route.path||'top')?.scrollIntoView({behavior:'instant',block:'start'});}else{scrollTo({top:0,behavior:'instant'});directory.focus({preventScroll:true});}requestScroll();});
}
function renderNotFound(){directory.innerHTML='<div class="empty-state"><p>这页好东西暂时找不到了。</p><a class="outline-button" href="#explore">去作品目录看看 ↗</a></div>';}
document.addEventListener('click',e=>{
 const chapter=e.target.closest('[data-story-anchor]');if(chapter){e.preventDefault();document.getElementById(chapter.dataset.storyAnchor)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});return;}
 const star=e.target.closest('[data-star]');if(star){void changeStar(star.dataset.star);return;}
 if(e.target.closest('[data-retry-stars]')){void refreshStars();return;}
 const back=e.target.closest('[data-work-back]');if(back&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();if(history.state?.workReturn)history.back();else navigate('#explore');return;}
 const product=e.target.closest('[data-product]');if(product){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const from=location.hash||'#top';navigate(product.getAttribute('href'),{state:{workReturn:from}});return;}
 const loginButton=e.target.closest('[data-login]');if(loginButton){pendingShare=true;openLogin(loginButton);return;}
 const share=e.target.closest('[data-share]');if(share){navigate('#share');return;}
 const a=e.target.closest('a[href^="#"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(a.getAttribute('href'));
});
addEventListener('popstate',()=>renderRoute({restore:true}));addEventListener('hashchange',()=>renderRoute({restore:true}));
renderRoute();document.documentElement.dataset.appReady='true';dispatchEvent(new Event('appready'));refreshAccount();

const textureObserver=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){entry.target.removeAttribute('data-texture-pending');textureObserver.unobserve(entry.target)}
},{rootMargin:'300px'});
const textureSeen=new WeakSet();
function deferTextures(){
 for(const cover of document.querySelectorAll('.cover'))if(!textureSeen.has(cover)){
 textureSeen.add(cover);
 if(cover.getBoundingClientRect().top>innerHeight+300){cover.setAttribute('data-texture-pending','');textureObserver.observe(cover)}
 }
}
new MutationObserver(deferTextures).observe(document.querySelector('main'),{childList:true,subtree:true});
deferTextures();
// Real article images can be inspected without leaving the reader's position.
document.addEventListener('click',event=>{
 const opener=event.target.closest('.article-image-open');const image=opener?.querySelector('img');if(!image)return;
 const dialog=document.createElement('dialog');dialog.className='detail-image-dialog';dialog.setAttribute('aria-label','查看图片');
 const close=document.createElement('button');close.type='button';close.className='outline-button';close.textContent=document.documentElement.lang==='en'?'Close image':'关闭图片';close.onclick=()=>dialog.close();
 const enlarged=image.cloneNode();enlarged.removeAttribute('id');dialog.append(close,enlarged);document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();opener.focus({preventScroll:true});},{once:true});dialog.showModal();
});
