'use strict';
// Level 1: Hackathon Calendar Tag Fix + Penalty System
window.Task1 = (() => {
  const LEVEL_SECONDS = 60;
  const TAGS = ['<article>', '<section>', '<div>', '<span>'];
  const CORRECT = ['<article>', '<section>'];
  const QUIZ = [
    { q: 'Which keyword declares a block-scoped constant in JavaScript?', a: ['var', 'let', 'const', 'static'], c: 'const' },
    { q: 'Which HTML attribute must be unique within a document?', a: ['class', 'id', 'name', 'title'], c: 'id' }
  ];
  let root, api, timerId = null, pendingId = null, left = 0, quizIndex = 0, timerEl;

  function stop() {
    clearInterval(timerId); clearTimeout(pendingId);
    timerId = null; pendingId = null;
  }

  function init(rootEl, apiObj) {
    stop();
    root = rootEl; api = apiObj; left = LEVEL_SECONDS; quizIndex = 0;
    renderMain();
    timerId = setInterval(tick, 1000);
  }

  function tick() {
    left--;
    timerEl.textContent = left + 's';
    if (left <= 0) { stop(); renderPenalty(); }
  }

  function renderMain() {
    const slots = [el('span', 'slot', '???'), el('span', 'slot', '???')];
    const pre = el('pre');
    pre.append(
      '<main class="calendar">\n  <h3>Hackathon Registration</h3>\n  <', slots[0],
      ' class="day-card" data-date="2026-11-14">\n    <p>Sat, Nov 14: 40 seats left</p>\n    <button>Register</button>\n  </',
      slots[1], '>\n</main>'
    );
    timerEl = el('strong', 'level-timer', left + 's');
    const meta = el('div', 'meta'); meta.append(el('span', '', 'Level 1 of 3'), timerEl);
    const opts = el('div', 'row');
    TAGS.forEach(t => { const b = el('button', 'opt', t); b.type = 'button'; b.dataset.tag = t; opts.append(b); });
    const msg = el('p', 'msg'); msg.setAttribute('role', 'status');

    opts.addEventListener('click', e => {
      const btn = e.target.closest('button[data-tag]');
      if (!btn || btn.disabled || timerId === null) return;
      if (CORRECT.includes(btn.dataset.tag)) {
        stop();
        const name = btn.dataset.tag.slice(1, -1);
        slots.forEach(s => { s.textContent = name; s.classList.add('fixed'); });
        opts.querySelectorAll('button').forEach(b => { b.disabled = true; });
        msg.className = 'msg ok'; msg.textContent = 'Correct! Semantic markup restored.';
        pendingId = setTimeout(() => api.onComplete(), 900);
      } else {
        btn.disabled = true; btn.classList.add('wrong');
        msg.className = 'msg bad';
        msg.textContent = btn.dataset.tag + ' is not a semantic container for a registration card. Try another tag.';
      }
    });
    root.replaceChildren(
      el('h2', '', 'Level 1: Hackathon Calendar Fix'), meta,
      el('p', '', 'A tag is missing in the registration calendar. Pick the semantic container that fixes it before the level timer expires.'),
      pre, opts, msg
    );
  }

  function renderPenalty() {
    const item = QUIZ[quizIndex];
    const wrap = el('div', 'penalty');
    const msg = el('p', 'msg'); msg.setAttribute('role', 'status');
    const answers = el('div', 'row');
    item.a.forEach(a => { const b = el('button', 'opt', a); b.type = 'button'; b.dataset.answer = a; answers.append(b); });
    answers.addEventListener('click', e => {
      const btn = e.target.closest('button[data-answer]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.answer === item.c) {
        quizIndex++;
        if (quizIndex >= QUIZ.length) api.onComplete(); else renderPenalty();
      } else {
        btn.disabled = true; btn.classList.add('wrong');
        msg.className = 'msg bad'; msg.textContent = 'Wrong answer. The global timer is still ticking!';
      }
    });
    wrap.append(
      el('h2', 'fail-title', 'Penalty Stage'),
      el('p', '', 'The level timer expired. Answer both questions correctly to earn Access Key 1.'),
      el('p', 'meta', 'Question ' + (quizIndex + 1) + ' of ' + QUIZ.length),
      el('h3', '', item.q), answers, msg
    );
    root.replaceChildren(wrap);
  }

  return { init, stop };
})();
