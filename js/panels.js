/**
 * panels.js — 側邊面板 / 底部抽屜的 HTML 內容產生器
 * 含 AI、媒體、風格、文字、音樂、匯出 六大面板
 */

const P_TITLES = {
  ai: 'AI 智慧製作', media: '媒體管理', style: '風格與轉場',
  text: '文字設計', music: '背景音樂', export: '匯出影片',
};
let curPanel = 'ai';

function panelHTML(n) {
  const fns = { ai: aiPanel, media: mediaPanel, style: stylePanel, text: textPanel, music: musicPanel, export: exportPanel };
  return (fns[n] || aiPanel)();
}

// ── AI Panel ──
function aiPanel() {
  if (_pendingLoad > 0) {
    return `<div style="text-align:center;padding:20px 0"><div style="font-size:2em;margin-bottom:10px">⏳</div>
    <p class="fl" style="text-align:center;font-size:.9em;color:var(--txt2)">正在載入媒體... 還有 ${_pendingLoad} 個檔案</p>
    <div class="loading-bar"><div class="loading-bar-fill" style="width:50%"></div></div>
    <p class="fl" style="text-align:center">所有檔案載入完成後才能使用 AI 分析</p></div>`;
  }

  // Confirm phase
  if (S.aiPhase === 'confirm' && aiPreview) {
    const p = aiPreview.r1;
    const ce = { high: '🟢 高', medium: '🟡 中等', low: '🔴 低' }[p.confidence] || '🟡 未知';
    return `
<div style="text-align:center;padding:6px 0"><div style="font-size:1.5em">🔍</div><div style="font-size:.95em;color:var(--gold-l);font-family:'Playfair Display',serif;margin:6px 0">請確認場合是否正確</div></div>
<div class="info-card" style="border:1px solid rgba(212,168,83,.3)">
  <div style="font-size:1.1em;color:var(--gold-l);font-weight:500;margin-bottom:6px">${THEMES.find(t => t.id === p.theme)?.emoji || ''} AI 判斷：${esc(p.occasion)}</div>
  <div style="font-size:.75em;color:var(--txt3);margin-bottom:8px">信心程度：${ce}</div>
  <div style="font-size:.72em;color:var(--txt3);margin-bottom:6px">${esc(p.confidence_reason || '')}</div>
  <div style="font-size:.78em;color:var(--txt2);line-height:1.5;border-top:1px solid var(--s3);padding-top:8px;margin-top:4px">${esc(p.analysis || '')}</div>
</div>
${p.key_evidence?.length ? `<div class="ok-box">📌 關鍵證據：${p.key_evidence.map(e => esc(e)).join('、')}</div>` : ''}
${p.warnings?.length ? `<div class="warn-box">⚠️ 注意：${p.warnings.map(w => esc(w)).join(' / ')}</div>` : ''}
${p.confidence === 'low' ? `<div class="warn-box">⚠️ AI 信心程度較低，強烈建議您手動確認場合再繼續</div>` : ''}
${p.alternative_occasions?.length ? `<p class="fl">AI 也考慮了：${p.alternative_occasions.map(a => esc(a)).join('、')}</p>` : ''}
<div class="fd"></div>
<p class="fl" style="font-size:.85em;color:var(--txt2)">如果判斷正確，點擊確認；如果不對，請選擇正確場合：</p>
<div style="margin:12px 0"><button class="btn btn-ai" style="width:100%;justify-content:center;padding:12px" onclick="confirmAI('${p.theme}')">✓ 正確！開始生成「${THEMES.find(t => t.id === p.theme)?.name || p.occasion}」影片</button></div>
<p class="fl">或選擇正確的場合：</p>
<div class="g4 fg">${THEMES.map(t => `<div class="ocard ${p.theme === t.id ? 'on' : ''}" onclick="confirmAI('${t.id}')"><div class="oe">${t.emoji}</div><div class="ol">${t.name}</div></div>`).join('')}</div>
<div class="fd"></div>
<button class="btn" style="width:100%;justify-content:center" onclick="S.aiPhase=null;aiPreview=null;refreshAll()">← 取消，返回</button>`;
  }

  // Done phase
  if (S.aiPhase === 'done' && S.aiResult) {
    const r = S.aiResult;
    const tn = THEMES.find(t => t.id === r.theme)?.name || '';
    return `
<div style="text-align:center;padding:6px 0"><div style="font-size:1.5em">✨</div><div style="font-size:.95em;color:var(--green);font-family:'Playfair Display',serif;margin:6px 0">影片製作完成</div></div>
<div class="ok-box">✅ AI 已為「${esc(tn)}」場合生成完整影片。所有內容都可以在各分頁中手動修改。</div>
<div class="info-card">
  <div class="info-row"><span class="info-k">場合</span><span class="info-v">${THEMES.find(t => t.id === r.theme)?.emoji || ''} ${esc(tn)}</span></div>
  <div class="info-row"><span class="info-k">開場</span><span class="info-v">${esc(S.introTitle)}</span></div>
  <div class="info-row"><span class="info-k">結尾</span><span class="info-v">${esc(S.outroTitle)}</span></div>
  <div class="info-row"><span class="info-k">有文字的</span><span class="info-v">${S.slides.filter(s => s.caption).length} / ${S.slides.length} 張</span></div>
  <div class="info-row"><span class="info-k">濾鏡</span><span class="info-v">${S.slides.filter(s => s.filterId && s.filterId !== 'none').length} / ${S.slides.length} 張</span></div>
  ${r.musicSuggestion ? `<div class="info-row"><span class="info-k">建議音樂</span><span class="info-v">${esc(r.musicSuggestion)}</span></div>` : ''}
</div>
<button class="btn btn-ai" style="width:100%;justify-content:center;padding:10px;margin-bottom:8px" onclick="S.aiPhase=null;S.aiDone=false;runAI()">🔄 重新分析</button>
<p class="fl" style="text-align:center">提示：點擊上方 ▶ 播放預覽完整影片效果</p>`;
  }

  // Default
  const ready = S.mediaReady && S.slides.length > 0 && _pendingLoad === 0;
  const hasKey = !!getApiKey();
  return `
<div style="text-align:center;padding:10px 0"><div style="font-size:2.5em;margin-bottom:10px">🤖</div>
<div style="font-size:1em;color:var(--gold-l);font-family:'Playfair Display',serif;margin-bottom:6px">AI 智慧影片製作</div>
<p class="fl" style="text-align:center;max-width:300px;margin:0 auto 16px;line-height:1.6">
上傳照片後，AI 會：<br>1️⃣ 分析場合（婚禮/生日/畢業...）<br>2️⃣ 讓您確認場合是否正確<br>3️⃣ 自動生成標題、文字、風格<br>4️⃣ 全部都可以手動修改</p></div>
${!hasKey ? '<div class="warn-box">⚠️ 請先點擊右上角 ⚙️ 設定 API Key 才能使用 AI 功能</div>' : ''}
<button class="btn btn-ai" style="width:100%;justify-content:center;padding:14px;font-size:.9em" onclick="runAI()" ${!ready || !hasKey ? 'disabled' : ''}>${ready && hasKey ? '🤖 開始 AI 分析' : !hasKey ? '⚙️ 請先設定 API Key' : '⏳ 請先上傳並等待載入完成'}</button>
${!ready && S.slides.length ? `<p class="fl" style="text-align:center;margin-top:8px;color:var(--rose)">${_pendingLoad > 0 ? '檔案仍在載入中，請稍候' : '請等待載入完成'}</p>` : ''}
${!S.slides.length ? `<div class="fd"></div><label class="file-label as-upload">＋ 上傳照片 / 影片<input type="file" multiple accept="image/*,video/*" onchange="handleMedia(this.files);this.value=''"></label>` : ''}
<div class="fd"></div>
<p class="fl" style="text-align:center">已載入 <b style="color:var(--gold)">${S.slides.length}</b> 個媒體</p>`;
}

// ── Media Panel (with filters + per-slide duration) ──
function mediaPanel() {
  const sl = S.slides[S.cur];
  const curDur = sl ? (sl.customDur != null ? sl.customDur : '') : '';
  return `<label class="file-label as-upload">＋ 上傳照片或影片<input type="file" multiple accept="image/*,video/*" onchange="handleMedia(this.files);this.value=''"></label>
<p class="fl" style="margin-top:6px">已載入 <b style="color:var(--gold)">${S.slides.length}</b> 個${_pendingLoad > 0 ? ' (載入中...)' : ''}</p>
<div class="fd"></div>
<div class="fr" style="gap:4px;margin-bottom:14px">
  <button class="btn btn-sm" onclick="shuffleSlides()">🔀 隨機</button>
  <button class="btn btn-sm" onclick="reverseSlides()">↕ 反轉</button>
  <button class="btn btn-sm btn-danger" onclick="clearAll()">🗑 清除</button>
</div>
${S.slides.length ? `
<div class="sh">全局照片秒數</div>
<div class="fg"><div class="rr"><input type="range" min="1" max="12" step=".5" value="${S.slideDur}" oninput="S.slideDur=+this.value;this.nextElementSibling.textContent=this.value+'s';updateTimeLabel();scheduleAutoSave()"><span class="rv">${S.slideDur}s</span></div></div>
<div class="sh">轉場時長</div>
<div class="fg"><div class="rr"><input type="range" min=".3" max="2" step=".1" value="${S.transitionDur}" oninput="S.transitionDur=+this.value;this.nextElementSibling.textContent=this.value+'s';scheduleAutoSave()"><span class="rv">${S.transitionDur}s</span></div></div>
${sl && sl.type !== 'video' ? `<div class="sh">第${S.cur+1}張獨立秒數 <span class="fl" style="margin:0;font-family:system-ui">(空=使用全局)</span></div>
<div class="fg"><div class="rr"><input type="number" class="fi" style="width:80px" min="1" max="30" step=".5" placeholder="${S.slideDur}" value="${curDur}" oninput="if(S.slides[S.cur]){S.slides[S.cur].customDur=this.value?+this.value:null;updateTimeLabel();scheduleAutoSave()}"><span class="rv">${sl.customDur ? sl.customDur + 's' : '全局'}</span></div></div>` : ''}
<div class="fd"></div>
<div class="sh">第${S.cur+1}張濾鏡 ${S.aiDone && sl?.filterId && sl.filterId !== 'none' ? '<span class="ai-badge">AI</span>' : ''}</div>
<div class="fr fg" style="gap:5px">${FILTERS.map(f => `<div class="chip ${sl?.filterId === f.id ? 'on' : ''}" onclick="applyFilter(${S.cur},'${f.id}')">${f.name}</div>`).join('')}</div>
<button class="btn btn-sm" style="margin-bottom:8px" onclick="applyFilterAll('${sl?.filterId || 'none'}')">🎨 套用到全部</button>` : ''}`;
}

// ── Style Panel ──
function stylePanel() {
  const cats = [...new Set(TRANSITIONS.map(t => t.cat))];
  return `<div class="sh">主題</div><div class="g4 fg">${THEMES.map(t =>
    `<div class="ocard ${S.theme === t.id ? 'on' : ''}" onclick="S.theme='${t.id}';refreshAll();scheduleAutoSave()"><div class="oe">${t.emoji}</div><div class="ol">${t.name}</div></div>`
  ).join('')}</div>
<div class="sh">轉場 (${TRANSITIONS.length})</div>${cats.map(cat =>
    `<p class="fl" style="margin-top:6px">${cat}</p><div class="fr fg" style="gap:5px">${TRANSITIONS.filter(t => t.cat === cat).map(t =>
      `<div class="chip ${S.transition === t.id ? 'on' : ''}" onclick="S.transition='${t.id}';refreshAll();scheduleAutoSave()">${t.name}</div>`
    ).join('')}</div>`
  ).join('')}`;
}

// ── Text Panel ──
function textPanel() {
  const sl = S.slides[S.cur], cap = sl?.caption || '', pos = sl?.textPos || 'bottom';
  return `<div class="sh">開場標題 ${S.aiDone ? '<span class="ai-badge">AI</span>' : ''}</div>
<div class="fg"><input class="fi" placeholder="主標題" value="${esc(S.introTitle)}" oninput="S.introTitle=this.value;drawCurrent();scheduleAutoSave()"></div>
<div class="fg"><input class="fi" placeholder="副標題" value="${esc(S.introSub)}" oninput="S.introSub=this.value;drawCurrent();scheduleAutoSave()"></div>
<div class="sh">結尾標題 ${S.aiDone ? '<span class="ai-badge">AI</span>' : ''}</div>
<div class="fg"><input class="fi" placeholder="主標題" value="${esc(S.outroTitle)}" oninput="S.outroTitle=this.value;drawCurrent();scheduleAutoSave()"></div>
<div class="fg"><input class="fi" placeholder="副標題" value="${esc(S.outroSub)}" oninput="S.outroSub=this.value;drawCurrent();scheduleAutoSave()"></div>
<div class="fd"></div>
<div class="sh">第${S.cur + 1}張 ${cap && S.aiDone ? '<span class="ai-badge">AI</span>' : ''}</div>
<div class="fg"><input class="fi" placeholder="文字說明..." value="${esc(cap)}" oninput="if(S.slides[S.cur])S.slides[S.cur].caption=this.value;drawCurrent();scheduleAutoSave()"></div>
<p class="fl">位置</p>
<div class="fr fg">${['top', 'center', 'bottom'].map(p =>
    `<div class="chip ${pos === p ? 'on' : ''}" onclick="if(S.slides[S.cur])S.slides[S.cur].textPos='${p}';refreshAll();drawCurrent();scheduleAutoSave()">${{ top: '頂部', center: '居中', bottom: '底部' }[p]}</div>`
  ).join('')}</div>
<div class="fd"></div>
<div class="sh">字體</div>
<div class="fr fg" style="gap:5px">${FONTS.map(f =>
    `<div class="chip ${S.textFont === f.id ? 'on' : ''}" onclick="S.textFont='${f.id}';refreshAll();drawCurrent();scheduleAutoSave()" style="font-family:${f.family}">${f.name}</div>`
  ).join('')}</div>
<div class="sh">動畫</div>
<div class="fr fg">${TEXT_ANIMS.map(a =>
    `<div class="chip ${S.textAnim === a.id ? 'on' : ''}" onclick="S.textAnim='${a.id}';refreshAll();scheduleAutoSave()">${a.name}</div>`
  ).join('')}</div>`;
}

// ── Music Panel ──
function musicPanel() {
  return `<div class="sh">背景音樂</div><p class="fl">上傳您喜歡的音樂</p>
${S.musicFile ? `<div class="mf"><div class="mf-i">🎵</div><div class="mf-info"><div class="mf-n">${esc(S.musicFile.name)}</div><div class="mf-d">播放時同步</div></div><button class="mf-x" onclick="removeMusic()">✕</button></div>` : ''}
<label class="file-label as-upload">🎵 ${S.musicFile ? '更換' : '選擇'}音樂<input type="file" accept="audio/*" onchange="handleMusicFile(this.files);this.value=''"></label>
<p class="fl" style="margin-top:6px">支援 MP3、WAV、AAC、OGG 格式</p>
${S.musicFile ? `<div class="fd"></div><div class="sh">音量</div><div class="fg"><div class="rr"><span style="font-size:.8em">🔈</span><input type="range" min="0" max="1" step=".05" value="${S.musicVol}" oninput="S.musicVol=+this.value;if(S.musicFile?.audioEl)S.musicFile.audioEl.volume=S.musicVol"><span style="font-size:.8em">🔊</span></div></div>` : ''}
${S.aiResult?.musicSuggestion ? `<div class="fd"></div><div class="ok-box">🤖 AI 建議音樂風格：${esc(S.aiResult.musicSuggestion)}</div>` : ''}`;
}

// ── Export Panel ──
function exportPanel() {
  const total = calcTotal(), m = Math.floor(total / 60), s = Math.round(total % 60);
  const est = Math.round(total * 1.2); // rough export time estimate
  const estM = Math.floor(est / 60), estS = est % 60;
  return `<div class="sh">影片資訊</div><div class="info-card">${[
    ['媒體', S.slides.length + '個'],
    ['時長', m + ':' + String(s).padStart(2, '0')],
    ['解析度', S.resolution === '1080' ? '1920×1080' : '1280×720'],
    ['音樂', S.musicFile ? esc(S.musicFile.name) : '無'],
    ['預估匯出時間', `約 ${estM ? estM + '分' : ''}${estS}秒`],
  ].map(([k, v]) => `<div class="info-row"><span class="info-k">${k}</span><span class="info-v">${v}</span></div>`).join('')}</div>
<div class="sh">解析度</div>
<div class="fr fg">
  <div class="chip ${S.resolution === '720' ? 'on' : ''}" onclick="S.resolution='720';refreshAll();scheduleAutoSave()">720p（較快）</div>
  <div class="chip ${S.resolution === '1080' ? 'on' : ''}" onclick="S.resolution='1080';refreshAll();scheduleAutoSave()">1080p（高畫質）</div>
</div>
<button class="btn btn-gold" style="width:100%;justify-content:center;padding:14px;font-size:.9em" onclick="startExport()" ${!S.slides.length ? 'disabled' : ''}>⬇ 匯出 WEBM 影片</button>
<p class="fl" style="margin-top:8px;text-align:center">影片將直接下載到您的裝置</p>
<div class="fd"></div>
<button class="btn" style="width:100%;justify-content:center" onclick="exportJSON()">📄 匯出 JSON 專案</button>
<p class="fl" style="margin-top:4px;text-align:center;font-size:.7em">匯出專案設定，可用於備份或分享</p>`;
}

// ── Panel Routing ──
function openDrawer(name) {
  curPanel = name;
  $('dTitle').textContent = P_TITLES[name];
  $('dBody').innerHTML = panelHTML(name);
  $('dBg').classList.add('show');
  $('drawer').classList.add('show');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.p === name));
}

function closeDrawer() {
  $('dBg').classList.remove('show');
  $('drawer').classList.remove('show');
}

function sideGo(name) {
  curPanel = name;
  document.querySelectorAll('.side-tab').forEach(b => b.classList.toggle('active', b.dataset.p === name));
  $('sideBody').innerHTML = panelHTML(name);
}

function refreshAll() {
  if (window.innerWidth >= 768) sideGo(curPanel);
  else if ($('drawer').classList.contains('show')) $('dBody').innerHTML = panelHTML(curPanel);
  updateTL();
  updateTimeLabel();
}
