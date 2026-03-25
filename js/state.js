/**
 * state.js — 全域應用狀態
 */

const S = {
  slides: [],         // Array of slide objects
  cur: 0,             // Current slide index
  theme: 'wedding',
  transition: 'fade',
  slideDur: 3.5,      // Default seconds per image slide
  transitionDur: 0.8, // Transition duration in seconds
  introTitle: '',
  introSub: '',
  outroTitle: '',
  outroSub: '',
  textFont: 'playfair',
  textAnim: 'fade',
  musicFile: null,     // { name, src, audioEl }
  musicVol: 0.7,
  muted: false,
  playing: false,
  loop: false,
  exporting: false,
  exportCancel: false,
  resolution: '720',   // '720' or '1080'
  history: [],          // Undo history
  aiDone: false,
  aiCancel: false,
  aiPhase: null,        // null | 'confirm' | 'done'
  aiResult: null,
  mediaReady: false,    // True only when ALL uploads fully loaded
  apiKey: '',           // Anthropic API key
};

// Playback state
let animId = null;
let slideStartTime = 0;

// AI state
let aiPreview = null;

// Media loading counters
let _pendingLoad = 0;
let _failedNames = [];

// Load API key from localStorage
try {
  const savedKey = localStorage.getItem(LS_API_KEY);
  if (savedKey) S.apiKey = savedKey;
} catch (e) {}
