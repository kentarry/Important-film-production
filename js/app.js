/**
 * app.js — 應用初始化、事件綁定、設定面板
 */

// ── Settings Modal ──
function openSettings() {
  $('settingsModal').classList.add('show');
  const keyInput = $('apiKeyInput');
  keyInput.value = S.apiKey || '';
  updateKeyStatus();
}

function closeSettings() {
  $('settingsModal').classList.remove('show');
}

function saveApiKey() {
  const key = $('apiKeyInput').value.trim();
  S.apiKey = key;
  try { localStorage.setItem(LS_API_KEY, key); } catch (e) {}
  updateKeyStatus();
  updateAIBtnState();
  refreshAll();
  toast(key ? '✅ API Key 已儲存' : 'API Key 已清除');
}

function updateKeyStatus() {
  const hasKey = !!S.apiKey;
  $('keyDot').className = 'key-dot ' + (hasKey ? 'ok' : 'no');
  $('keyStatusText').textContent = hasKey ? `已設定 (${S.apiKey.slice(0, 8)}...)` : '未設定';
}

async function testApiKey() {
  const key = $('apiKeyInput').value.trim();
  if (!key) { toast('請先輸入 API Key'); return; }
  $('testKeyBtn').disabled = true;
  $('testKeyBtn').textContent = '測試中...';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    if (r.ok) {
      toast('✅ API Key 有效！');
      S.apiKey = key;
      try { localStorage.setItem(LS_API_KEY, key); } catch (e) {}
      updateKeyStatus();
    } else if (r.status === 401) {
      toast('❌ API Key 無效');
    } else {
      toast(`⚠️ 伺服器回應 ${r.status}，但 Key 格式可能正確`);
    }
  } catch (e) {
    toast('❌ 連線失敗：' + e.message);
  }
  $('testKeyBtn').disabled = false;
  $('testKeyBtn').textContent = '🔍 測試';
}

// ── Drawer Swipe Gesture (Mobile) ──
let _drawerStartY = 0, _drawerCurrentY = 0, _drawerSwiping = false;
function initDrawerGesture() {
  const handle = document.querySelector('.drawer-handle');
  const drawer = $('drawer');
  if (!handle || !drawer) return;

  handle.addEventListener('touchstart', e => {
    _drawerStartY = e.touches[0].clientY;
    _drawerSwiping = true;
    drawer.style.transition = 'none';
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!_drawerSwiping) return;
    _drawerCurrentY = e.touches[0].clientY;
    const diff = _drawerCurrentY - _drawerStartY;
    if (diff > 0) {
      drawer.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!_drawerSwiping) return;
    _drawerSwiping = false;
    drawer.style.transition = '';
    const diff = _drawerCurrentY - _drawerStartY;
    if (diff > 80) {
      closeDrawer();
    } else {
      drawer.style.transform = '';
      if (drawer.classList.contains('show')) {
        drawer.style.transform = 'translateY(0)';
      }
    }
    drawer.style.transform = '';
  });
}

// ── Progress Bar Drag ──
function initProgDrag() {
  const wrap = $('progWrap');
  let dragging = false;

  function seek(e) {
    if (!S.slides.length) return;
    const r = wrap.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const t = calcTotal();
    let tg = p * t, a = 0;
    for (let i = 0; i < S.slides.length; i++) {
      const d = getSDur(S.slides[i]);
      if (a + d >= tg) { S.cur = i; break; }
      a += d;
    }
    stopPlay(); drawCurrent(); updateTL(); updateTimeLabel(); refreshAll();
  }

  wrap.addEventListener('mousedown', e => { dragging = true; seek(e); });
  document.addEventListener('mousemove', e => { if (dragging) seek(e); });
  document.addEventListener('mouseup', () => { dragging = false; });
  wrap.addEventListener('touchstart', e => { dragging = true; seek(e); }, { passive: true });
  document.addEventListener('touchmove', e => { if (dragging) seek(e); }, { passive: true });
  document.addEventListener('touchend', () => { dragging = false; });
}

// ── Drag & Drop on preview area ──
$('preview').addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
$('preview').addEventListener('drop', e => { e.preventDefault(); handleMedia(e.dataTransfer.files); });

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'ArrowLeft') prevSlide();
  else if (e.key === 'ArrowRight') nextSlide();
  else if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
});

// ── Leave page warning ──
window.addEventListener('beforeunload', e => {
  if (S.slides.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ── Initialize ──
initDrawerGesture();
initProgDrag();
sideGo('ai');
drawCurrent();
updateTL();
updateTimeLabel();

console.log('✦ Memories AI 回憶影片製作器 v2.0 initialized');
