'use strict';
// Level 2: JS Code Line Reconstruction
window.Task2 = (() => {
  const EXPECTED = ['const', 'card', '=', 'document', '.createElement', '(', "'div'", ')', ';'];
  const DECOYS = ['innerHTML', 'push', 'querySelector', 'function'];
  const MAX_ATTEMPTS = 3;
  let root, api, bank, slot, attempts, locked, pendingId = null;
  let slotEl, bankEl, msgEl, attEl;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function resetWords() {
    bank = shuffle([...EXPECTED, ...DECOYS].map((word, id) => ({ id, word })));
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
    const ok = slot.length === EXPECTED.length && slot.every((s, i) => s.word === EXPECTED[i]);
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

    const meta = el('div', 'meta'); meta.append(el('span', '', 'Level 2 of 3'), attEl);
    root.replaceChildren(
      el('h2', '', 'Level 2: Code Line Reconstruction'), meta,
      el('p', '', 'One line of this rendering function was deleted. Click words from the bank (beware of decoys) to rebuild: const card = document.createElement(\'div\');'),
      code, bankEl, controls, msgEl
    );
    render();
  }
  return { init, stop };
})();
