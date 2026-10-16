// Search summaries are editorial translations; original articles keep their language.
const works = {
 'quota-note':['额度便签','Manage Codex accounts, 模型 models and quotas in one desktop workspace.'],
 'design-bot':['设计讨论伙伴','Turn feedback about a page or flow into concrete design improvements.'],
 'clone-manager':['Clone Manager','Bring repetitive repository-cloning steps into one browser workflow.'],
 'preview-editor':['Document & Code Preview Editor','Preview and edit documents or code as part of your agent workflow.'],
 'quota-card':['ChatGPT Quota Card','Check your remaining quota from the ChatGPT desktop client.'],
 'meeting-notes':['Meeting Recorder','Record meetings so you can revisit the discussion.'],
};
const topics = [
 ['Page Palette Picker','Collect a color palette from a webpage for your next design.'],
 ['API Request Notes','Keep common requests together for quicker debugging.'],
 ['Meeting Action List','Turn discussions into clear next steps and action items.'],
 ['What’s for Lunch?','Keep lunch options together to make choosing easier.'],
 ['Design Handoff Check','Check missing states, copy and responsive behavior before handoff.'],
 ['JSON Workshop','Format, compare and organize JSON data.'],
 ['Weekly Update Box','Collect progress throughout the week for your next update.'],
 ['Walking Route Cards','Save walks nearby as cards you can share.'],
 ['Image Size Inspector','Check image dimensions in bulk when organizing assets.'],
 ['Code Reading Companion','Follow key calls to understand an unfamiliar project.'],
 ['Document Navigator','Create navigation for long documents to find key sections.'],
 ['Focus Radio','Set aside focused time with background sounds.'],
 ['Icon Keyword Cards','Explore alternative keywords to find a more suitable icon.'],
 ['Terminal Snippet Collection','Save commands with notes so you can find and reuse them.'],
 ['Data Explanation Notes','Describe changes in tables in readable language.'],
 ['Reading Excerpts','Save passages and organize them by topic.'],
 ['Accessibility Check','Check contrast and keyboard navigation for overlooked issues.'],
 ['Log Clue Assistant','Find key events around an error in long logs.'],
 ['Team Glossary','Keep shared explanations of abbreviations and team terminology.'],
 ['Desktop Plant Diary','Record new leaves and take a moment to check on your plants.'],
 ['Prompt Organizer','Save prompts with their purpose and usage examples.'],
 ['Reading Bookmarks','Organize webpages you want to read later by topic.'],
 ['Time Zone Helper','Compare city times to arrange a meeting.'],
 ['Photo Story Cards','Write a short story for a favorite photograph.'],
 ['Component State Checklist','Map component states to the situations they need to support.'],
 ['Commit Message Helper','Describe changes so teammates can review them easily.'],
 ['To-do Notes','Keep today’s most important tasks close at hand.'],
 ['Podcast Clip Notes','Save timestamps and thoughts for moments worth replaying.'],
 ['Idea Connections','Combine two unrelated words to explore a new idea.'],
 ['Spreadsheet Cleanup','Clean up duplicates, blanks and inconsistent data formats.'],
 ['Screenshot Annotation Box','Mark the important parts of a screenshot before sharing it.'],
 ['Reading Progress','Save your place so you can finish a long article later.'],
 ['Receipt Notebook','Organize receipts and notes by date for easy reference.'],
 ['Release Checklist','Keep recurring pre-release checks in one list.'],
 ['Interview Excerpts','Organize interview excerpts by topic without losing context.'],
 ['Personal Knowledge Index','Connect notes and documents in a personal index.'],
 ['Test Case Box','Keep reusable test inputs with their expected results.'],
 ['Rehearsal Timer','Read through a presentation to estimate how long it takes.'],
 ['Color Mood Calendar','Record each day’s mood with a color.'],
];
const stories = {
 'quota-note-story':['额度便签: Connect 模型 and Understand Your Quota','A guide to importing 模型 models, checking monthly quotas and separating Codex configurations.'],
 'a-table-for-ideas':['Why I Built Allsome','The ideas, design iterations and AI-assisted process behind this space for colleagues’ creations.'],
 'clone-manager-small-frictions':['Clone Manager: Fewer Repetitive Steps','How a browser extension brings repeated repository-cloning steps together.'],
 'quota-card-work-rhythm':['How Much Quota Is Left?','The story behind a quota card for the ChatGPT desktop client.'],
 'watch-the-table':['A Table That Welcomes You','A walkthrough of the homepage’s character, title and scroll interactions.'],
 'sketch-to-flow':['From a Website Idea to a Sketch','Start with visitor tasks, then sketch the content and interactions on paper.'],
};
const problems={
 'codex-account-quota-switching':['Switching Codex Accounts and 模型 Models','Keep accounts, quotas and providers clear while separating working configurations.'],
 'weekly-project-updates':['Keeping Up with Several Projects','Collect progress across projects and turn it into an update colleagues can follow.'],
 'clone-friction':['Fewer Repeated Steps When Cloning Projects','Keep repository addresses, directories and frequent actions together.'],
};
export function searchCopy(item,kind='work',language='zh') {
 const original={title:item.name?.replace('Lin An｜','')||item.title,description:item.lead||item.summary||''};
 if(language!=='en')return original;
 let copy=kind==='story'?stories[item.id]:kind==='problem'?problems[item.id]:works[item.id];
 const index=Number(item.id?.match(/^sample-work-(\d+)$/)?.[1])-1;
 if(kind==='work'&&Number.isInteger(index)&&index>=0){
  const suffix=['',' · Lite',' · Team',' · Pocket',' · Experimental'][Math.floor(index/topics.length)]||'';
  copy=[topics[index%topics.length][0]+suffix,topics[index%topics.length][1]];
 }
 return copy?{title:copy[0],description:copy[1]}:original;
}
