/**
 * config.js — 所有設定常數
 * 修改此檔可新增主題、轉場、字體、濾鏡等選項
 */

const TRANSITIONS = [
  { id: 'fade',       name: '淡入淡出',   cat: '基本' },
  { id: 'zoom-in',    name: '放大進入',   cat: '基本' },
  { id: 'zoom-out',   name: '縮小離開',   cat: '基本' },
  { id: 'dissolve',   name: '交叉溶解',   cat: '基本' },
  { id: 'slide-left', name: '左滑',       cat: '方向' },
  { id: 'slide-right',name: '右滑',       cat: '方向' },
  { id: 'slide-up',   name: '上滑',       cat: '方向' },
  { id: 'slide-down', name: '下滑',       cat: '方向' },
  { id: 'blur',       name: '模糊過渡',   cat: '特效' },
  { id: 'rotate',     name: '旋轉',       cat: '特效' },
  { id: 'flip',       name: '翻轉',       cat: '特效' },
  { id: 'crosszoom',  name: '交叉縮放',   cat: '特效' },
  { id: 'flash',      name: '閃白',       cat: '特效' },
  { id: 'pixelate',   name: '像素化',     cat: '特效' },
  { id: 'wipe-h',     name: '水平擦除',   cat: '擦除' },
  { id: 'wipe-v',     name: '垂直擦除',   cat: '擦除' },
  { id: 'wipe-diag',  name: '對角擦除',   cat: '擦除' },
  { id: 'diamond',    name: '菱形展開',   cat: '形狀' },
  { id: 'circle',     name: '圓形展開',   cat: '形狀' },
  { id: 'heart',      name: '愛心展開',   cat: '形狀' },
  { id: 'blinds-h',   name: '百葉窗橫',   cat: '分割' },
  { id: 'blinds-v',   name: '百葉窗直',   cat: '分割' },
];

const THEMES = [
  { id: 'wedding',     name: '婚禮',     emoji: '💒' },
  { id: 'anniversary', name: '紀念日',   emoji: '💕' },
  { id: 'proposal',    name: '求婚',     emoji: '💍' },
  { id: 'memorial',    name: '追思紀念', emoji: '🕊' },
  { id: 'birthday',    name: '生日',     emoji: '🎂' },
  { id: 'travel',      name: '旅行回憶', emoji: '✈️' },
  { id: 'baby',        name: '寶寶成長', emoji: '👶' },
  { id: 'graduation',  name: '畢業',     emoji: '🎓' },
];

const FONTS = [
  { id: 'playfair',   name: '經典襯線', family: "'Playfair Display', serif" },
  { id: 'vibes',      name: '花體手寫', family: "'Great Vibes', cursive" },
  { id: 'dancing',    name: '活潑手寫', family: "'Dancing Script', cursive" },
  { id: 'cormorant',  name: '優雅細體', family: "'Cormorant Garamond', serif" },
  { id: 'noto',       name: '中文黑體', family: "'Noto Sans TC', sans-serif" },
];

const TEXT_ANIMS = [
  { id: 'none',  name: '無' },
  { id: 'fade',  name: '淡入' },
  { id: 'rise',  name: '上升' },
  { id: 'scale', name: '放大' },
];

const FILTERS = [
  { id: 'none',    name: '原始', vals: { brightness: 100, contrast: 100, saturate: 100, sepia: 0 } },
  { id: 'warm',    name: '暖色', vals: { brightness: 105, contrast: 105, saturate: 120, sepia: 15 } },
  { id: 'cool',    name: '冷色', vals: { brightness: 100, contrast: 110, saturate: 80,  sepia: 0 } },
  { id: 'vintage', name: '復古', vals: { brightness: 95,  contrast: 120, saturate: 70,  sepia: 30 } },
  { id: 'bw',      name: '黑白', vals: { brightness: 105, contrast: 115, saturate: 0,   sepia: 0 } },
  { id: 'vivid',   name: '鮮豔', vals: { brightness: 108, contrast: 115, saturate: 150, sepia: 0 } },
  { id: 'dreamy',  name: '夢幻', vals: { brightness: 112, contrast: 90,  saturate: 110, sepia: 10 } },
  { id: 'dark',    name: '暗調', vals: { brightness: 80,  contrast: 130, saturate: 90,  sepia: 5 } },
];

/** Default API model */
const AI_MODEL = 'claude-sonnet-4-20250514';

/** LocalStorage keys */
const LS_API_KEY = 'memories_ai_api_key';
const LS_PROJECT = 'memories_ai_project';
const LS_TUTORIAL = 'memories_ai_tutorial_done';
