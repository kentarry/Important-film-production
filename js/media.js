/**
 * media.js — 媒體上傳、載入、驗證
 * Uses FileReader → dataURL for maximum sandbox compatibility
 */

function handleMedia(files) {
  if (!files || !files.length) return;
  saveHistory();
  S.mediaReady = false;
  _pendingLoad += files.length;
  updateAIBtnState();

  Array.from(files).forEach(file => {
    const isV = file.type.startsWith('video/');
    const isI = file.type.startsWith('image/');
    if (!isV && !isI) {
      _pendingLoad--;
      _failedNames.push(file.name);
      finishOne();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const sl = {
        id: Date.now() + Math.random(),
        type: isV ? 'video' : 'image',
        src: dataUrl,
        thumb: '',
        el: null,
        caption: '',
        textPos: 'bottom',
        duration: S.slideDur,
        customDur: null,  // per-slide custom duration (null=use global)
        fileName: file.name,
        filterId: 'none',
        filter: { brightness: 100, contrast: 100, saturate: 100, sepia: 0 },
        _loaded: false,
      };

      if (isI) {
        const img = new Image();
        img.onload = () => {
          sl.el = img; sl.thumb = dataUrl; sl._loaded = true;
          S.slides.push(sl); _pendingLoad--;
          finishOne();
        };
        img.onerror = () => { _pendingLoad--; _failedNames.push(file.name); finishOne(); };
        img.src = dataUrl;
      } else {
        const vid = document.createElement('video');
        vid.muted = true; vid.preload = 'auto'; vid.playsInline = true;
        vid.setAttribute('crossorigin', 'anonymous');
        $('hiddenMedia').appendChild(vid);

        let done = false;
        const finish = (ok) => {
          if (done) return; done = true;
          if (ok) { sl._loaded = true; S.slides.push(sl); _pendingLoad--; finishOne(); }
          else { _pendingLoad--; _failedNames.push(file.name); finishOne(); }
        };

        vid.onloadedmetadata = () => {
          sl.el = vid; sl.duration = vid.duration;
          vid.currentTime = Math.min(1, vid.duration * 0.3);
        };
        vid.onseeked = () => {
          try {
            const c = document.createElement('canvas');
            c.width = 160; c.height = 90;
            c.getContext('2d').drawImage(vid, 0, 0, 160, 90);
            sl.thumb = c.toDataURL('image/jpeg', 0.6);
          } catch (e) {
            sl.thumb = '';
          }
          finish(true);
        };
        vid.onerror = () => finish(false);
        setTimeout(() => finish(false), 20000);
        vid.src = dataUrl;
      }
    };
    reader.onerror = () => { _pendingLoad--; _failedNames.push(file.name); finishOne(); };
    reader.readAsDataURL(file);
  });
}

function finishOne() {
  $('onboard').style.display = S.slides.length ? 'none' : 'flex';
  $('slideCtr').style.display = S.slides.length ? 'block' : 'none';
  $('aiBtn').style.display = S.slides.length ? 'inline-flex' : 'none';
  if (S.slides.length && S.cur >= S.slides.length) S.cur = S.slides.length - 1;
  refreshAll(); drawCurrent();

  if (_pendingLoad > 0) {
    toast(`載入中... 還有 ${_pendingLoad} 個檔案`);
    return;
  }
  S.mediaReady = true;
  updateAIBtnState();
  const ok = S.slides.filter(s => s._loaded).length;
  const fails = [..._failedNames]; _failedNames = [];
  if (fails.length && ok > 0) toast(`✅ 已載入 ${ok} 個，${fails.length} 個失敗`);
  else if (fails.length && !ok) toast('❌ 檔案載入失敗，請確認格式是否為 JPG/PNG/MP4 等');
  else if (ok) toast(`✅ 全部 ${ok} 個媒體載入完成`);
  scheduleAutoSave();
}

function updateAIBtnState() {
  const btn = $('aiBtn');
  const ready = S.mediaReady && S.slides.length > 0 && S.slides.every(s => s._loaded);
  btn.disabled = !ready;
}

function handleMusicFile(files) {
  const f = files[0]; if (!f) return;
  if (S.musicFile?.audioEl) { S.musicFile.audioEl.pause(); S.musicFile.audioEl.src = ''; }
  const url = URL.createObjectURL(f);
  const a = new Audio(url); a.loop = true; a.volume = S.musicVol;
  S.musicFile = { name: f.name, src: url, audioEl: a };
  toast('🎵 已載入：' + f.name);
  refreshAll(); scheduleAutoSave();
}

function onSlidesChanged(noRefresh) {
  $('onboard').style.display = S.slides.length ? 'none' : 'flex';
  $('slideCtr').style.display = S.slides.length ? 'block' : 'none';
  $('aiBtn').style.display = S.slides.length ? 'inline-flex' : 'none';
  if (S.slides.length && S.cur >= S.slides.length) S.cur = S.slides.length - 1;
  updateAIBtnState();
  if (!noRefresh) refreshAll();
  drawCurrent();
  scheduleAutoSave();
}

function removeMusic() {
  if (S.musicFile?.audioEl) { S.musicFile.audioEl.pause(); S.musicFile.audioEl.src = ''; }
  S.musicFile = null;
  refreshAll(); scheduleAutoSave();
}
