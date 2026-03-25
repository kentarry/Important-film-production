/**
 * canvas.js — Canvas 繪製引擎（轉場、文字疊加、Ken Burns 效果、濾鏡）
 * 完整 22 種轉場 + 8 種濾鏡
 */

const cvs = $('cvs');
const ctx = cvs.getContext('2d');

function drawCurrent() {
  if (!S.slides.length) { ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, 1280, 720); return; }
  renderSlide(S.slides[S.cur], ctx, 1280, 720, 1, null);
}

function renderSlide(sl, c, w, h, prog, prev) {
  c.fillStyle = '#09090b';
  c.fillRect(0, 0, w, h);
  if (!sl?.el) return;

  const kb = 1 + 0.04 * prog;
  const td = S.transitionDur / getSDur(sl);

  if (prev?.el && prog < td) {
    const t = easeIO(prog / td);
    drawMediaFit(c, prev.el, w, h, prev.filter);
    applyTrans(c, w, h, t, sl.el, kb, sl.filter);
  } else {
    c.save();
    c.translate(w / 2, h / 2); c.scale(kb, kb); c.translate(-w / 2, -h / 2);
    drawMediaFit(c, sl.el, w, h, sl.filter);
    c.restore();
  }
  drawText(c, sl, w, h, prog);
}

/** Draw media fitted to canvas with cover crop + filter */
function drawMediaFit(c, el, w, h, f) {
  const ew = el.videoWidth || el.naturalWidth || el.width;
  const eh = el.videoHeight || el.naturalHeight || el.height;
  if (!ew || !eh) return;
  const ar = ew / eh, cr = w / h;
  let sx, sy, sw, sh;
  if (ar > cr) { sh = eh; sw = eh * cr; sx = (ew - sw) / 2; sy = 0; }
  else { sw = ew; sh = ew / cr; sx = 0; sy = (eh - sh) / 2; }
  if (f) {
    c.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%)${f.sepia ? ` sepia(${f.sepia}%)` : ''}`;
  }
  try { c.drawImage(el, sx, sy, sw, sh, 0, 0, w, h); } catch (e) {}
  c.filter = 'none';
}

/** Apply transition effect — all 22 effects */
function applyTrans(c, w, h, t, el, s, f) {
  const T = S.transition;
  const dr = () => drawMediaFit(c, el, w, h, f);
  const cn = v => { c.translate(w / 2, h / 2); c.scale(v, v); c.translate(-w / 2, -h / 2); };

  switch (T) {
    case 'fade':
      c.globalAlpha = t; c.save(); cn(s); dr(); c.restore(); c.globalAlpha = 1; break;
    case 'zoom-in':
      c.globalAlpha = t; c.save(); cn((0.5 + 0.5 * t) * s); dr(); c.restore(); c.globalAlpha = 1; break;
    case 'zoom-out':
      c.globalAlpha = t; c.save(); cn((1.5 - 0.5 * t) * s); dr(); c.restore(); c.globalAlpha = 1; break;
    case 'slide-left':
      c.save(); c.translate(w * (1 - t), 0); cn(s); dr(); c.restore(); break;
    case 'slide-right':
      c.save(); c.translate(-w * (1 - t), 0); cn(s); dr(); c.restore(); break;
    case 'slide-up':
      c.save(); c.translate(0, h * (1 - t)); cn(s); dr(); c.restore(); break;
    case 'slide-down':
      c.save(); c.translate(0, -h * (1 - t)); cn(s); dr(); c.restore(); break;
    case 'blur':
      c.globalAlpha = t; c.filter = `blur(${(1 - t) * 14}px)`;
      c.save(); cn(s); dr(); c.restore(); c.filter = 'none'; c.globalAlpha = 1; break;
    case 'wipe-h':
      c.save(); c.beginPath(); c.rect(0, 0, w * t, h); c.clip(); cn(s); dr(); c.restore(); break;
    case 'wipe-v':
      c.save(); c.beginPath(); c.rect(0, 0, w, h * t); c.clip(); cn(s); dr(); c.restore(); break;
    case 'wipe-diag': {
      c.save(); c.beginPath();
      const d = Math.hypot(w, h) * t;
      c.moveTo(-d * .2, -d * .2); c.lineTo(d * 1.5, -d * .2);
      c.lineTo(d * 1.5, d * 1.5); c.lineTo(-d * .2, d * 1.5);
      c.closePath(); c.clip(); cn(s); dr(); c.restore(); break;
    }
    case 'dissolve':
      c.globalAlpha = t; c.save(); cn(s); dr(); c.restore(); c.globalAlpha = 1; break;
    case 'rotate':
      c.save(); c.globalAlpha = t; c.translate(w / 2, h / 2);
      c.rotate((1 - t) * 0.25); c.scale(s * (0.7 + 0.3 * t), s * (0.7 + 0.3 * t));
      c.translate(-w / 2, -h / 2); dr(); c.restore(); c.globalAlpha = 1; break;
    case 'flip':
      c.save(); c.globalAlpha = t; c.translate(w / 2, h / 2);
      c.scale(s * Math.max(0.01, t), s); c.translate(-w / 2, -h / 2);
      dr(); c.restore(); c.globalAlpha = 1; break;
    case 'diamond': {
      c.save(); const r = Math.max(w, h) * t * 0.9;
      c.beginPath(); c.moveTo(w / 2, h / 2 - r); c.lineTo(w / 2 + r, h / 2);
      c.lineTo(w / 2, h / 2 + r); c.lineTo(w / 2 - r, h / 2); c.closePath(); c.clip();
      cn(s); dr(); c.restore(); break;
    }
    case 'circle':
      c.save(); c.beginPath(); c.arc(w / 2, h / 2, Math.max(w, h) * t * 0.8, 0, Math.PI * 2);
      c.clip(); cn(s); dr(); c.restore(); break;
    case 'heart': {
      c.save(); const sz = Math.max(w, h) * t;
      c.translate(w / 2, h / 2); c.beginPath();
      for (let i = 0; i < 360; i++) {
        const a = i * Math.PI / 180;
        const r = sz * 0.4 * (1 - Math.sin(a));
        c.lineTo(r * Math.sin(a), -r * Math.cos(a));
      }
      c.closePath(); c.clip(); c.translate(-w / 2, -h / 2);
      cn(s); dr(); c.restore(); break;
    }
    case 'crosszoom':
      c.globalAlpha = t < 0.5 ? t * 2 : 1;
      c.save(); cn(s * (t < 0.5 ? 1 + t * 2 : 3 - t * 2)); dr(); c.restore();
      c.globalAlpha = 1; break;
    case 'flash':
      c.save(); cn(s); dr(); c.restore();
      c.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - t * 3)})`;
      c.fillRect(0, 0, w, h); break;
    case 'pixelate': {
      c.save();
      const ps = Math.max(1, Math.round((1 - t) * 30));
      const tc = document.createElement('canvas');
      tc.width = Math.ceil(w / ps); tc.height = Math.ceil(h / ps);
      tc.getContext('2d').drawImage(el, 0, 0, tc.width, tc.height);
      c.imageSmoothingEnabled = false;
      c.drawImage(tc, 0, 0, tc.width, tc.height, 0, 0, w, h);
      c.imageSmoothingEnabled = true;
      c.globalAlpha = t; cn(s); dr(); c.globalAlpha = 1;
      c.restore(); break;
    }
    case 'blinds-h': {
      c.save(); const n = 8; c.beginPath();
      for (let i = 0; i < n; i++) { const y = i * h / n; c.rect(0, y, w, h / n * t); }
      c.clip(); cn(s); dr(); c.restore(); break;
    }
    case 'blinds-v': {
      c.save(); const n2 = 10; c.beginPath();
      for (let i = 0; i < n2; i++) { const x = i * w / n2; c.rect(x, 0, w / n2 * t, h); }
      c.clip(); cn(s); dr(); c.restore(); break;
    }
    default:
      c.globalAlpha = t; c.save(); cn(s); dr(); c.restore(); c.globalAlpha = 1;
  }
}

/** Draw text overlay (intro/outro/captions) */
function drawText(c, sl, w, h, prog) {
  const idx = S.slides.indexOf(sl);
  const isF = idx === 0 && S.introTitle;
  const isL = idx === S.slides.length - 1 && S.outroTitle;
  let main = '', sub = '', pos = sl.textPos || 'bottom';

  if (isF) { main = S.introTitle; sub = S.introSub; pos = 'center'; }
  else if (isL) { main = S.outroTitle; sub = S.outroSub; pos = 'center'; }
  else if (sl.caption) { main = sl.caption; }
  else return;

  let a = 1, oY = 0, sc = 1;
  const ap = Math.min(prog / 0.3, 1);
  if (S.textAnim === 'fade') a = easeIO(ap);
  else if (S.textAnim === 'rise') { a = easeIO(ap); oY = (1 - ap) * 20; }
  else if (S.textAnim === 'scale') { a = easeIO(ap); sc = 0.8 + 0.2 * easeIO(ap); }

  if (pos === 'top') {
    const g = c.createLinearGradient(0, 0, 0, h * 0.45);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  } else if (pos === 'center') {
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(0, 0, w, h);
  } else {
    const g = c.createLinearGradient(0, h * 0.5, 0, h);
    g.addColorStop(0, 'transparent'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }

  const ty = pos === 'top' ? h * 0.17 : pos === 'center' ? h * 0.46 : h * 0.83;
  const font = FONTS.find(f => f.id === S.textFont)?.family || "'Playfair Display', serif";

  c.save();
  c.globalAlpha = a;
  c.translate(w / 2, ty + oY);
  c.scale(sc, sc);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 16;
  c.fillStyle = '#fff';
  c.font = `600 ${Math.round(w * 0.042)}px ${font}`;
  c.fillText(main, 0, 0);
  if (sub) {
    c.font = `300 ${Math.round(w * 0.02)}px ${font}`;
    c.fillStyle = 'rgba(255,255,255,.8)';
    c.fillText(sub, 0, w * 0.05);
  }
  c.restore();
  c.shadowBlur = 0;
}
