/**
 * timeline.js — 時間軸管理（拖曳排序、新增、刪除、移動端長按）
 */

let _longPressTimer = null;
let _longPressTarget = null;

function updateTL() {
  const sc = $('tls');
  const addLabel = sc.querySelector('.tl-add-label');
  sc.querySelectorAll('.tl-item').forEach(e => e.remove());

  S.slides.forEach((sl, i) => {
    const d = document.createElement('div');
    d.className = 'tl-item' + (i === S.cur ? ' active' : '');
    d.onclick = () => { S.cur = i; drawCurrent(); updateTL(); refreshAll(); };

    // Drag & drop reorder (desktop)
    d.draggable = true;
    d.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i); d.style.opacity = '.4'; });
    d.addEventListener('dragend', () => { d.style.opacity = '1'; });
    d.addEventListener('dragover', e => { e.preventDefault(); d.classList.add('drag-over'); });
    d.addEventListener('dragleave', () => d.classList.remove('drag-over'));
    d.addEventListener('drop', e => {
      e.preventDefault(); d.classList.remove('drag-over');
      const from = +e.dataTransfer.getData('text/plain');
      if (from === i) return;
      saveHistory();
      const [moved] = S.slides.splice(from, 1);
      S.slides.splice(i, 0, moved);
      if (S.cur === from) S.cur = i;
      onSlidesChanged();
    });

    // Mobile: long press to delete
    d.addEventListener('touchstart', e => {
      _longPressTarget = i;
      _longPressTimer = setTimeout(async () => {
        const ok = await showConfirm(`刪除第 ${i + 1} 張？`, '🗑');
        if (ok) deleteSlide(i);
        _longPressTarget = null;
      }, 600);
    }, { passive: true });
    d.addEventListener('touchend', () => { clearTimeout(_longPressTimer); _longPressTarget = null; });
    d.addEventListener('touchmove', () => { clearTimeout(_longPressTimer); _longPressTarget = null; });

    const vb = sl.type === 'video' ? '<span class="tl-vbadge">🎬</span>' : '';
    const capB = sl.caption ? '<span class="tl-cap">✏️</span>' : '';
    const filterB = sl.filterId && sl.filterId !== 'none' ? '<span class="tl-filter">🎨</span>' : '';
    const thumbSrc = sl.thumb || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    d.innerHTML = `<img src="${thumbSrc}" alt="slide ${i+1}"><span class="tl-badge">${i + 1}</span>${vb}${capB}${filterB}<button class="tl-del" onclick="event.stopPropagation();deleteSlide(${i})" aria-label="刪除">✕</button>`;
    sc.insertBefore(d, addLabel);
  });

  if (S.slides.length) $('slideCtr').textContent = `${S.cur + 1} / ${S.slides.length}`;
}

function deleteSlide(i) {
  saveHistory();
  if (S.slides[i]?.type === 'video' && S.slides[i].el) S.slides[i].el.pause();
  S.slides.splice(i, 1);
  if (S.cur >= S.slides.length) S.cur = Math.max(0, S.slides.length - 1);
  onSlidesChanged();
  toast('🗑 已刪除');
}

function shuffleSlides() {
  if (S.slides.length < 2) return;
  saveHistory();
  for (let i = S.slides.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [S.slides[i], S.slides[j]] = [S.slides[j], S.slides[i]];
  }
  S.cur = 0;
  onSlidesChanged();
  toast('🔀 已隨機排序');
}

function reverseSlides() {
  if (S.slides.length < 2) return;
  saveHistory();
  S.slides.reverse();
  S.cur = 0;
  onSlidesChanged();
  toast('↕ 已反轉順序');
}

async function clearAll() {
  if (!S.slides.length) return;
  const ok = await showConfirm('確定清除所有媒體？此操作可復原。', '🗑');
  if (!ok) return;
  saveHistory();
  stopPlay();
  S.slides = []; S.cur = 0;
  S.aiDone = false; S.aiPhase = null; S.aiResult = null;
  aiPreview = null; S.mediaReady = false;
  _pendingLoad = 0; _failedNames = [];
  onSlidesChanged();
  toast('已清除所有媒體');
}
