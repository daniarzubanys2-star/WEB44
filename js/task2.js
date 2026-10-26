'use strict';

window.Task2 = (() => {
  
  const ALL_ITEMS = [
    { id: 1, word: 'const', type: 'keyword', isDecoy: false },
    { id: 2, word: 'card', type: 'identifier', isDecoy: false },
    { id: 3, word: '=', type: 'operator', isDecoy: false },
    { id: 4, word: 'document', type: 'identifier', isDecoy: false },
    { id: 5, word: '.createElement', type: 'method', isDecoy: false },
    { id: 6, word: '(', type: 'punctuation', isDecoy: false },
    { id: 7, word: "'div'", type: 'literal', isDecoy: false },
    { id: 8, word: ')', type: 'punctuation', isDecoy: false },
    { id: 9, word: ';', type: 'punctuation', isDecoy: false },
    
    { id: 10, word: 'innerHTML', type: 'property', isDecoy: true },
    { id: 11, word: 'push', type: 'method', isDecoy: true },
    { id: 12, word: 'querySelector', type: 'method', isDecoy: true },
    { id: 13, word: 'function', type: 'keyword', isDecoy: true }
  ];

  const EXPECTED_WORDS = ['const', 'card', '=', 'document', '.createElement', '(', "'div'", ')', ';'];
  const MAX_ATTEMPTS = 3;
  let root, api, bank, slot, attempts, locked, pendingId = null;
  let slotEl, bankEl, msgEl, attEl, statsEl;

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  
  function calculateSlotStats(slotArray) {
    let nonDecoyCount = 0;
    for (const item of slotArray) {
      if (!item.isDecoy) {
        nonDecoyCount++;
      }
    }
    return nonDecoyCount;
  }

  function resetWords() {
    bank = shuffle(ALL_ITEMS);
    slot = [];
  }

  function stop() { clearTimeout(pendingId); pendingId = null; }

  function makeBadge(item) {
    const b = el('button', 'badge', item.word);
    b.type = 'button'; b.dataset.id = item.id;
    return b;
  }

  function render() {
    slotEl.replaceChildren(...slot.map(makeBadge));
    bankEl.replaceChildren(...bank.map(makeBadge));
    attEl.textContent = 'Attempts left: ' + (MAX_ATTEMPTS - attempts);
    
    
    const validCount = calculateSlotStats(slot);
    statsEl.textContent = `Valid tokens selected: ${validCount} / ${EXPECTED_WORDS.length}`;
  }

  function move(e, from, to) {
    const b = e.target.closest('button[data-id]');
    if (!b || locked) return;
    const idx = from.findIndex(i => i.id === Number(b.dataset.id));
    if (idx === -1) return;
    to.push(from.splice(idx, 1)[0]);
    render();
  }

  function say(text, cls) { msgEl.className = 'msg ' + cls; msgEl.textContent = text; }

  function check() {
    if (locked) return;
    if (slot.length === 0) { say('Add some words to the slot first.', 'bad'); return; }
    attempts++;
    
    const ok = slot.length === EXPECTED_WORDS.length && slot.every((s, i) => s.word === EXPECTED_WORDS[i]);
    render();
    if (ok) {
      locked = true;
      say('Correct! The line is reconstructed.', 'ok');
      pendingId = setTimeout(() => api.onComplete(), 900);
    } else if (attempts >= MAX_ATTEMPTS) {
      locked = true;
      api.onFail('You used all 3 attempts and could not rebuild the line of code.');
    } else {
      say('Not the right line. ' + (MAX_ATTEMPTS - attempts) + ' attempt(s) left.', 'bad');
    }
  }

  function init(rootEl, apiObj) {
    stop();
    root = rootEl; api = apiObj; attempts = 0; locked = false;
    resetWords();
    slotEl = el('div', 'code-slot'); slotEl.setAttribute('aria-label', 'Code slot');
    bankEl = el('div', 'row bank'); bankEl.setAttribute('aria-label', 'Word bank');
    msgEl = el('p', 'msg'); msgEl.setAttribute('role', 'status');
    attEl = el('strong', 'level-timer');
    statsEl = el('span', 'stats-info', '');

    slotEl.addEventListener('click', e => move(e, slot, bank));
    bankEl.addEventListener('click', e => move(e, bank, slot));

    const code = el('div', 'code');
    const lines = [
      ['function renderCard(item) {'], ['  ', slotEl], ['  card.textContent = item.title;'],
      ["  card.classList.add('card');"], ['  return card;'], ['}']
    ];
    lines.forEach(parts => { const d = el('div'); d.append(...parts); code.append(d); });

    const controls = el('div', 'row');
    const checkBtn = el('button', 'btn', 'Check'); checkBtn.type = 'button'; checkBtn.dataset.action = 'check';
    const resetBtn = el('button', 'btn secondary', 'Reset'); resetBtn.type = 'button'; resetBtn.dataset.action = 'reset';
    controls.append(checkBtn, resetBtn);
    controls.addEventListener('click', e => {
      const a = e.target.closest('button[data-action]');
      if (!a || locked) return;
      if (a.dataset.action === 'check') check();
      else { resetWords(); say('', ''); render(); }
    });

    const meta = el('div', 'meta'); meta.append(el('span', '', 'Level 2 of 3'), attEl, statsEl);
    root.replaceChildren(
      el('h2', '', 'Level 2: Code Line Reconstruction'), meta,
      el('p', '', "One line of this rendering function was deleted. Click words from the bank (beware of decoys) to rebuild: const card = document.createElement('div');"),
      code, bankEl, controls, msgEl
    );
    render();
  }
  return { init, stop };
})();
