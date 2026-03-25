/**
 * export.js — 影片匯出（MediaRecorder WEBM）與 JSON 專案匯出
 * 支持每張照片獨立時長
 */

let exRec = null;

async function startExport() {
  if (!S.slides.length) { toast('請先上傳媒體'); return; }
  if (S.exporting) return;
  S.exporting = true; S.exportCancel = false;
  stopPlay();

  const W = S.resolution === '1080' ? 1920 : 1280;
  const H = S.resolution === '1080' ? 1080 : 720;
  cvs.width = W; cvs.height = H;

  $('eo').classList.add('show');
  $('eoS').textContent = '準備中...';
  $('eoF').style.width = '0%';

  const stream = cvs.captureStream(30);

  // Attach audio if available
  let ac, as, ad;
  if (S.musicFile?.audioEl) {
    try {
      ac = new AudioContext();
      ad = ac.createMediaStreamDestination();
      try { S.musicFile.audioEl._s?.disconnect(); } catch (e) {}
      as = ac.createMediaElementSource(S.musicFile.audioEl);
      S.musicFile.audioEl._s = as;
      as.connect(ad); as.connect(ac.destination);
      ad.stream.getAudioTracks().forEach(t => stream.addTrack(t));
      S.musicFile.audioEl.currentTime = 0;
      S.musicFile.audioEl.volume = S.musicVol;
      S.musicFile.audioEl.muted = false;
      S.musicFile.audioEl.play().catch(() => {});
    } catch (e) { console.warn('Audio setup failed:', e); }
  }

  const mimes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  let mime = mimes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const chunks = [];

  exRec = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: S.resolution === '1080' ? 8e6 : 4e6,
  });
  exRec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  exRec.onstop = () => {
    if (S.musicFile?.audioEl) S.musicFile.audioEl.pause();
    ac?.close().catch(() => {});
    cvs.width = 1280; cvs.height = 720;
    drawCurrent();
    if (!S.exportCancel && chunks.length) {
      const b = new Blob(chunks, { type: mime });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `memories-${Date.now()}.webm`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(u);
      toast('✅ 匯出完成！影片已下載');
    }
    $('eo').classList.remove('show');
    S.exporting = false; exRec = null;
  };
  exRec.start(100);

  const td = calcTotal();
  let ci = 0, sS = performance.now();
  if (S.slides[0].type === 'video' && S.slides[0].el) {
    S.slides[0].el.muted = true; S.slides[0].el.currentTime = 0;
    S.slides[0].el.play().catch(() => {});
  }

  function ef() {
    if (S.exportCancel || !exRec || exRec.state === 'inactive') {
      if (exRec?.state !== 'inactive') exRec.stop(); return;
    }
    const now = performance.now(), sl = S.slides[ci];
    const dur = getSDur(sl) * 1000, el = now - sS;
    const prog = Math.min(el / dur, 1);
    const prev = el < S.transitionDur * 1000 && ci > 0 ? S.slides[ci - 1] : null;
    renderSlide(sl, ctx, W, H, prog, prev);

    let ge = 0;
    for (let i = 0; i < ci; i++) ge += getSDur(S.slides[i]);
    ge += el / 1000;
    $('eoF').style.width = Math.min(ge / td * 100, 100) + '%';
    $('eoS').textContent = `匯出中 ${Math.round(ge / td * 100)}%`;

    if (el >= dur) {
      if (sl.type === 'video' && sl.el) sl.el.pause();
      if (ci < S.slides.length - 1) {
        ci++; sS = now;
        if (S.slides[ci].type === 'video' && S.slides[ci].el) {
          S.slides[ci].el.muted = true; S.slides[ci].el.currentTime = 0;
          S.slides[ci].el.play().catch(() => {});
        }
      } else {
        setTimeout(() => { if (exRec?.state !== 'inactive') exRec.stop(); }, 300);
        return;
      }
    }
    requestAnimationFrame(ef);
  }
  requestAnimationFrame(ef);
}

function cancelExport() {
  S.exportCancel = true;
  if (exRec?.state !== 'inactive') exRec.stop();
  toast('已取消匯出');
}

function exportJSON() {
  const p = {
    version: '2.0',
    theme: S.theme,
    transition: S.transition,
    slideDuration: S.slideDur,
    transitionDuration: S.transitionDur,
    textFont: S.textFont,
    textAnim: S.textAnim,
    introTitle: S.introTitle,
    introSub: S.introSub,
    outroTitle: S.outroTitle,
    outroSub: S.outroSub,
    musicFile: S.musicFile?.name || null,
    musicVol: S.musicVol,
    resolution: S.resolution,
    slides: S.slides.map((s, i) => ({
      index: i + 1,
      type: s.type,
      fileName: s.fileName,
      caption: s.caption,
      textPos: s.textPos,
      filterId: s.filterId || 'none',
      customDur: s.customDur || null,
      duration: getSDur(s),
    })),
  };
  const b = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = `memories-project-${Date.now()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(u);
  toast('📄 JSON 專案已下載');
}
