export const CREATORS=["Chen Yu", "Lin An", "Mu Yan", "Su He"];
export const TYPES=["all","bot","extension","skill","desktop","local"];
export const PRODUCTS=[{"id": "quota-note", "name": "额度便签", "type": "desktop", "label": "客户端工具", "owner": "Chen Yu", "cover": "credits", "tone": "blue", "lead": "把几个工具的剩余额度整理成一眼能看懂的便签。", "category": "Agent 工作流", "description": "把几个工具的剩余额度整理成一眼能看懂的便签。 这个条目用于体验从发现作品、理解用途到查看制作过程的完整路径。", "audience": "希望减少重复工作、让信息更容易理解的人。", "uses": ["把几个工具的剩余额度整理成一眼能看懂的便签。", "通过关联分享了解设计过程。"], "note": "此处展示产品介绍与使用说明的结构，不提供真实软件下载或外部账号接入。", "question": "我想了解这个示例的使用场景。"}, {"id": "design-bot", "name": "设计讨论伙伴", "type": "bot", "label": "Bot", "owner": "Lin An", "cover": "bot", "tone": "yellow", "lead": "从页面和使用场景出发，把模糊反馈变成具体建议。", "category": "设计协作", "description": "从页面和使用场景出发，把模糊反馈变成具体建议。 这个条目用于体验从发现作品、理解用途到查看制作过程的完整路径。", "audience": "希望减少重复工作、让信息更容易理解的人。", "uses": ["从页面和使用场景出发，把模糊反馈变成具体建议。", "通过关联分享了解设计过程。"], "note": "此处展示产品介绍与使用说明的结构，不提供真实软件下载或外部账号接入。", "question": "我想了解这个示例的使用场景。"}, {"id": "clone-manager", "name": "项目收藏夹", "type": "extension", "label": "插件", "owner": "Mu Yan", "cover": "clone", "tone": "blue", "lead": "把常用项目整理在一起，少做重复查找。", "category": "开发效率", "description": "把常用项目整理在一起，少做重复查找。 这个条目用于体验从发现作品、理解用途到查看制作过程的完整路径。", "audience": "希望减少重复工作、让信息更容易理解的人。", "uses": ["把常用项目整理在一起，少做重复查找。", "通过关联分享了解设计过程。"], "note": "此处展示产品介绍与使用说明的结构，不提供真实软件下载或外部账号接入。", "question": "我想了解这个示例的使用场景。"}, {"id": "preview-editor", "name": "文档预览助手", "type": "skill", "label": "Skill", "owner": "Mu Yan", "cover": "editor", "tone": "sage", "lead": "先看清要修改的资料，再交给助手处理。", "category": "Agent 工作流", "description": "先看清要修改的资料，再交给助手处理。 这个条目用于体验从发现作品、理解用途到查看制作过程的完整路径。", "audience": "希望减少重复工作、让信息更容易理解的人。", "uses": ["先看清要修改的资料，再交给助手处理。", "通过关联分享了解设计过程。"], "note": "此处展示产品介绍与使用说明的结构，不提供真实软件下载或外部账号接入。", "question": "我想了解这个示例的使用场景。"}, {"id": "quota-card", "name": "工作节奏卡", "type": "desktop", "label": "客户端工具", "owner": "Su He", "cover": "quota", "tone": "rust", "lead": "为下一段专注时间留出空间。", "category": "日常协作", "description": "为下一段专注时间留出空间。 这个条目用于体验从发现作品、理解用途到查看制作过程的完整路径。", "audience": "希望减少重复工作、让信息更容易理解的人。", "uses": ["为下一段专注时间留出空间。", "通过关联分享了解设计过程。"], "note": "此处展示产品介绍与使用说明的结构，不提供真实软件下载或外部账号接入。", "question": "我想了解这个示例的使用场景。"}, {"id": "meeting-notes", "name": "会议要点本", "type": "local", "label": "本地工具", "owner": "Su He", "cover": "meeting", "tone": "sage", "lead": "整理讨论要点，让下一步行动清楚可见。", "category": "日常协作", "description": "整理讨论要点，让下一步行动清楚可见。 这个条目用于体验从发现作品、理解用途到查看制作过程的完整路径。", "audience": "希望减少重复工作、让信息更容易理解的人。", "uses": ["整理讨论要点，让下一步行动清楚可见。", "通过关联分享了解设计过程。"], "note": "此处展示产品介绍与使用说明的结构，不提供真实软件下载或外部账号接入。", "question": "我想了解这个示例的使用场景。"}];
export function filterProducts({ type = 'all', owner = null } = {}) {
  if (!TYPES.includes(type) || (owner !== null && !CREATORS.includes(owner))) throw new TypeError('请选择页面中已有的类型或创作者。');
  return PRODUCTS.filter(item => (type === 'all' || item.type === type) && (owner === null || item.owner === owner));
}

const field = (value, limit) => String(value ?? '').trim().slice(0, limit);
export function shareDraft(data) {
  const lines = [
    '我做了一个有点意思的东西，想和大家分享。', '',
    `作品：${field(data.title, 80) || '（作品名字）'}`,
    `形态：${field(data.type, 40) || '小产品 / 网页'}`,
    `一句话介绍：${field(data.description, 500) || '（它能帮什么忙，或有什么好玩的）'}`,
  ];
  if (field(data.link,1000)) lines.push(`试用入口：${field(data.link,1000)}`);
  if (field(data.instructions,1000)) lines.push(`使用方式：${field(data.instructions,1000)}`);
  lines.push('', `作者：${field(data.author,60) || '（你的名字）'}`);
  if (field(data.contact,150)) lines.push(`联系我：${field(data.contact,150)}`);
  return lines.join('\n');
}

export function consultation(item) {
  return `${item.owner} 你好，我在「有点东西」看到了你做的作品。\n\n${item.question}`;
}
