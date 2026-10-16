export const PREVIEW_STAR_COUNTS=Object.freeze({});
export const previewStarCounts=(ids=[])=>Object.fromEntries(ids.map(id=>[id,0]));
export const displayStarCounts=(actual={},ids=[])=>({...previewStarCounts(ids),...actual});
