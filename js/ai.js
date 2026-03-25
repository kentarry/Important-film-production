/**
 * ai.js — AI 分析功能（兩階段確認機制）
 * Phase 1: 分析照片判斷場合 → 使用者確認
 * Phase 2: 生成標題、文字、風格設定（含濾鏡建議）
 */

function getApiKey() {
  return S.apiKey || '';
}

async function runAI() {
  if (!S.slides.length) { toast('請先上傳照片'); return; }
  if (!S.mediaReady || !S.slides.every(s => s._loaded)) {
    toast('⏳ 請等待所有檔案完成載入'); return;
  }
  if (!getApiKey()) {
    toast('⚠️ 請先在設定中輸入 API Key');
    openSettings();
    return;
  }

  S.aiCancel = false;
  $('aiOv').classList.add('show');
  $('aiOvTitle').textContent = 'AI 正在分析您的照片...';
  $('aiStep').textContent = '準備圖片數據...';
  $('aiProg').style.width = '0%';

  try {
    const visualSlides = [];
    for (let i = 0; i < S.slides.length; i++) {
      const sl = S.slides[i];
      if (sl.el) visualSlides.push({ idx: i, el: sl.el, type: sl.type });
    }
    if (!visualSlides.length) {
      toast('找不到可分析的媒體');
      $('aiOv').classList.remove('show');
      return;
    }

    const sample = visualSlides.length > 10 ? pickSample(visualSlides, 10) : visualSlides;
    const b64s = [];
    const sampleIdxs = [];

    for (let i = 0; i < sample.length; i++) {
      if (S.aiCancel) throw new Error('cancelled');
      $('aiStep').textContent = `處理媒體 ${i + 1}/${sample.length}...`;
      $('aiProg').style.width = ((i + 1) / sample.length * 30) + '%';
      try {
        const b64 = sample[i].type === 'image'
          ? await imgToB64(sample[i].el, 500)
          : await videoFrameToB64(sample[i].el, 500);
        if (b64 && b64.length > 200) {
          b64s.push(b64);
          sampleIdxs.push(sample[i].idx);
        }
      } catch (e) { console.warn('Frame extract failed:', e); }
    }

    if (!b64s.length) {
      toast('無法從媒體中提取影像');
      $('aiOv').classList.remove('show');
      return;
    }
    if (S.aiCancel) throw new Error('cancelled');

    $('aiStep').textContent = `🔍 AI 分析 ${b64s.length} 張影像中...`;
    $('aiProg').style.width = '40%';

    const imgs = b64s.map(b => ({
      type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b }
    }));
    const thOpts = THEMES.map(t => `${t.id}(${t.name})`).join(', ');

    const phase1Prompt = `你是頂級婚禮/活動影片製作公司的首席分析師，擁有20年分析照片場合的經驗。

【任務】精確判斷這組照片/影片是什麼場合。

【嚴重性提醒】
- 這些照片將被用於製作重要場合的回憶影片
- 判斷錯誤將導致嚴重後果：例如在追思會上播放生日風格影片
- 寧可說「不確定」也不要猜錯

【分析步驟】請依序執行：
1. 逐一描述每張照片中的關鍵元素（人物服裝、場景佈置、道具物品、表情動作、燈光色調）
2. 尋找跨照片的一致性線索（同一場地？同一套服裝？同一群人？）
3. 排除不可能的場合
4. 綜合判斷最可能的場合

【可選場合】: ${thOpts}
【媒體總數】: ${S.slides.length} 個（你看到 ${b64s.length} 張樣本，索引 ${sampleIdxs.map(i => '#' + (i + 1)).join(', ')}）

回傳**純JSON**（不要markdown）：
{
  "per_image_analysis": ["第1張：描述...", "第2張：描述..."],
  "cross_image_patterns": "跨照片一致性分析",
  "analysis": "綜合分析結論",
  "occasion": "判斷的場合名稱",
  "theme": "從可選場合中選最適合的id",
  "confidence": "high/medium/low",
  "confidence_reason": "信心程度原因",
  "key_evidence": ["關鍵證據1", "證據2", "證據3"],
  "ruled_out": ["排除的場合及原因"],
  "alternative_occasions": ["備選場合"],
  "warnings": ["風險提醒"]
}`;

    const r1 = await callAIWithRetry(
      [...imgs, { type: 'text', text: phase1Prompt }], 2000, 2
    );
    if (S.aiCancel) throw new Error('cancelled');
    const parsed1 = parseJSON(r1);

    if (!parsed1.theme || !THEMES.find(t => t.id === parsed1.theme)) {
      parsed1.theme = 'wedding';
      parsed1.warnings = (parsed1.warnings || []).concat(['無法確定主題，預設為婚禮，請手動確認']);
    }

    $('aiProg').style.width = '60%';
    aiPreview = { r1: parsed1, b64s, imgs, total: S.slides.length, sampleIdxs };
    S.aiPhase = 'confirm';
    $('aiOv').classList.remove('show');
    toast('🔍 分析完成 — 請確認場合是否正確');
    refreshAll();
    if (window.innerWidth >= 768) sideGo('ai'); else openDrawer('ai');

  } catch (e) {
    $('aiOv').classList.remove('show');
    if (e.message !== 'cancelled') {
      console.error('AI Phase 1 error:', e);
      toast('AI 分析失敗：' + e.message);
    }
  }
}

async function confirmAI(selectedTheme) {
  if (!aiPreview) return;
  const { r1, imgs, total, sampleIdxs } = aiPreview;
  const th = selectedTheme || r1.theme;
  const tn = THEMES.find(t => t.id === th)?.name || r1.occasion || '未知場合';

  S.aiCancel = false;
  $('aiOv').classList.add('show');
  $('aiOvTitle').textContent = '✍️ 正在為「' + tn + '」生成內容...';
  $('aiStep').textContent = 'AI 正在撰寫標題與文字...';
  $('aiProg').style.width = '65%';
  closeDrawer();

  try {
    const trOpts = TRANSITIONS.map(t => t.id).join(', ');
    const fnOpts = FONTS.map(f => `${f.id}(${f.name})`).join(', ');
    const filterOpts = FILTERS.map(f => f.id).join(', ');

    const phase2Prompt = `你是頂級影片製作師，正在為「${tn}」場合製作回憶影片。
場合分析：${r1.analysis}
${r1.per_image_analysis ? '逐張分析：' + JSON.stringify(r1.per_image_analysis) : ''}

【重要規則】
- 文字用繁體中文
- 語氣必須完美匹配「${tn}」場合（追思→莊重溫暖；婚禮→浪漫甜蜜；生日→歡樂祝福；畢業→勵志感恩）
- 開場/結尾標題要有儀式感，能打動觀眾
- 每張照片的 caption 8-20字，有看到照片內容的要具體描述，沒看到的用「${tn}」場合通用優美文字或空字串
- captions 陣列長度必須 = ${total}
- 你看到的索引：${sampleIdxs.map(i => '#' + (i + 1)).join(',')}
- 建議每張照片的濾鏡，讓整體風格一致

回傳**純JSON**：
{
  "introTitle":"開場主標題","introSub":"開場副標題",
  "outroTitle":"結尾主標題","outroSub":"結尾副標題",
  "transition":"從 ${trOpts} 選","font":"從 ${fnOpts} 選",
  "textAnim":"fade/rise/scale/none",
  "slideDuration":3.5,"transitionDuration":0.8,
  "captions":[${Array(total).fill('""').join(',')}],
  "captionPositions":[${Array(total).fill('"bottom"').join(',')}],
  "filters":[${Array(total).fill('"none"').join(',')}],
  "musicSuggestion":"建議音樂風格與具體歌曲推薦"
}
filters 從 ${filterOpts} 選。`;

    $('aiProg').style.width = '75%';
    const r2 = await callAIWithRetry(
      [...imgs, { type: 'text', text: phase2Prompt }], 3000, 2
    );
    if (S.aiCancel) throw new Error('cancelled');
    const parsed2 = parseJSON(r2);

    $('aiStep').textContent = '驗證並套用結果...';
    $('aiProg').style.width = '90%';
    saveHistory();

    S.theme = th;
    if (parsed2.transition && TRANSITIONS.find(t => t.id === parsed2.transition)) S.transition = parsed2.transition;
    if (parsed2.font && FONTS.find(f => f.id === parsed2.font)) S.textFont = parsed2.font;
    if (parsed2.textAnim && TEXT_ANIMS.find(a => a.id === parsed2.textAnim)) S.textAnim = parsed2.textAnim;
    if (parsed2.introTitle) S.introTitle = parsed2.introTitle;
    if (parsed2.introSub) S.introSub = parsed2.introSub;
    if (parsed2.outroTitle) S.outroTitle = parsed2.outroTitle;
    if (parsed2.outroSub) S.outroSub = parsed2.outroSub;
    if (+parsed2.slideDuration >= 1 && +parsed2.slideDuration <= 12) S.slideDur = +parsed2.slideDuration;
    if (+parsed2.transitionDuration >= 0.2 && +parsed2.transitionDuration <= 3) S.transitionDur = +parsed2.transitionDuration;

    if (Array.isArray(parsed2.captions)) {
      for (let i = 0; i < Math.min(parsed2.captions.length, S.slides.length); i++) {
        if (typeof parsed2.captions[i] === 'string') S.slides[i].caption = parsed2.captions[i];
      }
    }
    if (Array.isArray(parsed2.captionPositions)) {
      parsed2.captionPositions.forEach((p, i) => {
        if (S.slides[i] && ['top', 'center', 'bottom'].includes(p)) S.slides[i].textPos = p;
      });
    }
    if (Array.isArray(parsed2.filters)) {
      parsed2.filters.forEach((fid, i) => {
        const ft = FILTERS.find(f => f.id === fid);
        if (S.slides[i] && ft) { S.slides[i].filterId = fid; S.slides[i].filter = { ...ft.vals }; }
      });
    }

    $('aiProg').style.width = '100%';
    S.cur = 0; S.aiDone = true; S.aiPhase = 'done';
    S.aiResult = { r1, r2: parsed2, theme: th, musicSuggestion: parsed2.musicSuggestion };
    aiPreview = null;
    $('aiOv').classList.remove('show');
    toast('✨ 「' + tn + '」影片製作完成！所有文字與設定皆可手動修改');
    refreshAll(); drawCurrent(); scheduleAutoSave();

  } catch (e) {
    $('aiOv').classList.remove('show');
    if (e.message !== 'cancelled') {
      console.error('AI Phase 2 error:', e);
      toast('內容生成失敗：' + e.message);
    }
  }
}

/** API call with exponential backoff retry + API key */
async function callAIWithRetry(content, maxTok, retries) {
  const key = getApiKey();
  if (!key) throw new Error('請先設定 API Key');

  for (let attempt = 0; attempt <= retries; attempt++) {
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
          max_tokens: maxTok || 1500,
          messages: [{ role: 'user', content }],
        }),
      });
      if (!r.ok) {
        const errBody = await r.text().catch(() => '');
        if (r.status === 401) throw new Error('API Key 無效，請到設定中更新');
        if (attempt < retries && (r.status === 429 || r.status >= 500)) {
          $('aiStep').textContent = `伺服器忙碌，${(attempt + 1) * 3}秒後重試...`;
          await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
          continue;
        }
        throw new Error(`API 錯誤 (${r.status}): ${errBody.slice(0, 100)}`);
      }
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || 'API 回傳錯誤');
      if (!d.content?.length) throw new Error('AI 回傳空內容');
      return d;
    } catch (e) {
      if (e.message === 'cancelled') throw e;
      if (attempt < retries) {
        $('aiStep').textContent = `發生錯誤，${(attempt + 1) * 2}秒後重試...`;
        await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
      } else throw e;
    }
  }
}

function parseJSON(d) {
  const t = d.content.map(c => c.text || '').join('');
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI 回傳中找不到 JSON 資料');
  try { return JSON.parse(m[0]); } catch (e) {
    try { return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1').replace(/[\x00-\x1F]/g, '')); }
    catch (e2) { throw new Error('AI 回傳的 JSON 格式錯誤，請重試'); }
  }
}

function cancelAI() {
  S.aiCancel = true;
  $('aiOv').classList.remove('show');
}
