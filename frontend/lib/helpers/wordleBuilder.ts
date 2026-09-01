import { DEFAULT_PHONEME_HINTS, type PhonemeHints } from "./exportFile";

export interface WordleConfig {
  targetPhonemes: string[];
  targetEnglish?: string;
  numGuesses?: number;
  showHints?: boolean;
  keyboardPhonemes?: string[];
  phonemeHints?: PhonemeHints;
}

export function generateWordleHTML(config: WordleConfig): string {
  const {
    targetPhonemes,
    targetEnglish = "",
    numGuesses = 6,
    showHints = true,
    keyboardPhonemes,
    phonemeHints = {},
  } = config;

  if (!Array.isArray(targetPhonemes) || targetPhonemes.length === 0) {
    throw new Error(
      "generateWordleHTML: targetPhonemes must be a non-empty array",
    );
  }

  const hintMap = { ...DEFAULT_PHONEME_HINTS, ...phonemeHints };

  const distractorPool = Object.keys(hintMap);
  const keyboard = Array.from(
    new Set([...(keyboardPhonemes || targetPhonemes), ...distractorPool]),
  ).slice(0, 24);

  const gameData = {
    target: targetPhonemes,
    targetEnglish,
    numGuesses,
    showHints,
    keyboard,
    hintMap,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Phoneme Wordle</title>
<style>
  :root {
    --primary: #4338ca;
    --bg: #f8fafc;
    --text: #1e293b;
    --border: #cbd5e1;
    --correct: #4ade80;
    --present: #facc15;
    --absent: #94a3b8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  body {
    background: var(--bg); color: var(--text); min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; padding: 20px 12px;
  }
  h1 { color: var(--primary); margin-bottom: 4px; }
  .meta { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; text-align: center; }
  #board {
    display: grid;
    gap: 8px;
    margin-bottom: 24px;
  }
  .tile-row { display: grid; grid-auto-flow: column; gap: 8px; }
  .tile {
    width: 56px; height: 56px;
    border: 2px solid var(--border);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1rem; text-align: center;
    background: white; text-transform: none;
  }
  .tile.correct { background: var(--correct); border-color: var(--correct); color: white; }
  .tile.present { background: var(--present); border-color: var(--present); color: white; }
  .tile.absent  { background: var(--absent);  border-color: var(--absent);  color: white; }
  #currentGuess {
    display: flex; gap: 8px; margin-bottom: 16px; min-height: 60px; align-items: center;
  }
  .pending-tile {
    min-width: 56px; height: 56px; padding: 0 6px;
    border: 2px dashed var(--border); border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-weight: 700;
  }
  #keyboard {
    display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    max-width: 560px; margin-bottom: 16px; position: relative;
  }
  .key {
    position: relative;
    padding: 10px 14px; border-radius: 8px; border: none;
    background: var(--primary); color: white; font-weight: 600; cursor: pointer; font-size: 1rem;
  }
  .key:hover, .key:focus { background: #312e81; }
  .key .tooltip {
    display: none;
    position: absolute; bottom: 115%; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: white; padding: 4px 8px; border-radius: 4px;
    font-size: 0.75rem; white-space: nowrap; z-index: 10;
  }
  .key:hover .tooltip, .key:focus .tooltip { display: block; }
  .controls { display: flex; gap: 10px; margin-bottom: 16px; }
  button.action {
    padding: 10px 18px; border-radius: 8px; border: none; font-weight: 600;
    cursor: pointer; font-size: 0.95rem;
  }
  #submitBtn { background: #16a34a; color: white; }
  #deleteBtn { background: #dc2626; color: white; }
  #message { min-height: 28px; font-weight: 600; margin-bottom: 8px; text-align: center; }
  footer { margin-top: 24px; font-size: 0.8rem; color: #64748b; }
</style>
</head>
<body>

<h1>Phoneme Wordle</h1>
<div class="meta">Guess the word using its phonemes. Click a tile below for a hint.</div>

<div id="board"></div>
<div id="currentGuess"></div>
<div id="message"></div>

<div id="keyboard"></div>

<div class="controls">
  <button class="action" id="deleteBtn">Delete</button>
  <button class="action" id="submitBtn">Submit Guess</button>
</div>

<script>
  const DATA = ${JSON.stringify(gameData)};

  const target = DATA.target;
  const wordLen = target.length;
  const maxGuesses = DATA.numGuesses;
  let currentGuess = [];
  let guessRow = 0;
  let gameOver = false;

  const boardEl = document.getElementById('board');
  const currentGuessEl = document.getElementById('currentGuess');
  const keyboardEl = document.getElementById('keyboard');
  const messageEl = document.getElementById('message');

  boardEl.style.gridTemplateRows = 'repeat(' + maxGuesses + ', 1fr)';

  const rows = [];
  for (let r = 0; r < maxGuesses; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'tile-row';
    rowEl.style.gridTemplateColumns = 'repeat(' + wordLen + ', 1fr)';
    const tiles = [];
    for (let c = 0; c < wordLen; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      rowEl.appendChild(tile);
      tiles.push(tile);
    }
    boardEl.appendChild(rowEl);
    rows.push(tiles);
  }

  function renderCurrentGuess() {
    currentGuessEl.innerHTML = '';
    for (let i = 0; i < wordLen; i++) {
      const t = document.createElement('div');
      t.className = 'pending-tile';
      t.textContent = currentGuess[i] || '';
      currentGuessEl.appendChild(t);
    }
  }

  DATA.keyboard.forEach(sym => {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.type = 'button';
    btn.textContent = sym;
    btn.setAttribute('tabindex', '0');
    if (DATA.showHints) {
      const hintText = DATA.hintMap[sym] || sym;
      btn.setAttribute('aria-label', sym + ': ' + hintText);
      const tip = document.createElement('span');
      tip.className = 'tooltip';
      tip.textContent = hintText;
      btn.appendChild(tip);
    }
    btn.addEventListener('click', () => {
      if (gameOver) return;
      if (currentGuess.length < wordLen) {
        currentGuess.push(sym);
        renderCurrentGuess();
      }
    });
    keyboardEl.appendChild(btn);
  });

  document.getElementById('deleteBtn').addEventListener('click', () => {
    if (gameOver) return;
    currentGuess.pop();
    renderCurrentGuess();
  });

  document.getElementById('submitBtn').addEventListener('click', submitGuess);

  function submitGuess() {
    if (gameOver) return;
    if (currentGuess.length !== wordLen) {
      messageEl.textContent = 'Guess must have ' + wordLen + ' phonemes.';
      return;
    }

    const result = new Array(wordLen).fill('absent');
    const targetCopy = [...target];

    for (let i = 0; i < wordLen; i++) {
      if (currentGuess[i] === target[i]) {
        result[i] = 'correct';
        targetCopy[i] = null;
      }
    }
    for (let i = 0; i < wordLen; i++) {
      if (result[i] === 'correct') continue;
      const idx = targetCopy.indexOf(currentGuess[i]);
      if (idx !== -1) {
        result[i] = 'present';
        targetCopy[idx] = null;
      }
    }

    const rowTiles = rows[guessRow];
    currentGuess.forEach((sym, i) => {
      rowTiles[i].textContent = sym;
      rowTiles[i].classList.add(result[i]);
    });

    const won = result.every(r => r === 'correct');
    guessRow++;

    if (won) {
      gameOver = true;
      messageEl.textContent = 'Correct! The word is "' + DATA.targetEnglish + '".';
    } else if (guessRow >= maxGuesses) {
      gameOver = true;
      messageEl.textContent = 'Out of guesses. The word was "' + DATA.targetEnglish + '".';
    } else {
      messageEl.textContent = '';
    }

    currentGuess = [];
    renderCurrentGuess();
  }

  renderCurrentGuess();
</script>
</body>
</html>`;
}
