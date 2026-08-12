import { DEFAULT_PHONEME_HINTS, type PhonemeHints } from "./exportFile";

export interface WordSearchWord {
  phonemes: string[];
  english?: string;
}

export interface WordSearchConfig {
  words: WordSearchWord[];
  rows?: number;
  cols?: number;
  showHints?: boolean;
  phonemeHints?: PhonemeHints;
}

export function generateWordSearchHTML(config: WordSearchConfig): string {
  const {
    words,
    rows = 10,
    cols = 10,
    showHints = true,
    phonemeHints = {},
  } = config;

  if (!Array.isArray(words) || words.length === 0) {
    throw new Error("generateWordSearchHTML: words must be a non-empty array");
  }

  const hintMap = { ...DEFAULT_PHONEME_HINTS, ...phonemeHints };

  const gameData = {
    words: words.map((w) => ({ phonemes: w.phonemes, english: w.english })),
    rows,
    cols,
    showHints,
    hintMap,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Phoneme Word Search</title>
<style>
  :root {
    --primary: #4338ca; --bg: #f8fafc; --text: #1e293b;
    --border: #cbd5e1; --highlight: #fef08a; --found: #bbf7d0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px 12px; }
  h1 { color: var(--primary); margin-bottom: 16px; }
  #wordsearchGrid {
    display: grid; background: white; padding: 12px; border-radius: 12px;
    border: 1px solid #e2e8f0; gap: 2px; margin-bottom: 20px;
  }
  .grid-cell {
    position: relative;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    font-weight: bold; font-size: 0.95rem; background: #f8fafc;
    border: 1px solid #e2e8f0; cursor: pointer; user-select: none;
  }
  .grid-cell.highlighted { background: var(--highlight) !important; }
  .grid-cell.found { background: var(--found) !important; color: #166534; }
  .grid-cell .tooltip {
    display: none; position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: white; padding: 3px 6px; border-radius: 4px;
    font-size: 0.7rem; white-space: nowrap; z-index: 10; pointer-events: none;
  }
  .grid-cell:hover .tooltip { display: block; }
  .word-list-card { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; width: 100%; max-width: 480px; margin-bottom: 16px; }
  .word-items { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
  .word-item { padding: 6px 12px; background: #f1f5f9; border-radius: 6px; font-weight: 500; }
  .word-item.found { text-decoration: line-through; color: #94a3b8; background: #f0fdf4; }
  .controls { display: flex; gap: 10px; margin-bottom: 12px; }
  button.action { padding: 10px 18px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; background: var(--primary); color: white; font-size: 0.95rem; }
  button.action.secondary { background: #64748b; }
  footer { margin-top: 8px; font-size: 0.8rem; color: #64748b; }
</style>
</head>
<body>

<h1>Phoneme Word Search</h1>

<div id="wordsearchGrid"></div>

<div class="word-list-card">
  <h3>Word List:</h3>
  <div id="wordDisplayList" class="word-items"></div>
</div>

<div class="controls">
  <button class="action" id="regenBtn">New Layout</button>
  <button class="action secondary" id="solveBtn">Show Answers</button>
</div>

<script>
  const DATA = ${JSON.stringify(gameData)};
  const rows = DATA.rows, cols = DATA.cols;
  let gridMatrix = [], solutions = [], wordsData = [];
  let isSelecting = false, startCell = null, showSol = false;

  const gridEl = document.getElementById('wordsearchGrid');
  gridEl.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';
  gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

  const directions = [
    {dr:0,dc:1},{dr:0,dc:-1},{dr:1,dc:0},{dr:-1,dc:0},
    {dr:1,dc:1},{dr:1,dc:-1},{dr:-1,dc:1},{dr:-1,dc:-1}
  ];

  function buildPuzzle() {
    wordsData = DATA.words.map(w => ({
      display: w.phonemes.join(''),
      cleanDisplay: w.phonemes.join(' ') + ' (' + w.english + ')',
      units: w.phonemes,
      found: false
    }));

    let pool = [];
    wordsData.forEach(w => w.units.forEach(u => { if (!pool.includes(u)) pool.push(u); }));
    if (pool.length === 0) pool = Object.keys(DATA.hintMap).slice(0, 10);

    gridMatrix = [];
    for (let r = 0; r < rows; r++) gridMatrix[r] = new Array(cols).fill(null);

    solutions = [];
    wordsData.forEach(w => {
      let placed = false, attempts = 0;
      while (!placed && attempts < 200) {
        attempts++;
        const d = directions[Math.floor(Math.random() * directions.length)];
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (canPlace(w.units, r, c, d)) {
          const coords = [];
          for (let i = 0; i < w.units.length; i++) {
            const cr = r + (d.dr || 0) * i, cc = c + (d.dc || 0) * i;
            gridMatrix[cr][cc] = w.units[i];
            coords.push({ r: cr, c: cc });
          }
          solutions.push({ display: w.display, coords });
          placed = true;
        }
      }
      if (!placed) console.warn('Could not place word: ' + w.cleanDisplay);
    });

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!gridMatrix[r][c]) gridMatrix[r][c] = pool[Math.floor(Math.random() * pool.length)];

    renderGrid();
  }

  function canPlace(units, r, c, d) {
    const len = units.length;
    const endR = r + (d.dr || 0) * (len - 1), endC = c + (d.dc || 0) * (len - 1);
    if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) return false;
    for (let i = 0; i < len; i++) {
      const cr = r + (d.dr || 0) * i, cc = c + (d.dc || 0) * i;
      if (gridMatrix[cr][cc] && gridMatrix[cr][cc] !== units[i]) return false;
    }
    return true;
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r; cell.dataset.col = c;
        cell.textContent = gridMatrix[r][c];

        if (DATA.showHints) {
          const hint = DATA.hintMap[gridMatrix[r][c]] || gridMatrix[r][c];
          const tip = document.createElement('span');
          tip.className = 'tooltip';
          tip.textContent = hint;
          cell.appendChild(tip);
        }
        gridEl.appendChild(cell);
      }
    }

    const listEl = document.getElementById('wordDisplayList');
    listEl.innerHTML = '';
    wordsData.forEach(w => {
      const item = document.createElement('div');
      item.className = 'word-item';
      item.id = 'list-' + w.display;
      item.textContent = w.cleanDisplay;
      listEl.appendChild(item);
    });
  }

  function getPath(cellA, cellB) {
    const r1 = +cellA.dataset.row, c1 = +cellA.dataset.col;
    const r2 = +cellB.dataset.row, c2 = +cellB.dataset.col;
    const dr = r2 - r1, dc = c2 - c1;
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const stepR = dr === 0 ? 0 : dr / steps, stepC = dc === 0 ? 0 : dc / steps;
      const path = [];
      for (let i = 0; i <= steps; i++) path.push({ r: r1 + stepR * i, c: c1 + stepC * i });
      return path;
    }
    return null;
  }

  function highlightPath(a, b) {
    const path = getPath(a, b);
    if (!path) return;
    path.forEach(co => {
      const cell = document.querySelector('[data-row="' + co.r + '"][data-col="' + co.c + '"]');
      if (cell) cell.classList.add('highlighted');
    });
  }

  function clearHighlights() {
    document.querySelectorAll('.grid-cell.highlighted').forEach(c => c.classList.remove('highlighted'));
  }

  function checkSelection() {
    const highlighted = document.querySelectorAll('.grid-cell.highlighted');
    if (highlighted.length === 0) return;
    const cells = Array.from(highlighted);
    const path = getPath(startCell, cells[cells.length - 1] || startCell);
    if (!path) return;

    let str1 = '', str2 = '';
    path.forEach(co => { str1 += gridMatrix[co.r][co.c]; });
    for (let i = path.length - 1; i >= 0; i--) str2 += gridMatrix[path[i].r][path[i].c];

    wordsData.forEach(w => {
      if (!w.found && (w.display === str1 || w.display === str2)) {
        w.found = true;
        path.forEach(co => {
          const cell = document.querySelector('[data-row="' + co.r + '"][data-col="' + co.c + '"]');
          if (cell) cell.classList.add('found');
        });
        const item = document.getElementById('list-' + w.display);
        if (item) item.classList.add('found');
      }
    });
  }

  gridEl.addEventListener('mousedown', e => {
    const cell = e.target.closest('.grid-cell');
    if (cell) { isSelecting = true; startCell = cell; clearHighlights(); cell.classList.add('highlighted'); }
  });
  gridEl.addEventListener('mouseover', e => {
    if (!isSelecting) return;
    const cell = e.target.closest('.grid-cell');
    if (cell) { clearHighlights(); highlightPath(startCell, cell); }
  });
  window.addEventListener('mouseup', () => {
    if (!isSelecting) return;
    isSelecting = false; checkSelection(); clearHighlights();
  });

  document.getElementById('regenBtn').addEventListener('click', buildPuzzle);
  document.getElementById('solveBtn').addEventListener('click', () => {
    showSol = !showSol;
    solutions.forEach(s => s.coords.forEach(co => {
      const cell = document.querySelector('[data-row="' + co.r + '"][data-col="' + co.c + '"]');
      if (cell) cell.style.backgroundColor = showSol ? '#fbcfe8' : '';
    }));
  });

  buildPuzzle();
</script>
</body>
</html>`;
}
