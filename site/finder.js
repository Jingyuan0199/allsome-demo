import {cardDetails,cardThumbnail} from './finder-card.js?v=55877283ecfa';
import {emptySession,advanceSession,sessionQuery} from './finder-session.js?v=55877283ecfa';
import {getLanguage} from './i18n.js?v=55877283ecfa';
import {WORKS,MAKERS} from './discovery.js?v=55877283ecfa';
import {STORIES} from './stories.js?v=55877283ecfa';
import {findContent,parseSearch,findRelatedProblem,rankCreators} from './search.js?v=55877283ecfa';
import {PROBLEMS} from './problems.js?v=55877283ecfa';
import {searchCopy} from './search-copy.js?v=55877283ecfa';

const $=selector=>document.querySelector(selector);
const box=$('#finder'),input=$('#finder-input'),panel=$('#finder-panel');
const scroll=$('#finder-scroll');
const form=$('#finder-form'),homeLabel=$('#finder-entry-label'),resume=$('#finder-resume');
const drawer=node('aside','finder finder-drawer');drawer.id='finder-drawer';drawer.dataset.noTranslate='';drawer.hidden=true;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-labelledby','finder-drawer-name');
const drawerHead=node('div','finder-drawer-head');const drawerName=node('h2','');drawerName.id='finder-drawer-name';drawerHead.append(drawerName,$('#finder-close'));

const avatar=()=>{const img=node('img','assistant-avatar');img.src='assets/assistant/paper-assistant.png';img.alt='';img.width=40;img.height=40;return img;};
drawerHead.prepend(avatar());
const invitation=node('p','finder-invitation');homeLabel.after(invitation);homeLabel.before(avatar());
const composerLabel=node('label','sr-only');composerLabel.htmlFor='finder-input';
drawer.append(drawerHead,$('#finder-context'),panel,composerLabel,form,$('#finder-status'));document.body.append(drawer);
scroll.replaceChildren();$('#finder-title').parentElement.hidden=true;$('#finder-context').hidden=true;
const transcript=node('div','finder-transcript');scroll.append(transcript);
const launcher=button('',()=>{render();expand();input.focus({preventScroll:true});});launcher.id='finder-launcher';launcher.setAttribute('aria-controls','finder-drawer');const floatingTools=node('div','floating-tools');floatingTools.append(launcher);const backTop=$('.floating-back');if(backTop)floatingTools.append(backTop);document.body.append(floatingTools);
const editNotice=node('div','finder-edit-notice');editNotice.hidden=true;drawer.insertBefore(editNotice,form);
let returnFocus=null;
const text=(zh,en)=>getLanguage()==='en'?en:zh;
let lastQuery='',expanded=false,clarifying=false,resultScroll=0;
let session=emptySession(),pending=null,editing=false,editingIndex=-1;
let turns=[],replyTimer=null,busy=false;
const examples=[['有什么设计 Bot？','Any design bots?'],['怎么看账号额度？','How can I check account quotas?'],['看看制作过程','See how it’s made']];
function node(tag,className,content){const el=document.createElement(tag);if(className)el.className=className;if(content)el.textContent=content;return el;}
function button(label,action){const el=node('button','',label);el.type='button';el.onclick=action;return el;}
function link(label,path,query){const el=node('a','',label);el.href='#'+path+(query?'?'+new URLSearchParams({q:query}):'');return el;}
function labels(){
 box.ariaLabel=text('站内查找','Site discovery');drawerName.textContent=text('有点助手','Allsome Assistant');composerLabel.textContent=text('补充或修改查找需求','Add or change your request');launcher.replaceChildren(avatar(),node('span','',text('有点助手','Allsome Assistant')));launcher.setAttribute('aria-expanded',String(expanded));launcher.ariaLabel=text('有点助手','Allsome Assistant');launcher.title=text('有点助手','Allsome Assistant');if(backTop)backTop.title=text('返回顶部','Back to top');
 if(lastQuery)homeLabel.removeAttribute('for');else homeLabel.htmlFor='finder-input';
 // Moving a focused form, even within the same parent, interrupts typing and IME.
 if(!expanded&&!lastQuery){if(form.parentElement!==box)invitation.after(form);}else if(form.parentElement!==drawer){drawer.append(editNotice,form);}
 $('#finder-resume').textContent=lastQuery?text('继续对话 →','Continue chatting →'):'';
 $('#finder-resume').hidden=!lastQuery;
 updateLauncher();editNotice.hidden=!editing;editNotice.replaceChildren(node('span','',text('修改后，将从这条消息重新开始。','Editing restarts the conversation from this message.')),button(text('取消','Cancel'),()=>{editing=false;editingIndex=-1;input.value='';labels();resizeInput();input.focus({preventScroll:true});}));
 $('#finder-entry-label').textContent=text('有点助手','Allsome Assistant');
 invitation.textContent=lastQuery?text('上次聊到：','Last time: ')+(session.parts[0]||lastQuery):text('说说你想做什么，一起找找站内的好东西。','Tell me what you’d like to do. Let’s find something useful.');
 input.placeholder=editing?text('修改当前需求','Edit the current request'):session.parts.length?text('继续描述，或问点别的…','Add a detail, or ask something else…'):text('我想找一个能……','I’m looking for something that…');
 input.ariaLabel=text('查找作品、分享或创作者；可以继续补充或纠正','Find creations, stories or contributors; add details or corrections');
 input.setAttribute('aria-controls','finder-panel');input.setAttribute('aria-expanded',String(expanded));
 $('#finder-send').textContent=expanded?'↑':text('和助手聊聊','Let’s chat');$('#finder-send').ariaLabel=text('发送','Send');$('#finder-send').disabled=busy||!input.value.trim();
 const closeIcon=node('span','finder-close-icon');closeIcon.setAttribute('aria-hidden','true');$('#finder-close').replaceChildren(closeIcon);$('#finder-close').ariaLabel=text('收起','Collapse');$('#finder-close').title=text('收起','Collapse');

 $('#finder-examples').hidden=Boolean(session.parts.length)||Boolean(input.value.trim());
 $('#finder-examples').replaceChildren(node('span','finder-try',text('可以问：','Try asking:')),...examples.map(([zh,en])=>button(text(zh,en),()=>submit(text(zh,en),{mode:'new'}))));
}
function updateLauncher(){const r=box.getBoundingClientRect();const visible=!box.closest('[hidden]')&&r.bottom>80&&r.top<innerHeight;launcher.hidden=expanded||visible;}
function fit(){const modal=expanded&&matchMedia('(max-width:760px)').matches;drawer.setAttribute('aria-modal',String(modal));document.querySelector('main').inert=modal;document.querySelector('.site-header').inert=modal;updateLauncher();const v=window.visualViewport;drawer.style.setProperty('--drawer-height',(v?.height||innerHeight)+'px');drawer.style.setProperty('--drawer-top',(v?.offsetTop||0)+'px');}
function expand(){if(!expanded)returnFocus=document.activeElement;expanded=true;drawer.hidden=false;panel.hidden=false;labels();dispatchEvent(new CustomEvent('finderbusy',{detail:true}));fit();resizeInput();}
function close(restore=true){
 resultScroll=$('#finder-scroll').scrollTop;expanded=false;drawer.hidden=true;labels();fit();dispatchEvent(new CustomEvent('finderbusy',{detail:false}));
 if(restore){const target=returnFocus?.isConnected&&returnFocus.getClientRects().length?returnFocus:!launcher.hidden?launcher:resume.hidden?input:resume;target.focus({preventScroll:true});}
}
function commit(next){session=next;pending=null;lastQuery=sessionQuery(session);}
function submit(query,{skipClarification=false,mode='auto'}={}){
 if(busy)return;
 query=String(query).trim();if(!query){input.focus();return;}
 if(editingIndex>=0){session=turns[editingIndex].before;turns=turns.slice(0,editingIndex);lastQuery=sessionQuery(session);editingIndex=-1;}
 const before=session;
 const next=advanceSession(session,query,mode);
 editing=false;
 if(next.pending){pending=next.pending;}else{commit(next.state);}
 input.value='';resultScroll=0;
 const parsed=parseSearch(lastQuery);
 clarifying=!pending&&!skipClarification&&!parsed.storyIntent&&!parsed.offline&&parsed.terms.length===1&&parsed.terms[0]==='会议';
 const turn={message:query,before,session,pending,clarifying,query:lastQuery,loading:true};turns.push(turn);busy=true;
 replyTimer=setTimeout(()=>{turn.loading=false;busy=false;render();labels();},matchMedia('(prefers-reduced-motion:reduce)').matches?80:450);
 render();expand();resizeInput();scroll.scrollTop=Math.max(0,scroll.scrollTop+transcript.lastElementChild.getBoundingClientRect().top-scroll.getBoundingClientRect().top-12);input.focus({preventScroll:true});
}
function resizeInput(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,expanded?160:128)+'px';}
function render(){
 transcript.replaceChildren();
 if(!turns.length){const welcome=node('div','finder-welcome');welcome.append(node('h3','',text('想找点什么？','What are you looking for?')),node('p','',text('找作品、分享或创作者，也可以说说想完成的事。','Find creations, stories or contributors, or describe a task.')));transcript.append(welcome);return;}
 turns.forEach((turn,index)=>{
  const row=node('section','finder-turn');
  const user=node('div','finder-user');user.append(node('p','finder-user-message',turn.message));
  const edit=button(text('修改','Edit'),()=>{editing=true;editingIndex=index;input.value=turn.message;labels();resizeInput();input.focus({preventScroll:true});});edit.className='finder-edit';user.append(edit);row.append(user);
  row.append(renderTurn(turn,index===turns.length-1));transcript.append(row);
 });
 const latest=transcript.lastElementChild?.querySelector('.finder-assistant-heading,.finder-looking');$('#finder-status').textContent=latest?.textContent||'';
}
function renderTurn(turn,isLatest){
 if(turn.loading){const waiting=node('div','finder-looking',text('正在查找站内内容…','Searching the site…'));waiting.setAttribute('role','status');return waiting;}
 const {pending,clarifying,query:lastQuery}=turn;
 const reply=node('div','finder-assistant');reply.append(node('span','sr-only',text('助手回复','Assistant response')));
 const title=node('p','finder-assistant-heading'),response=node('div','finder-response'),suggestions=node('div','finder-suggestions'),actions=node('div','finder-actions');reply.append(title,response,suggestions,actions);
 if(pending){
  title.textContent=text('可以再说说具体想找什么，或哪一点需要调整吗？','What would you like to find, or what should change?');

  return reply;
 }
 if(clarifying){
  title.textContent=text('会议的哪一部分？','Which part of the meeting?');
  response.append(node('p','finder-result-intro',text('你想回顾录音，还是整理讨论中的待办？','Would you like to review recordings or organize action items?')));
  if(isLatest)suggestions.append(button(text('回顾录音','Review recordings'),()=>submit(text('录音','recordings'),{skipClarification:true,mode:'add'})),button(text('整理待办','Organize action items'),()=>submit(text('行动项','action items'),{skipClarification:true,mode:'add'})));
  return reply;
 }
 const result=findContent(lastQuery,{works:WORKS,stories:STORIES});
 const creatorIntent=/创作者|作者|\b(?:contributors?|creators?|makers?|authors?)\b/i.test(lastQuery);
 const named=MAKERS.some(m=>m.name.toLowerCase()===lastQuery.toLowerCase());
 const creators=(creatorIntent||named)?rankCreators(MAKERS,WORKS,lastQuery):[];
 result.creatorCount=creators.length;
 if(creatorIntent){result.preview=[];result.total=0;result.workCount=0;result.storyCount=0;}
 if(creators.length){result.preview=[...creators.slice(0,creatorIntent?3:1).map(row=>({...row,kind:'maker'})),...result.preview].slice(0,3);result.total+=creators.length;}
 title.textContent=result.total?text(`找到 ${result.total} 条相关内容，可以先看看这些。`, `I found ${result.total} matches. Here are a few to explore.`):text('暂时没有匹配的内容','No matching content yet');
 if(result.total){
  if(/token.*(?:余额|额度)|token.*balance/i.test(turn.message))response.append(node('p','finder-result-intro',text('这些作品可以查看账号或模型额度；具体统计口径请查看作品说明。','These creations track account or model quotas. See each creation for its measurement details.')));
  const list=node('ul','finder-result-list');
  result.preview.forEach(({item,kind},index)=>{
   const li=node('li',index===2?'finder-third-result':'');
   const a=link('',(kind==='work'?'work/':kind==='maker'?'maker/':'story/')+item.id);a.className='finder-result-card';
   if(kind==='work')a.dataset.product=item.id;
   const copy=kind==='maker'?{title:item.name,description:text(`${item.department} · ${WORKS.filter(w=>w.publicationStatus==='published'&&w.creatorId===item.id).length} 件作品`,`${item.department} · ${WORKS.filter(w=>w.publicationStatus==='published'&&w.creatorId===item.id).length} creations`)}:searchCopy(item,kind,getLanguage());
   const detail=cardDetails(item,kind,lastQuery,{works:WORKS,makers:MAKERS,language:getLanguage()});
   const tone=kind==='work'?(['web','bot','extension','skill','desktop','local','other'].includes(item.type)?item.type:'other'):kind;
   const heading=node('span','finder-card-heading');const badge=node('span','finder-kind',detail.badge);badge.dataset.tone=tone;heading.append(node('strong','',copy.title),badge);
   const top=node('div','finder-result-top');const thumbnail=cardThumbnail(item,kind);
   const cover=node('span','finder-result-cover'+(kind==='maker'?' is-person':''));cover.dataset.tone=tone;cover.setAttribute('aria-hidden','true');
   const coverText=item.id==='quota-card'?text('额度\n一眼知','QUOTA'):copy.title;
   cover.append(node('span','finder-cover-word',coverText));
   if(thumbnail){const img=node('img','finder-result-thumb');img.src=thumbnail;img.alt='';img.width=64;img.height=64;img.loading='lazy';img.onerror=()=>img.remove();cover.append(img);}
   top.append(cover);
   const summary=node('div','finder-result-summary');summary.append(heading,node('span','finder-description',copy.description));top.append(summary);a.append(top);
   const facts=node('dl','finder-card-facts');
   detail.fields.forEach(([label,value])=>{const row=node('div','finder-card-fact');row.append(node('dt','',label),node('dd','',value));facts.append(row);});
   if(detail.fields.length)a.append(facts);li.append(a);list.append(li);
  });response.append(list);
  const more=node('div','finder-more');
  if(result.workCount)more.append(link(text(`查看相关作品 (${result.workCount}) →`,`Matching creations (${result.workCount}) →`),'explore',lastQuery));
  if(result.storyCount)more.append(link(text(`查看相关分享 (${result.storyCount}) →`,`Matching stories (${result.storyCount}) →`),'stories',lastQuery));
  if(result.creatorCount)more.append(link(text(`查看相关创作者 (${result.creatorCount}) →`,`Matching contributors (${result.creatorCount}) →`),'makers',lastQuery));
  actions.append(more);
 }else{
  response.append(node('p','finder-result-intro',result.parsed.offline?text('还没有找到已确认支持离线的匹配作品。可以换一个条件继续找，或留下这个问题。','No creation is confirmed to work offline and match these terms. Edit your search or describe what you need.'):text('可以接着告诉我使用场景，或哪一点需要调整。不用重新描述一遍。','Tell me more about the situation or what should change. You don’t need to start again.')));

  const problem=findRelatedProblem(lastQuery,PROBLEMS);
  if(problem){const copy=searchCopy(problem,'problem',getLanguage());const related=link(text('相似问题：','Related problem: ')+copy.title,'problem/'+problem.id);related.className='finder-related-problem';response.append(related);}
 }
 const feedback=link(result.total?text('这些不合适？说说想解决的事','Not a fit? Describe what you need'):text('留下这个问题 →','Keep this problem →'),'problem/new',lastQuery);
 feedback.className='finder-feedback finder-save-problem';if(!result.total)actions.append(feedback);
 return reply;
}
$('#finder-form').onsubmit=event=>{event.preventDefault();submit(input.value);};
$('#finder-close').onclick=()=>close();
$('#finder-resume').onclick=()=>{expand();$('#finder-scroll').scrollTop=resultScroll;input.focus({preventScroll:true});};
input.addEventListener('input',()=>{labels();resizeInput();});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.keyCode!==229){event.preventDefault();submit(input.value);}});
input.addEventListener('focus',()=>dispatchEvent(new CustomEvent('finderbusy',{detail:true})));
box.addEventListener('focusout',()=>setTimeout(()=>{if(!expanded&&!box.contains(document.activeElement))dispatchEvent(new CustomEvent('finderbusy',{detail:false}));},0));
document.addEventListener('keydown',event=>{
 if(event.key==='Tab'&&expanded&&matchMedia('(max-width:760px)').matches){const controls=[...drawer.querySelectorAll('button,a,input,textarea')].filter(el=>!el.disabled&&el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 if(event.key==='Escape'&&expanded){event.preventDefault();close();}
});
document.addEventListener('languagechange',()=>{labels();render();fit();});
matchMedia('(max-width:760px)').addEventListener('change',()=>{render();});
window.visualViewport?.addEventListener('resize',fit);let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fit,120);});
labels();

window.addEventListener('scroll',updateLauncher,{passive:true});
window.addEventListener('hashchange',()=>{if(expanded)close(false);requestAnimationFrame(updateLauncher);});
new IntersectionObserver(updateLauncher).observe(box);
drawer.addEventListener('click',event=>{if(event.target.closest('a[href^="#"]'))close(false);});

let outsidePress=false;
document.addEventListener('pointerdown',event=>{outsidePress=expanded&&!drawer.contains(event.target);},true);
document.addEventListener('click',event=>{if(outsidePress&&expanded&&!drawer.contains(event.target)){close(false);}outsidePress=false;},true);

// Follow the actual navigation height across breakpoints and future style changes.
const syncHeaderHeight=()=>drawer.style.setProperty('--site-header-height',document.querySelector('.site-header').getBoundingClientRect().height+'px');
new ResizeObserver(syncHeaderHeight).observe(document.querySelector('.site-header'));
syncHeaderHeight();
