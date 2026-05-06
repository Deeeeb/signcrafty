// --- State ---
let drawColor = '#1a1a2e';
let drawSize = 3;
let typeColor = '#1a1a2e';
let selectedFont = "'Dancing Script', cursive";
let isDrawing = false;
let paths = []; // for SVG export
let currentPath = [];
let hasDrawn = false;

// --- Canvas setup ---
const canvas = document.getElementById('sigCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '220px';
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  redrawPaths();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', endDraw);
canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(e); }, { passive: false });
canvas.addEventListener('touchend', endDraw);

function startDraw(e) {
  isDrawing = true;
  hasDrawn = true;
  document.getElementById('canvasHint').classList.add('hidden');
  const pos = getPos(e);
  currentPath = [{ x: pos.x, y: pos.y }];
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = drawSize;
}

function draw(e) {
  if (!isDrawing) return;
  const pos = getPos(e);
  currentPath.push({ x: pos.x, y: pos.y });
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.strokeStyle = drawColor;
  ctx.lineWidth = drawSize;
}

function endDraw() {
  if (!isDrawing) return;
  isDrawing = false;
  if (currentPath.length > 1) {
    paths.push({ points: [...currentPath], color: drawColor, size: drawSize });
  }
  currentPath = [];
}

function redrawPaths() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const path of paths) {
    if (path.points.length < 2) continue;
    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
  }
}

function clearCanvas() {
  paths = [];
  currentPath = [];
  hasDrawn = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('canvasHint').classList.remove('hidden');
  document.getElementById('dl-draw').classList.remove('visible');
}

function setColor(el) {
  drawColor = el.dataset.color;
  document.querySelectorAll('#panel-draw .color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

function setCustomColor(input) {
  drawColor = input.value;
  document.querySelectorAll('#panel-draw .color-swatch').forEach(s => s.classList.remove('active'));
}

function setSize(size, btn) {
  drawSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// --- Type panel ---
const fonts = [
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Pinyon Script', family: "'Pinyon Script', cursive" },
  { name: 'Parisienne', family: "'Parisienne', cursive" },
  { name: 'Playfair Italic', family: "'Playfair Display', serif", style: 'italic' },
];

const fontGrid = document.getElementById('fontGrid');
fonts.forEach((f, i) => {
  const sampleName = 'Signature';
  const el = document.createElement('div');
  el.className = 'font-option' + (i === 0 ? ' active' : '');
  el.innerHTML = `
    <div class="font-preview" style="font-family:${f.family};${f.style ? 'font-style:'+f.style : ''}">${sampleName}</div>
    <div class="font-name">${f.name}</div>
  `;
  el.onclick = () => {
    document.querySelectorAll('.font-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    selectedFont = f.family;
    const typedSig = document.getElementById('typedSig');
    typedSig.style.fontFamily = f.family;
    typedSig.style.fontStyle = f.style || 'normal';
  };
  fontGrid.appendChild(el);
});

function updateTypePreview() {
  const val = document.getElementById('typeInput').value;
  const el = document.getElementById('typedSig');
  el.textContent = val || 'Your Name';
}

function setTypeColor(el) {
  typeColor = el.dataset.color;
  document.querySelectorAll('#panel-type .color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('typedSig').style.color = typeColor;
}

function setTypeCustomColor(input) {
  typeColor = input.value;
  document.getElementById('typedSig').style.color = typeColor;
  document.querySelectorAll('#panel-type .color-swatch').forEach(s => s.classList.remove('active'));
}

// --- Tabs ---
function switchTab(name, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('dl-draw').classList.remove('visible');
  document.getElementById('dl-type').classList.remove('visible');
}

// --- Download ---
function showDownload(mode) {
  const dlId = 'dl-' + mode;
  const el = document.getElementById(dlId);
  el.classList.toggle('visible');
}

function downloadSig(mode, format) {
  if (mode === 'draw') downloadDraw(format);
  else downloadType(format);
}

function downloadDraw(format) {
  if (!hasDrawn) { showToast('Please draw your signature first!'); return; }

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  if (format === 'svg') {
    // Build SVG
    let svgPaths = '';
    for (const path of paths) {
      if (path.points.length < 2) continue;
      let d = `M ${path.points[0].x} ${path.points[0].y}`;
      for (let i = 1; i < path.points.length; i++) {
        d += ` L ${path.points[i].x} ${path.points[i].y}`;
      }
      svgPaths += `<path d="${d}" stroke="${path.color}" stroke-width="${path.size}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svgPaths}</svg>`;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    triggerDownload(URL.createObjectURL(blob), 'signature.svg');
    showToast('SVG downloaded!');
    return;
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;
  const octx = offscreen.getContext('2d');
  octx.scale(dpr, dpr);
  octx.lineCap = 'round';
  octx.lineJoin = 'round';

  if (format !== 'png-transparent') {
    octx.fillStyle = 'white';
    octx.fillRect(0, 0, w, h);
  }

  for (const path of paths) {
    if (path.points.length < 2) continue;
    octx.beginPath();
    octx.strokeStyle = path.color;
    octx.lineWidth = path.size;
    octx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      octx.lineTo(path.points[i].x, path.points[i].y);
    }
    octx.stroke();
  }

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpg' ? 'jpg' : 'png';
  offscreen.toBlob(blob => {
    triggerDownload(URL.createObjectURL(blob), `signature.${ext}`);
    showToast('Downloaded!');
  }, mime, 0.95);
}

function downloadType(format) {
  const el = document.getElementById('typedSig');
  const text = el.textContent;
  if (!text || text === 'Your Name') { showToast('Please type your name first!'); return; }

  const scale = 3;
  const offscreen = document.createElement('canvas');
  const fontSize = 80;
  offscreen.width = 800 * scale;
  offscreen.height = 200 * scale;
  const octx = offscreen.getContext('2d');
  octx.scale(scale, scale);

  if (format !== 'png-transparent') {
    octx.fillStyle = 'white';
    octx.fillRect(0, 0, 800, 200);
  }

  const fontStyle = el.style.fontStyle || 'normal';
  octx.font = `${fontStyle} ${fontSize}px ${selectedFont.replace(/'/g, '')}`;
  octx.fillStyle = typeColor;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillText(text, 400, 110);

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpg' ? 'jpg' : 'png';
  offscreen.toBlob(blob => {
    triggerDownload(URL.createObjectURL(blob), `signature.${ext}`);
    showToast('Downloaded!');
  }, mime, 0.95);
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
