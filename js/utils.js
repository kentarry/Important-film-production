/**
 * utils.js — 共用工具函式
 */

const $ = id => document.getElementById(id);

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function easeIO(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function toast(msg) {
  const e = $('toast');
  e.textContent = msg;
  e.classList.add('show');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove('show'), 2800);
}

function saveHistory() {
  S.history.push({ slides: S.slides.map(s => ({ ...s })), cur: S.cur });
  if (S.history.length > 30) S.history.shift();
}

function undo() {
  if (!S.history.length) { toast('沒有可復原的操作'); return; }
  const h = S.history.pop();
  S.slides = h.slides;
  S.cur = h.cur;
  onSlidesChanged(true);
  toast('↩ 已復原');
}

/** Pick evenly-spaced sample from array */
function pickSample(a, n) {
  if (a.length <= n) return [...a];
  const r = [a[0]];
  const s = (a.length - 1) / (n - 1);
  for (let i = 1; i < n - 1; i++) r.push(a[Math.round(i * s)]);
  r.push(a[a.length - 1]);
  return r;
}

/** Convert Image element to base64 JPEG */
function imgToB64(img, max) {
  return new Promise((ok, no) => {
    try {
      const c = document.createElement('canvas');
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) { no(new Error('image has no dimensions')); return; }
      if (w > max) { h = Math.round(h * max / w); w = max; }
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      ok(c.toDataURL('image/jpeg', 0.7).split(',')[1]);
    } catch (e) { no(e); }
  });
}

/** Extract current frame from Video element as base64 JPEG */
function videoFrameToB64(vid, max) {
  return new Promise((ok, no) => {
    try {
      const c = document.createElement('canvas');
      let w = vid.videoWidth, h = vid.videoHeight;
      if (!w || !h) { no(new Error('video has no dimensions')); return; }
      if (w > max) { h = Math.round(h * max / w); w = max; }
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(vid, 0, 0, w, h);
      ok(c.toDataURL('image/jpeg', 0.7).split(',')[1]);
    } catch (e) { no(e); }
  });
}

/** Custom confirm dialog (replaces native confirm) */
function showConfirm(msg, icon) {
  return new Promise(ok => {
    const bg = $('confirmBg');
    $('confirmIcon').textContent = icon || '⚠️';
    $('confirmMsg').textContent = msg;
    bg.classList.add('show');
    $('confirmYes').onclick = () => { bg.classList.remove('show'); ok(true); };
    $('confirmNo').onclick = () => { bg.classList.remove('show'); ok(false); };
  });
}

/** Save project to localStorage (auto-save) */
function autoSave() {
  try {
    const data = {
      theme: S.theme, transition: S.transition, slideDur: S.slideDur,
      transitionDur: S.transitionDur, introTitle: S.introTitle, introSub: S.introSub,
      outroTitle: S.outroTitle, outroSub: S.outroSub, textFont: S.textFont,
      textAnim: S.textAnim, musicVol: S.musicVol, resolution: S.resolution,
      slideMeta: S.slides.map(s => ({
        caption: s.caption, textPos: s.textPos, filterId: s.filterId || 'none',
        filter: s.filter, customDur: s.customDur, fileName: s.fileName,
      })),
    };
    localStorage.setItem(LS_PROJECT, JSON.stringify(data));
  } catch (e) {}
}
let _autoSaveTimer = null;
function scheduleAutoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(autoSave, 2000);
}

/** Apply filter to a slide */
function applyFilter(i, fid) {
  const ft = FILTERS.find(f => f.id === fid);
  if (!ft || !S.slides[i]) return;
  S.slides[i].filterId = fid;
  S.slides[i].filter = { ...ft.vals };
  drawCurrent(); refreshAll(); scheduleAutoSave();
}

/** Apply filter to all slides */
function applyFilterAll(fid) {
  const ft = FILTERS.find(f => f.id === fid);
  if (!ft) return;
  saveHistory();
  S.slides.forEach(s => { s.filterId = fid; s.filter = { ...ft.vals }; });
  drawCurrent(); refreshAll(); scheduleAutoSave();
  toast('✅ 已套用「' + ft.name + '」到全部');
}
