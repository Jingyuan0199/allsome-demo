import {consolidateWorkDraft} from './submission-content.js?v=55877283ecfa';
import {normalizeDraft} from './intake-schema.js?v=55877283ecfa';
import {getLanguage} from './i18n.js?v=55877283ecfa';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=(zh,en)=>getLanguage()==='en'?en:zh;
import {planPrefill,undoPrefill} from './prefill.js?v=55877283ecfa';
export function mountIntakeEntry(root,{kind,getDraft,getDefaults,onApply,signal}){
 const form=root.querySelector('[data-submission]'),source=form.querySelector('[name=link]');
 const host=document.createElement('section');host.className='prefill-assist';
 host.innerHTML=`<button type="button" class="ink-button" data-generate>${t('AI 自动填写','Autofill with AI')}</button><p data-source-status role="status"></p><p data-prefill-status role="status"></p><button type="button" class="text-link" data-undo hidden>${t('撤销本次填写','Undo last fill')}</button><div data-conflicts></div>`;
 const linkLabel=source.closest('label');linkLabel.after(host);
 const generate=host.querySelector('[data-generate]'),row=document.createElement('div');row.className='prefill-source-row';source.id='prefill-source';linkLabel.htmlFor=source.id;row.append(source,generate);linkLabel.after(row);
 const sourceStatus=host.querySelector('[data-source-status]'),status=host.querySelector('[data-prefill-status]'),diff=host.querySelector('[data-conflicts]'),undo=host.querySelector('[data-undo]');
 const history=[];let incoming=null;
 const names={details:t('详细介绍','Details'),usageLink:t('使用或下载入口','Access or download'),title:t('标题','Title'),description:t('简介','Description'),type:t('内容类型','Type'),link:t('来源链接','Source link'),instructions:t('使用方式','Getting started'),body:t('正文','Body'),sourceLink:t('源码链接','Source URL'),docsLink:t('文档链接','Docs URL'),cover:t('封面','Cover'),coverStyle:t('封面配色','Cover color'),workId:t('关联作品','Related creation')};
 const apply=patch=>{if(!Object.keys(patch).length)return;const current=getDraft(),before={};for(const key of Object.keys(patch))before[key]=current[key];history.push({before,after:patch});onApply(patch);undo.hidden=false;};
 const renderConflicts=()=>{
 if(!incoming){diff.replaceChildren();return;}
 const {conflicts}=planPrefill(getDraft(),incoming,getDefaults());
 diff.innerHTML=conflicts.length?`<details open class="prefill-diff"><summary>${t('已有内容不同，按需选择替换','Different suggestions — choose what to replace')} (${conflicts.length})</summary>${conflicts.map((c,i)=>`<div class="prefill-diff-row"><label><input type="checkbox" data-choice="${i}">${esc(names[c.key]||c.key)}</label><div><span>${t('当前','Current')}</span><p>${esc(c.before)}</p></div><div><span>${t('建议','Suggested')}</span><p>${esc(c.after)}</p></div></div>`).join('')}<button type="button" class="outline-button" data-replace>${t('替换选中内容','Replace selected')}</button><button type="button" class="text-link" data-dismiss>${t('保留当前内容','Keep current content')}</button></details>`:'';
 diff.querySelector('[data-dismiss]')?.addEventListener('click',()=>{incoming=null;diff.replaceChildren();});
 diff.querySelector('[data-replace]')?.addEventListener('click',()=>{const current=getDraft(),patch={};let stale=false;for(const box of diff.querySelectorAll('[data-choice]:checked')){const c=conflicts[Number(box.dataset.choice)];if(current[c.key]!==c.before){stale=true;continue;}patch[c.key]=c.after;}apply(patch);status.textContent=stale?t('部分字段刚被修改，已保留。请重新检查差异。','Recent edits were kept. Review the updated differences.'):Object.keys(patch).length?t('已替换选中内容，可撤销。','Selected fields replaced. You can undo.'):t('请先选择需要替换的字段。','Choose fields to replace.');renderConflicts();});
 };
 const receive=value=>{if(signal?.aborted||!root.isConnected)return;const normalized=normalizeDraft(value);const result=kind==='work'?consolidateWorkDraft(normalized,getLanguage()):normalized;if(result.kind!==kind)throw new Error(t('草稿类型与当前表单不同，请切换到对应类型。','This draft is for another content type. Switch to that form before generating.'));
 incoming=result;const {fill}=planPrefill(getDraft(),result,getDefaults());
 // Provenance belongs to the proposed material, not a verified assertion about manual text.
 const patch={...fill};if(result.evidence.length)patch.evidence=result.evidence;if(result.questions.length)patch.questions=result.questions;
 apply(patch);status.textContent=Object.keys(fill).length?t('已补充空白字段，原有内容已保留。可继续编辑或撤销。','Empty fields filled. Existing content kept. Edit or undo anytime.'):t('原有内容已保留，请检查下方建议。','Existing content kept. Review suggestions below.');renderConflicts();};
 undo.onclick=()=>{const change=history.pop();if(!change)return;onApply(undoPrefill(getDraft(),change));undo.hidden=!history.length;incoming=null;diff.replaceChildren();status.textContent=t('已撤销填写；之后手动修改的内容仍保留。','Fill undone. Later manual edits have been kept.');};

 generate.textContent=t('体验示例预填','Try example autofill');
 const explanation=document.createElement('p');explanation.className='form-note';explanation.textContent=t('使用预置案例体验自动填写，不读取你输入的链接。已有内容会保留。','Uses a preset example, without reading your URL. Existing content is kept.');host.prepend(explanation);
 generate.onclick=()=>{
 const en=getLanguage()==='en';
 receive({schemaVersion:1,kind,type:kind==='story'?'note':'local',title:en?'Project notes':'项目便签',description:en?'Keep a project’s next steps together.':'把项目里的下一步行动收在一张便签里。',details:en?'# Getting started\n\n1. Create a note.\n2. Add the next action.':'# 怎么开始\n\n1. 新建项目便签。\n2. 记下下一步行动。\n\n# 使用前了解\n\n这是预置示例，没有外部下载或账号服务。',body:kind==='story'?(en?'# The idea\n\nKeep scattered actions together.':'# 从一个小问题开始\n\n把零散的行动项放到一起，让下一步更清楚。'):'',evidence:[],questions:[]});
 sourceStatus.textContent=t('已填入预置示例。请编辑、预览，再保存到本机。','Preset filled. Edit, preview, and save locally.');
 };
}
