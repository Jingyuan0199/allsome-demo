// Shared heading for directory, submission and personal-content pages.
// Page callers supply text only; structure and presentation are owned here.
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pageHeading({title,accent='',description=''}){
 return `<header class="directory-heading page-heading"><h1>${escapeText(title)}${accent?`<span class="serif-word">${escapeText(accent)}</span>`:''}</h1>${description?`<p>${escapeText(description)}</p>`:''}</header>`;
}
