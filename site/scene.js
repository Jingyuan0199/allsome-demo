import {ANIMATION_ASSETS} from './animation-assets.js?v=55877283ecfa';
import { PeopleMotion, isIntentionalTap } from './motion.js?v=55877283ecfa';
import { WIDTH, HEIGHT, ROLES, ENVIRONMENT, hitRole, nearbyRole, sweepRoles } from './geometry.js?v=55877283ecfa';
import { clamp, welcomeAt, composeWelcome } from './home-state.js?v=55877283ecfa';
import { IdleSequence } from './idle-sequence.js?v=55877283ecfa';
import { IdleInput } from './idle-input.js?v=55877283ecfa';

const scene = document.querySelector('#scene');
const stage = document.querySelector('#stage');
const ctx = stage.getContext('2d');
const targets = document.querySelector('#targets');
const media = matchMedia('(prefers-reduced-motion: reduce)');
let assistantBusy=false;
addEventListener("finderbusy",e=>{assistantBusy=e.detail; if(assistantBusy){cancelIntroduction();motion.dismiss(performance.now());}syncIdle(performance.now());wake();});
const motion = new PeopleMotion({ reduced: media.matches });
const idleSequence = new IdleSequence();
const idleInput = new IdleInput();
const pressedPointers = new Set();
let introductionEligible = !location.hash || location.hash === '#top';
let introductionAdvancing = false;
addEventListener('introductionend',()=>{introductionAdvancing=false;});
let introductionSteps = 0;
let introductionTimer;
function cancelIntroduction(){introductionAdvancing=false;introductionEligible=false;clearTimeout(introductionTimer);dispatchEvent(new Event('introductioncancel'));}
addEventListener('hashchange',cancelIntroduction);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelIntroduction();});
const assets = globalThis.__PEOPLE_ASSETS__ || Object.fromEntries(['idle','notice','greeting','hold','toast-refined'].map(key => [key, `assets/${key}.png`]));
const source = {}, cache = [];
const paths = ROLES.map(role => ({ upper: new Path2D(role.upper), lower: new Path2D(role.lower) }));
const environmentPaths = ENVIRONMENT.map(d => {
  const p = new Path2D(); p.rect(0, 0, WIDTH, HEIGHT); p.addPath(new Path2D(d)); return p;
});
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let gray, ready = false, visible = true, raf = 0, idleTimer = 0, idleDeadline = Infinity, lastDraw = '', lastAnnounced = -1, focused = -1;
let pointerDown = null, loadingAttempt = 0, manualReduced = false;
let scrollProgress = 0;
let groupStartedAt = -Infinity;
const isGroup = () => welcomeAt(scrollProgress).active;
const sceneSnapshot = snapshot => composeWelcome(snapshot, scrollProgress, motion.reduced, (performance.now()-groupStartedAt)/260);
export function setScrollProgress(value) {
  const wasGroup = isGroup();
  scrollProgress = clamp(value);
  scene.style.setProperty('--group-color',welcomeAt(scrollProgress).amount);
  if (wasGroup !== isGroup()) {
    pointerDown = null;
    if (isGroup()) { groupStartedAt=performance.now();motion.dismiss(groupStartedAt); }
    else { groupStartedAt=-Infinity;motion.reset(); }
    scene.dataset.hover = 'false';
  }
  syncIdle(performance.now());
  wake();
}
const ns = 'http://www.w3.org/2000/svg';
for (let index = 0; index < ROLES.length; index++) {
  const role = ROLES[index];
  const target = document.createElementNS(ns, 'g');
  target.id = `target-${role.id}`; target.classList.add('target');
  target.setAttribute('role', 'button'); target.setAttribute('tabindex', '-1');
  target.setAttribute('aria-label', `和${role.name}打个招呼`); target.setAttribute('aria-describedby', 'help');
  const path = document.createElementNS(ns, 'path'); path.setAttribute('d', role.silhouette + role.lower);
  target.append(path); targets.append(target);
  target.addEventListener('focus', () => {
    if (!ready || isGroup() || !target.matches(':focus-visible')) return;
    focused = index; recordActivity(); motion.focus(index, performance.now()); wake();
    // Reveal this character on the touch layout without moving the page vertically.
    const scroll = document.querySelector('#scene-scroll');
    const anchor = role.focus[0] / WIDTH * scene.offsetWidth;
    if (anchor < scroll.scrollLeft + 40 || anchor > scroll.scrollLeft + scroll.clientWidth - 40) scroll.scrollLeft = Math.max(0, anchor - scroll.clientWidth / 2);
  });
  target.addEventListener('blur', () => { if (focused === index) { focused = -1; motion.blur(performance.now()); syncIdle(performance.now()); wake(); } });
  target.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); if(isGroup()) return;
      motion.tap(index, performance.now()); motion.mode = 'focus'; motion.releaseAt = Infinity; wake();
    }
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => { const im = new Image(); im.fetchPriority=url.includes('idle.')?'high':'low'; im.onload = () => resolve(im); im.onerror = () => reject(new Error(`Image failed: ${url.slice(0,100)}`)); im.src = url; });
}
function excludeEnvironment(context) { for (const path of environmentPaths) context.clip(path, 'evenodd'); }
function cleanIdleArtwork(image) {
  const cleaned = canvas(WIDTH, HEIGHT), context = cleaned.getContext('2d');
  context.drawImage(image, 0, 0, WIDTH, HEIGHT);
  // The designer's red shoe made this nearby table-foot block read as part of her foot
  // when she became colorful. Reuse the untouched paper directly below it so every
  // scene state shares the same clean composition while preserving the floor line.
  context.drawImage(image, 390, 700, 102, 15, 390, 675, 102, 15);
  return cleaned;
}
function prepare() {
  source.idle = cleanIdleArtwork(source.idle);
  gray = canvas(WIDTH, HEIGHT); const grayContext = gray.getContext('2d');
  grayContext.filter = 'grayscale(1)'; grayContext.drawImage(source.idle, 0, 0, WIDTH, HEIGHT);
  // The snacks, fruit and waiting chair keep their complete original colors.
  grayContext.save();
  grayContext.clip(new Path2D(ENVIRONMENT[4]+ENVIRONMENT[6]+ENVIRONMENT[7]+'M1460 407H1630V610H1340V530H1424V440Z'));
  grayContext.filter='none';grayContext.globalAlpha=1;grayContext.drawImage(source.idle,0,0,WIDTH,HEIGHT);grayContext.restore();
  for (let i = 0; i < ROLES.length; i++) {
    const role = ROLES[i], [x,y,w,h] = role.patch;
    const frames = {};
    for (const key of ['idle','notice','greeting','hold']) {
      const c = canvas(w,h), context = c.getContext('2d');
      context.translate(-x,-y); context.clip(paths[i].upper); excludeEnvironment(context);
      // Registration corrects the 4–5px vertical drift of generated upper-body poses.
      // The approved lower body and all furniture always come from idle.png.
      const scaleY = key === 'idle' ? 1 : 1.012;
      context.drawImage(i===4 && key==='greeting' ? source['toast-refined'] : source[key], 0, 0, WIDTH, HEIGHT * scaleY);
      if(i===2) {
        // Preserve the original thin A4 and its hand-drawn mind map through every pose.
        context.save(); context.clip(new Path2D('M1029 135L1114 132L1118 207L1109 248L1031 248Z'));
        context.drawImage(source.idle,0,0,WIDTH,HEIGHT); context.restore();
      }
      frames[key] = c;
    }
    const lower = canvas(WIDTH, HEIGHT), lowerCtx = lower.getContext('2d');
    excludeEnvironment(lowerCtx);
    lowerCtx.fillStyle='#fff'; lowerCtx.strokeStyle='#fff'; lowerCtx.lineWidth=6; lowerCtx.lineJoin='round';
    lowerCtx.fill(paths[i].lower); lowerCtx.stroke(paths[i].lower);
    lowerCtx.globalCompositeOperation='source-in'; lowerCtx.drawImage(source.idle,0,0,WIDTH,HEIGHT);
    cache[i] = { frames, lower, mix: canvas(w,h), warped: canvas(w,h) };
  }
}

/** Local paper-like deformation. Its falloff keeps wrists/neck joined and hips fixed. */
function deformPoint(px, py, role, state) {
  let x = px, y = py;
  const [hx,hy,hw,hh] = role.head, cx = hx + hw/2, cy = hy + hh*.48;
  const hd = Math.pow((px-cx)/(hw*.62),2) + Math.pow((py-cy)/(hh*.66),2);
  const headWeight = Math.max(0,1-hd);
  const nod = state.nod * 2.7;
  y += nod * headWeight * headWeight;
  x += nod * (py-cy) / hh * .22 * headWeight;
  const [ax,ay,aw,ah] = role.arm, [ox,oy] = role.pivot;
  const ad = Math.pow((px-(ax+aw/2))/(aw*.8),2) + Math.pow((py-(ay+ah/2))/(ah*.7),2);
  const weight = Math.max(0,1-ad), angle = state.flourish * role.wave * weight * weight;
  const dx = px-ox, dy = py-oy;
  x += dx*(Math.cos(angle)-1) - dy*Math.sin(angle);
  y += dx*Math.sin(angle) + dy*(Math.cos(angle)-1);
  return [x,y];
}
function triangle(context, image, a, b, c, A, B, C) {
  const den = a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
  const coeff = axis => [
    (A[axis]*(b[1]-c[1])+B[axis]*(c[1]-a[1])+C[axis]*(a[1]-b[1]))/den,
    (A[axis]*(c[0]-b[0])+B[axis]*(a[0]-c[0])+C[axis]*(b[0]-a[0]))/den,
    (A[axis]*(b[0]*c[1]-c[0]*b[1])+B[axis]*(c[0]*a[1]-a[0]*c[1])+C[axis]*(a[0]*b[1]-b[0]*a[1]))/den,
  ];
  const [aa,cc,ee] = coeff(0), [bb,dd,ff] = coeff(1);
  context.save(); context.beginPath();
  // A small overlap avoids hairline seams between neighboring triangles.
  const cx=(A[0]+B[0]+C[0])/3, cy=(A[1]+B[1]+C[1])/3;
  for (const [j,p] of [A,B,C].entries()) {
    const dx=p[0]-cx,dy=p[1]-cy,scale=1+.38/Math.hypot(dx,dy);
    if (!j) context.moveTo(cx+dx*scale,cy+dy*scale); else context.lineTo(cx+dx*scale,cy+dy*scale);
  }
  context.closePath(); context.clip(); context.transform(aa,bb,cc,dd,ee,ff); context.drawImage(image,0,0); context.restore();
}
function warp(image, destination, role, state) {
  const context=destination.getContext('2d'); context.clearRect(0,0,destination.width,destination.height);
  const [ox,oy,w,h] = role.patch, cols=9, rows=9, vertices=[];
  for (let row=0;row<=rows;row++) for (let col=0;col<=cols;col++) {
    const from=[w*col/cols,h*row/rows], global=deformPoint(from[0]+ox,from[1]+oy,role,state);
    vertices.push({ from, to: [global[0]-ox,global[1]-oy] });
  }
  for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
    const a=vertices[row*(cols+1)+col], b=vertices[row*(cols+1)+col+1], c=vertices[(row+1)*(cols+1)+col], d=vertices[(row+1)*(cols+1)+col+1];
    triangle(context,image,a.from,b.from,c.from,a.to,b.to,c.to);
    triangle(context,image,b.from,d.from,c.from,b.to,d.to,c.to);
  }
  return destination;
}
function draw(snapshot, now) {
  const signature=JSON.stringify([snapshot.active,snapshot.group,snapshot.phases,snapshot.values.map(v=>Object.values(v).map(n=>Math.round(n*1000))),motion.mode,motion.reduced]);
  if(signature===lastDraw) return; lastDraw=signature;
  ctx.clearRect(0,0,WIDTH,HEIGHT); ctx.drawImage(gray,0,0);
  // A group welcome restores the original environment as well as every person.
  if(snapshot.group>0) { ctx.globalAlpha=snapshot.group;ctx.drawImage(source.idle,0,0,WIDTH,HEIGHT);ctx.globalAlpha=1; }
  // The original entire lower body shares exactly the upper body's color progress.
  for(let i=0;i<ROLES.length;i++) if(snapshot.values[i].color>0) {
    const group=snapshot.group||0;
    const alpha=group>=1?0:(snapshot.values[i].color-group)/(1-group);
    if(alpha>0){ctx.globalAlpha=alpha;ctx.drawImage(cache[i].lower,0,0);ctx.globalAlpha=1;}
  }
  for(let i=0;i<ROLES.length;i++) {
    const state=snapshot.values[i], role=ROLES[i], entry=cache[i];
    if(state.turn===0 && state.color===0) continue;
    const mixCtx=entry.mix.getContext('2d'); mixCtx.clearRect(0,0,entry.mix.width,entry.mix.height);
    mixCtx.globalAlpha=1; mixCtx.drawImage(entry.frames.idle,0,0);
    if(!motion.reduced) {
      mixCtx.globalAlpha=state.turn; mixCtx.drawImage(entry.frames.notice,0,0);
      mixCtx.globalAlpha=state.gesture; mixCtx.drawImage(entry.frames.greeting,0,0);
      mixCtx.globalAlpha=state.settle; mixCtx.drawImage(entry.frames.hold,0,0); mixCtx.globalAlpha=1;
    }
    const moving=!motion.reduced && (Math.abs(state.flourish)>.001 || Math.abs(state.nod)>.001);
    const bitmap=moving ? warp(entry.mix,entry.warped,role,state) : entry.mix;
    ctx.save(); ctx.clip(paths[i].upper); excludeEnvironment(ctx);
    ctx.filter=`grayscale(${1-state.color})`; ctx.drawImage(bitmap,role.patch[0],role.patch[1]); ctx.restore();
  }
  scene.dataset.active=snapshot.group>0?'group':snapshot.active<0?'none':ROLES[snapshot.active].id;
  scene.dataset.welcome=String(snapshot.group||0);
  scene.dataset.phases=snapshot.phases.join(',');
  scene.dataset.colors=snapshot.values.map(v=>v.color.toFixed(3)).join(',');
  scene.dataset.turns=snapshot.values.map(v=>v.turn.toFixed(3)).join(',');
  scene.dataset.playback=motion.mode==='auto'&&snapshot.active>=0?'automatic':'interactive';
  const announcement=snapshot.group>0?'group':snapshot.active;
  const announcementKey=motion.mode+':'+announcement;
  if(announcementKey!==lastAnnounced) {
    lastAnnounced=announcementKey;
    // A decorative loop must not repeatedly interrupt screen-reader speech.
    if(motion.mode!=='auto'||snapshot.group>0)document.querySelector('#live-status').textContent=announcement==='group'?'大家都看向了你。桌边还留着一个位置。':snapshot.active<0?'大家继续聊天。':`${ROLES[snapshot.active].name}注意到了你。`;
  }
}
function scheduleIdle() {
  scene.dataset.autoplay=idleSequence.phase;
  scene.dataset.idleDeadline=String(Math.round(idleSequence.nextAt));
  // Count visible quiet time while images load, without waking an unready canvas.
  if(!ready){clearTimeout(idleTimer);idleTimer=0;idleDeadline=Infinity;return;}
  if(idleDeadline===idleSequence.nextAt)return;
  clearTimeout(idleTimer);idleTimer=0;idleDeadline=idleSequence.nextAt;
  if(Number.isFinite(idleDeadline))idleTimer=setTimeout(()=>{idleTimer=0;idleDeadline=Infinity;wake();},Math.max(0,idleDeadline-performance.now()));
}
function syncIdle(now) {
  const enabled=visible&&!assistantBusy&&!document.hidden&&!motion.reduced&&!isGroup()&&focused<0&&!pressedPointers.size&&!scene.closest('[hidden]')&&!document.querySelector('dialog[open]');
  idleSequence.setEnabled(enabled,now);
  if(!enabled&&motion.mode==='auto'&&motion.active>=0)motion.dismiss(now);
  scheduleIdle();
}
function recordActivity(event) {
  const now=performance.now();
  if(!idleInput.accept(event,now))return false;
  if(event?.type!=='pointermove')cancelIntroduction();
  scene.dataset.lastActivity=JSON.stringify({type:event?.type||'internal',at:Math.round(now)});
  if(motion.mode==='auto'&&motion.active>=0)motion.dismiss(now);
  idleSequence.activity(now);syncIdle(now);wake();
  return true;
}
function frame(now) {
  raf=0;if(!ready||!visible)return;
  syncIdle(now);
  const action=idleSequence.tick(now);
  if(action?.type==='wake'){
    if(!scene.dataset.firstAutoplayAt)scene.dataset.firstAutoplayAt=String(Math.round(now));
    const index=introductionEligible && introductionSteps===0 ? Math.floor(Math.random()*5) : action.index;
    motion.activate(index,now,'auto');
    if(introductionEligible && ++introductionSteps===1){
      introductionTimer=setTimeout(()=>{
        if(introductionEligible && visible && !document.hidden && !motion.reduced && !isGroup() && !scene.closest('[hidden]') && !document.querySelector('dialog[open]')){
          introductionEligible=false;introductionAdvancing=true;dispatchEvent(new Event('introductioncomplete'));
        }
      },1100);
    }
  }
  const snapshot=motion.tick(now);
  draw(sceneSnapshot(snapshot),now);
  scheduleIdle();
  const finishingGaze=isGroup()&&!motion.reduced&&now-groupStartedAt<260;
  if(motion.moving||finishingGaze)raf=requestAnimationFrame(frame);
}
function wake() { if(ready && visible && !raf) raf=requestAnimationFrame(frame); }
function point(event) {
  const rect=scene.getBoundingClientRect(); return [(event.clientX-rect.left)*WIDTH/rect.width,(event.clientY-rect.top)*HEIGHT/rect.height];
}
let previousPointer=null;
addEventListener('pointermove',event=>{
  // Incidental movement must not steal the greeting or the automatic scroll.
  if(!motion.reduced&&(introductionEligible||introductionAdvancing)){previousPointer=null;return;}
  if(!recordActivity(event))return;
  if(!ready||!visible||isGroup()||event.pointerType==='touch'||event.buttons){previousPointer=null;return;}
  const rect=scene.getBoundingClientRect(),now=performance.now();
  const next=[(event.clientX-rect.left)*WIDTH/rect.width,(event.clientY-rect.top)*HEIGHT/rect.height];
  const padding=Math.min(35,10*WIDTH/rect.width);
  const end=nearbyRole(...next,padding);
  const from=previousPointer&&now-previousPointer.time<120&&Math.abs(previousPointer.scroll-scrollY)<1?previousPointer.point:next;
  const crosses=Math.max(from[0],next[0])>=0&&Math.min(from[0],next[0])<=WIDTH&&Math.max(from[1],next[1])>=0&&Math.min(from[1],next[1])<=HEIGHT;
  if(crosses)for(const index of sweepRoles(from,next,padding))if(index!==motion.hovered)motion.hover(index,now);
  motion.hover(end,now);scene.dataset.hover=String(end>=0);
  previousPointer={point:next,time:now,scroll:scrollY};wake();
},{passive:true});
scene.addEventListener('pointerleave',event=>{
  if((!motion.reduced&&(introductionEligible||introductionAdvancing))||event.pointerType==='touch'||isGroup())return;
  scene.dataset.hover='false';motion.hover(-1,performance.now());wake();
});
scene.addEventListener('pointerdown',event=>{
  if(!ready || isGroup() || event.button!==0) return;
  pointerDown={x:event.clientX,y:event.clientY,time:performance.now(),role:hitRole(...point(event)),id:event.pointerId,scroll:document.querySelector('#scene-scroll').scrollLeft};
});
scene.addEventListener('pointerup',event=>{
  const down=pointerDown; pointerDown=null;
  if(isGroup()) return;
  const end={x:event.clientX,y:event.clientY,time:performance.now(),role:hitRole(...point(event)),id:event.pointerId,scroll:document.querySelector('#scene-scroll').scrollLeft};
  if(!isIntentionalTap(down,end)) return;
  motion.tap(down.role,performance.now()); wake();
});
scene.addEventListener('pointercancel',()=>{ pointerDown=null; });
document.querySelector('#reset').addEventListener('click',()=>{ recordActivity(); motion.dismiss(performance.now()); wake(); });
document.addEventListener('keydown',event=>{
  if(event.key==='Escape') { motion.dismiss(performance.now()); wake(); }
});
// Any intentional input takes precedence, including input outside the illustration.
addEventListener('pointerdown',event=>{pressedPointers.add(event.pointerId);recordActivity(event);},{capture:true,passive:true});
for(const type of ['pointerup','pointercancel'])addEventListener(type,event=>{pressedPointers.delete(event.pointerId);recordActivity(event);},{capture:true,passive:true});
addEventListener('keydown',recordActivity,{capture:true});
document.addEventListener('focusin',event=>{
  if(event.target.matches('input, textarea, select, [contenteditable="true"]'))recordActivity();
});
addEventListener('wheel',recordActivity,{passive:true});
addEventListener('scroll',event=>{previousPointer=null;if(!recordActivity(event)){syncIdle(performance.now());wake();}},{capture:true,passive:true});
document.addEventListener('close',()=>{syncIdle(performance.now());wake();},{capture:true});
function visibility(value) {
  if(visible===value) return;
  visible=value; cancelAnimationFrame(raf); raf=0; pressedPointers.clear();previousPointer=null;
  motion.reset(); scene.dataset.hover='false'; pointerDown=null; lastDraw='';
  if(ready) draw(sceneSnapshot(motion.snapshot()),performance.now());
  syncIdle(performance.now());if(visible)wake();
}
let intersecting=true;
new IntersectionObserver(entries=>{ intersecting=entries[0].isIntersecting; visibility(intersecting&&!document.hidden); },{threshold:.12}).observe(scene);
document.addEventListener('visibilitychange',()=>visibility(intersecting&&!document.hidden));
function updateReduced() {
  motion.setReduced(media.matches||manualReduced); if(motion.reduced)cancelIntroduction(); lastDraw='';
  const input=document.querySelector('#reduced-motion'); if(input) input.checked=motion.reduced;
  scene.dataset.reduced=String(motion.reduced); syncIdle(performance.now());wake();
  document.documentElement.dataset.reduced=String(motion.reduced);
  dispatchEvent(new CustomEvent('motionpreferencechange',{detail:{reduced:motion.reduced}}));
}
media.addEventListener('change',updateReduced);
document.querySelector('#reduced-motion')?.addEventListener('change',event=>{manualReduced=event.target.checked;updateReduced();});
updateReduced();
async function init() {
  const attempt=++loadingAttempt;
  document.querySelector('#asset-error').hidden=true;
  try {
    const images=await Promise.all(Object.entries(assets).map(async ([key,url])=>{
      const spec=!globalThis.__PEOPLE_ASSETS__&&ANIMATION_ASSETS[key];
      if(!spec)return loadImage(key==='idle'&&!globalThis.__PEOPLE_ASSETS__?'assets/idle-q92.webp':url);
      const full=canvas(spec.width,spec.height),context=full.getContext('2d');
      await Promise.all(spec.crops.map(async (crop,i)=>{
        if(key==='toast-refined'&&i!==4)return;
        if(key==='greeting'&&i===4)return;
        const image=await loadImage(crop.url);context.drawImage(image,crop.x,crop.y);
      }));
      return full;
    }));
    if(attempt!==loadingAttempt) return;
    Object.keys(assets).forEach((key,i)=>{source[key]=images[i];}); prepare();
    ready=true;scene.dataset.readyAt=String(Math.round(performance.now())); draw(sceneSnapshot(motion.snapshot()),performance.now());
    scene.dataset.ready='true'; scene.setAttribute('aria-busy','false');

    targets.querySelectorAll('.target').forEach(target=>target.setAttribute('tabindex','0'));
    syncIdle(performance.now());wake();
  } catch(error) {
    console.error(error);
    scene.setAttribute('aria-busy','false'); document.querySelector('#asset-error').hidden=false;
  }
}
document.querySelector('#retry').addEventListener('click',init);
let initialLoadScheduled=false;
const homeAssetsNeeded=()=>!location.hash||location.hash==='#top'||['#catalog','#stories-home','#creators'].includes(location.hash);
function ensureHomeAssets(){
 if(ready||loadingAttempt||initialLoadScheduled||!homeAssetsNeeded())return;
 const fallback=scene.querySelector('.fallback');
 if(fallback.complete&&fallback.naturalWidth){init();return;}
 initialLoadScheduled=true;
 const begin=()=>{initialLoadScheduled=false;if(homeAssetsNeeded()&&!ready&&!loadingAttempt)init();};
 fallback.addEventListener('load',begin,{once:true});
 fallback.addEventListener('error',begin,{once:true});
}
addEventListener('hashchange',ensureHomeAssets);
ensureHomeAssets();
