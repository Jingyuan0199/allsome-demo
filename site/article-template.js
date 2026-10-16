// All article pages share this shell. Bodies supply content; headings supply the TOC.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function articleTemplate(story,type,body,{preview=false}={}){
 const en=document.documentElement?.lang==='en';
 const content=document.createElement('template');content.innerHTML=body;
 content.content.querySelectorAll('figure > img').forEach(image=>{const button=document.createElement('button');button.type='button';button.className='article-image-open';button.setAttribute('aria-label',en?'Enlarge image':'放大查看图片');image.replaceWith(button);button.append(image);});
 const chapters=[...content.content.querySelectorAll('section')].filter(section=>section.querySelector(':scope > h2')).map((section,index)=>{
  const heading=section.querySelector(':scope > h2');section.id=section.id||`chapter-${index+1}`;
  return {id:section.id,title:heading.textContent.replace(/^\d+\s*\/\s*/,''),number:String(index+1).padStart(2,'0')};
 });
 return `<article class="story-article">${preview?'':`<div class="directory-topline"><a href="#stories">← 全部分享</a><span class="story-meta">${esc(type)}</span></div>`}<header class="story-heading"><h1>${esc(story.title)}</h1><p class="story-deck">${esc(story.summary)}</p>${preview?`<div class="story-heading-meta">${esc(story.author||'')}</div>`:`<div class="story-heading-meta"><a href="#maker/${esc(story.authorId)}">${esc(story.author||'Lin An')} · 创作社区</a><span>${esc(story.date)} · <span>预计阅读 ${story.minutes} 分钟</span></span></div>`}</header><div class="story-reading-layout${chapters.length<2?' story-reading-solo':''}">${chapters.length>1?`<details class="story-toc-mobile"><summary>${en?'Contents':'文章目录'}</summary>${chapters.map(c=>`<a href="#${esc(c.id)}" data-story-anchor="${esc(c.id)}">${esc(c.title)}</a>`).join('')}</details>`:''}${chapters.length>1?`<aside class="story-toc" aria-label="文章目录"><p>${en?'Contents':'这篇聊什么'}</p>${chapters.map(c=>`<a href="#${esc(c.id)}" data-story-anchor="${esc(c.id)}"><span>${c.number}</span>${esc(c.title)}</a>`).join('')}</aside>`:''}<div class="story-prose">${content.innerHTML}</div></div></article>`;
}
