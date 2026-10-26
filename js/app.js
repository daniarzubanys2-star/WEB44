'use strict';
// Main controller: global timer, screens, access keys, leaderboard
const QUEST_SECONDS = 300;
const ACCESS_KEYS = { 1: 'DEV_LEVEL1_CLEAR', 2: 'CODE_MASTERY_77' };
const STORAGE_KEY = 'devJourneyLeaderboard';
const MAX_ENTRIES = 10;

window.el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const game = { remaining: QUEST_SECONDS, timerId: null, level: 0, nextLevel: 0 };
const screens = document.querySelectorAll('[data-screen]');
const timerBox = document.getElementById('timer-box');
const timerEl = document.getElementById('global-timer');
const keyForm = document.getElementById('key-form');
const keyInput = document.getElementById('key-input');
const keyError = document.getElementById('key-error');
const tasks = { 1: window.Task1, 2: window.Task2, 3: window.Task3 };

const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

function show(name) {
  screens.forEach(s => { s.hidden = s.dataset.screen !== name; });
  timerBox.hidden = !(game.timerId !== null);
}
function stopAll() {
  clearInterval(game.timerId); game.timerId = null;
  Object.values(tasks).forEach(t => t.stop());
}
function updateTimer() {
  timerEl.textContent = fmt(game.remaining);
  timerBox.classList.toggle('warn', game.remaining <= 30);
}
function tick() {
  game.remaining--;
  updateTimer();
  if (game.remaining <= 0) gameOver("Time's up! The global quest timer reached zero.");
}

function startGame() {
  stopAll();
  game.remaining = QUEST_SECONDS;
  updateTimer();
  game.timerId = setInterval(tick, 1000);
  startLevel(1);
}

function startLevel(n) {
  game.level = n;
  show('task' + n);
  tasks[n].init(document.getElementById('task' + n + '-root'), {
    onComplete: data => levelDone(n, data),
    onFail: reason => gameOver(reason)
  });
}

function levelDone(n, data) {
  tasks[n].stop();
  if (n === 3) { finish(data); return; }
  game.nextLevel = n + 1;
  document.getElementById('key-title').textContent = 'Level ' + n + ' complete!';
  document.getElementById('key-display').textContent = ACCESS_KEYS[n];
  keyInput.value = ''; keyError.textContent = '';
  keyInput.removeAttribute('aria-invalid');
  show('key');
  keyInput.focus();
}

function gameOver(reason) {
  stopAll();
  document.getElementById('over-reason').textContent = reason;
  show('over');
}

function loadBoard() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (err) { return []; }
}
function saveBoard(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (err) { /* storage unavailable */ }
}

function finish(data) {
  const remaining = game.remaining;
  stopAll();
  const entry = { name: data.name, time: QUEST_SECONDS - remaining, date: Date.now() };
  const board = loadBoard();
  board.push(entry);
  board.sort((a, b) => a.time - b.time);
  const kept = board.slice(0, MAX_ENTRIES);
  saveBoard(kept);
  document.getElementById('finish-summary').textContent =
    data.name + ' passed as ' + data.role + '! Time remaining: ' + fmt(remaining) + ' (spent ' + fmt(entry.time) + ').';
  renderBoard(kept, entry);
  show('finish');
}

function renderBoard(list, current) {
  const body = document.getElementById('board-body');
  body.replaceChildren();
  if (list.length === 0) {
    const tr = el('tr'); const td = el('td', 'empty', 'No results yet.'); td.colSpan = 3;
    tr.append(td); body.append(tr); return;
  }
  list.forEach((e, i) => {
    const tr = el('tr', e === current || (e.date === current.date && e.name === current.name) ? 'me' : '');
    tr.append(el('td', '', String(i + 1)), el('td', '', e.name), el('td', '', fmt(e.time)));
    body.append(tr);
  });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'start' || btn.dataset.action === 'restart') startGame();
});

keyForm.addEventListener('submit', e => {
  e.preventDefault();
  const typed = keyInput.value.trim().toUpperCase();
  if (typed === ACCESS_KEYS[game.nextLevel - 1]) {
    keyError.textContent = '';
    keyInput.removeAttribute('aria-invalid');
    startLevel(game.nextLevel);
  } else {
    keyError.textContent = typed === '' ? 'Enter the access key.' : 'Invalid access key. Copy it exactly as shown above.';
    keyInput.setAttribute('aria-invalid', 'true');
    keyInput.focus();
  }
});
