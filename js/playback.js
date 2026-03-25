/**
 * playback.js — 播放引擎（播放、暫停、上下張、進度條）
 * 支持每張照片獨立秒數
 */

function togglePlay() { S.playing ? stopPlay() : startPlay(); }

function toggleLoop() {
  S.loop = !S.loop;
  $('loopBtn').style.opacity = S.loop ? '1' : '.5';
  toast(S.loop ? '🔁 循環播放' : '➡️ 單次播放');
}

function startPlay() {
  if (!S.slides.length) return;
  S.playing = true;
  $('playIco').innerHTML = '<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>';
  slideStartTime = performance.now();

  const c = S.slides[S.cur];
  if (c.type === 'video' && c.el) { c.el.muted = S.muted; c.el.currentTime = 0; c.el.play().catch(() => {}); }
  if (S.musicFile?.audioEl) { S.musicFile.audioEl.volume = S.musicVol; S.musicFile.audioEl.muted = S.muted; S.musicFile.audioEl.play().catch(() => {}); }
  playLoop();
}

function stopPlay() {
  S.playing = false;
  $('playIco').innerHTML = '<polygon points="6,3 20,12 6,21"/>';
  cancelAnimationFrame(animId);
  S.slides.forEach(s => { if (s.type === 'video' && s.el) s.el.pause(); });
  if (S.musicFile?.audioEl) S.musicFile.audioEl.pause();
}

/** Get slide duration — respects per-slide customDur */
function getSDur(s) {
  if (s.type === 'video') return s.duration;
  if (s.customDur != null && s.customDur > 0) return s.customDur;
  return S.slideDur;
}

function calcTotal() { return S.slides.reduce((a, s) => a + getSDur(s), 0); }

function playLoop() {
  if (!S.playing) return;
  const now = performance.now();
  const sl = S.slides[S.cur];
  const dur = getSDur(sl) * 1000;
  const el = now - slideStartTime;
  const prog = Math.min(el / dur, 1);

  const prev = S.slides.length > 1 ? S.slides[(S.cur - 1 + S.slides.length) % S.slides.length] : null;
  renderSlide(sl, ctx, 1280, 720, prog, el < S.transitionDur * 1000 ? prev : null);
  updatePlayProg();

  if (el >= dur) {
    if (sl.type === 'video' && sl.el) sl.el.pause();
    if (S.cur < S.slides.length - 1) {
      S.cur++; slideStartTime = now;
      const nx = S.slides[S.cur];
      if (nx.type === 'video' && nx.el) { nx.el.muted = S.muted; nx.el.currentTime = 0; nx.el.play().catch(() => {}); }
      updateTL();
    } else if (S.loop) {
      S.cur = 0; slideStartTime = now; updateTL();
    } else {
      stopPlay(); drawCurrent(); return;
    }
  }
  animId = requestAnimationFrame(playLoop);
}

function updatePlayProg() {
  const t = calcTotal(); if (!t) return;
  let e = 0;
  for (let i = 0; i < S.cur; i++) e += getSDur(S.slides[i]);
  e += Math.min((performance.now() - slideStartTime) / 1000, getSDur(S.slides[S.cur]));
  $('progFill').style.width = (e / t * 100) + '%';
  const ce = Math.round(e), ct = Math.round(t);
  $('timeLbl').textContent = `${Math.floor(ce / 60)}:${String(ce % 60).padStart(2, '0')} / ${Math.floor(ct / 60)}:${String(ct % 60).padStart(2, '0')}`;
}

function updateTimeLabel() {
  const t = calcTotal();
  let e = 0;
  for (let i = 0; i < S.cur; i++) e += getSDur(S.slides[i]);
  const ce = Math.round(e), ct = Math.round(t);
  $('timeLbl').textContent = `${Math.floor(ce / 60)}:${String(ce % 60).padStart(2, '0')} / ${Math.floor(ct / 60)}:${String(ct % 60).padStart(2, '0')}`;
  $('progFill').style.width = t ? (e / t * 100) + '%' : '0%';
}

function prevSlide() {
  if (!S.slides.length) return; stopPlay();
  S.cur = (S.cur - 1 + S.slides.length) % S.slides.length;
  drawCurrent(); updateTL(); updateTimeLabel(); refreshAll();
}

function nextSlide() {
  if (!S.slides.length) return; stopPlay();
  S.cur = (S.cur + 1) % S.slides.length;
  drawCurrent(); updateTL(); updateTimeLabel(); refreshAll();
}

function toggleMute() {
  S.muted = !S.muted;
  $('muteBtn').textContent = S.muted ? '🔇' : '🔊';
  if (S.musicFile?.audioEl) S.musicFile.audioEl.muted = S.muted;
  S.slides.forEach(s => { if (s.type === 'video' && s.el) s.el.muted = S.muted; });
}

function toggleFS() {
  if (!document.fullscreenElement) $('preview').requestFullscreen?.();
  else document.exitFullscreen?.();
}
