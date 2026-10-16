const STORAGE_KEY='allsome-portfolio-problem-drafts-v1';

export const PROBLEM_STATUSES={
 looking:{label:'还在找',labelEn:'Looking for an answer'},
 matched:{label:'已有相似办法',labelEn:'Possible matches'},
 discussing:{label:'欢迎交流',labelEn:'Open to discuss'},
 building:{label:'共创中',labelEn:'In progress'},
 solved:{label:'已有解法',labelEn:'Solution available'},
 closed:{label:'已关闭',labelEn:'Closed'},
 pending:{label:'待整理',labelEn:'Pending review'},
};

export const PROBLEMS=[];

function clean(value,limit){return String(value??'').trim().slice(0,limit);}
function readLocal(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(value)?value:[];}catch{return[];}}
function writeLocal(items){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));return true;}catch{return false;}}
export function getProblems(){return [...readLocal(),...PROBLEMS];}
export function getProblem(id){return getProblems().find(item=>item.id===id)||null;}
export function saveProblemDraft(values){
 const now=new Date().toISOString(),problem={
  id:`local-${Date.now().toString(36)}`,
  title:clean(values.title,120),
  summary:clean(values.summary,300),
  context:clean(values.context,1200),
  currentApproach:clean(values.currentApproach,800),
  desiredOutcome:clean(values.desiredOutcome,800),
  visibility:clean(values.visibility,40)||'仅自己可见',
  contactOk:values.contactOk==='on',
  status:'pending',relatedWorkIds:[],createdAt:now,localOnly:true,
 };
 if(!problem.title||!problem.context||!problem.desiredOutcome)throw new TypeError('请先补充问题、发生情境和希望改善的结果。');
 const items=readLocal();items.unshift(problem);return {problem,saved:writeLocal(items)};
}
