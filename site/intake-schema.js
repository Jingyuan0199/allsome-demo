// Portable draft boundary shared by browser, server and Codex packaging helper.
export const DRAFT_LIMIT=64000;
const limits={scene:100,details:12000,usageLink:1000,platform:200,access:500,setup:800,network:800,dataHandling:1200,maintainer:100,maintenanceStatus:200,title:120,description:500,type:30,link:1000,sourceLink:1000,docsLink:1000,instructions:2000,body:12000,workId:100,context:1200,currentApproach:800,desiredOutcome:800,cover:1000};
export function normalizeDraft(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.schemaVersion!==1)throw new Error('请选择 Allsome v1 草稿文件。 / Expected an Allsome v1 draft.');
 const kind=input.kind==='creation'?'work':input.kind;
 if(!['work','story','problem'].includes(kind))throw new Error('草稿内容类型不受支持。 / Unsupported draft type.');
 const result={schemaVersion:1,kind};
 for(const [field,max]of Object.entries(limits)){const value=input[field]??'';if(typeof value!=='string'||value.length>max)throw new Error(`请检查字段 ${field}。 / Invalid field: ${field}`);result[field]=value.trim();}
 for(const field of ['link','sourceLink','docsLink','cover','usageLink'])if(result[field]){let url;try{url=new URL(result[field]);}catch{throw new Error(`链接无效：${field}`);}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error(`请使用不含凭据的 http(s) 链接：${field}`);}
 if(kind==='work'&&!['web','bot','extension','skill','desktop','local','other'].includes(result.type))result.type='web';
 if(kind==='story'&&!['note','demo','guide'].includes(result.type))result.type='note';
 result.mode=input.mode==='write'||(!result.link&&result.body)?'write':'link';
 result.coverStyle=['sage','blue','yellow','rust'].includes(input.coverStyle)?input.coverStyle:'sage';
 result.evidence=Array.isArray(input.evidence)?input.evidence.slice(0,12).map(e=>({field:String(e?.field||'').slice(0,50),source:String(e?.source||'').slice(0,300),excerpt:String(e?.excerpt||'').slice(0,400)})):[];
 result.questions=Array.isArray(input.questions)?input.questions.slice(0,8).map(q=>String(q).slice(0,300)):[];
 return result;
}
export function parseDraft(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>DRAFT_LIMIT)throw new Error('草稿过大，请控制在 64 KB 内。 / Draft exceeds 64 KB.');return normalizeDraft(JSON.parse(text));}
