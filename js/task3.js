'use strict';
// Level 3: Hardware Builder & Live Validation
window.Task3 = (() => {
  const BUDGET = 300000, OFFICE_MAX = 180000;
  const ROLES = [
    { id: 'gamer', label: '🎮 Pro Gamer', need: 'High-tier GPU (RTX 3060 or better) and RAM of 16GB or more.' },
    { id: 'designer', label: '🎨 3D Designer', need: 'High-tier CPU (Core i7-13700K) and RAM of 32GB or more.' },
    { id: 'office', label: '💼 Office Worker', need: 'Stay at or under 180,000 ₸ in total.' }
  ];
  const PARTS = {
    cpu: [
      { id: 'i3', name: 'Intel Core i3-12100F', price: 45000, socket: 'LGA1700', tier: 0, info: 'Low' },
      { id: 'r5', name: 'AMD Ryzen 5 5600', price: 65000, socket: 'AM4', tier: 1, info: 'Mid' },
      { id: 'i7', name: 'Intel Core i7-13700K', price: 160000, socket: 'LGA1700', tier: 2, info: 'High' }
    ],
    mb: [
      { id: 'h610', name: 'MSI H610M', price: 35000, socket: 'LGA1700' },
      { id: 'b550', name: 'ASUS B550M', price: 50000, socket: 'AM4' },
      { id: 'z790', name: 'GIGABYTE Z790', price: 110000, socket: 'LGA1700' }
    ],
    ram: [
      { id: 'r8', name: '8GB DDR4', price: 12000, gb: 8 },
      { id: 'r16', name: '16GB DDR4', price: 22000, gb: 16 },
      { id: 'r32', name: '32GB DDR4', price: 42000, gb: 32 }
    ],
    gpu: [
      { id: 'igpu', name: 'Integrated / Base', price: 15000, tier: 0 },
      { id: '3060', name: 'NVIDIA RTX 3060 12GB', price: 140000, tier: 1 },
      { id: '4070', name: 'NVIDIA RTX 4070', price: 260000, tier: 2 }
    ]
  };
  const LABELS = { cpu: 'CPU', mb: 'Motherboard', ram: 'RAM', gpu: 'GPU' };
  const money = n => n.toLocaleString('en-US') + ' ₸';

  let api, role, form, fields, touched, summary, previewList, totalEl, statusEl;

  function stop() {}

  function field(name, labelText, control) {
    const wrap = el('div', 'field');
    const label = el('label', '', labelText); label.htmlFor = 'f-' + name;
    control.id = 'f-' + name; control.name = name; control.required = true;
    const err = el('p', 'error'); err.id = 'err-' + name;
    control.setAttribute('aria-describedby', err.id);
    wrap.append(label, control, err);
    return wrap;
  }
  function makeSelect(name) {
    const s = el('select');
    const first = el('option', '', '— Select —'); first.value = '';
    s.append(first);
    PARTS[name].forEach(p => {
      const extra = p.socket ? ' | ' + p.socket + (p.info ? ' | ' + p.info : '') : '';
      const o = el('option', '', p.name + ' (' + money(p.price) + extra + ')');
      o.value = p.id; s.append(o);
    });
    return s;
  }
  const pick = name => PARTS[name].find(p => p.id === form.elements[name].value) || null;

  function computeErrors() {
    const sel = { cpu: pick('cpu'), mb: pick('mb'), ram: pick('ram'), gpu: pick('gpu') };
    const errs = { name: [], cpu: [], mb: [], ram: [], gpu: [] };
    if (sel.cpu && sel.mb && sel.cpu.socket !== sel.mb.socket) {
      errs.mb.push('Socket mismatch: ' + sel.cpu.name + ' uses ' + sel.cpu.socket + ', but ' + sel.mb.name + ' uses ' + sel.mb.socket + '.');
    }
    const chosen = Object.entries(sel).filter(e => e[1]);
    const total = chosen.reduce((s, e) => s + e[1].price, 0);
    if (chosen.length) {
      const worst = chosen.reduce((a, b) => (b[1].price > a[1].price ? b : a))[0];
      if (total > BUDGET) errs[worst].push('Total ' + money(total) + ' exceeds the ' + money(BUDGET) + ' budget. Choose a cheaper ' + LABELS[worst] + '.');
      else if (role.id === 'office' && total > OFFICE_MAX) errs[worst].push('Office Worker must stay at or under ' + money(OFFICE_MAX) + ' (now ' + money(total) + ').');
    }
    if (role.id === 'gamer') {
      if (sel.gpu && sel.gpu.tier < 1) errs.gpu.push('Pro Gamer needs a high-tier GPU (RTX 3060 or better).');
      if (sel.ram && sel.ram.gb < 16) errs.ram.push('Pro Gamer needs at least 16GB RAM.');
    }
    if (role.id === 'designer') {
      if (sel.cpu && sel.cpu.tier < 2) errs.cpu.push('3D Designer needs a high-tier CPU (Core i7-13700K).');
      if (sel.ram && sel.ram.gb < 32) errs.ram.push('3D Designer needs 32GB RAM.');
    }
    return errs;
  }

  function messageFor(f) {
    const v = f.validity;
    if (v.valueMissing) return f.name === 'name' ? 'Enter your player name.' : 'Please choose a ' + LABELS[f.name] + '.';
    if (v.tooShort) return 'Name must be at least 2 characters.';
    if (v.patternMismatch) return 'Use only letters, digits, spaces or underscores.';
    return f.validationMessage;
  }

  // Validates all fields; shows messages for touched ones (or all when showAll)
  function validate(showAll) {
    const errs = computeErrors();
    const invalid = [];
    fields.forEach(f => {
      f.setCustomValidity((errs[f.name] || []).join(' '));
      const bad = !f.validity.valid;
      if (bad) invalid.push(f);
      const show = bad && (showAll || touched.has(f.name) || (f.tagName === 'SELECT' && f.value !== ''));
      const err = document.getElementById('err-' + f.name);
      err.textContent = show ? messageFor(f) : '';
      if (show) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    });
    return invalid;
  }

  function renderPreview() {
    const parts = Object.keys(PARTS).map(k => [k, pick(k)]);
    previewList.replaceChildren(...parts.map(([k, p]) => el('li', '', LABELS[k] + ': ' + (p ? p.name + ' (' + money(p.price) + ')' : 'not chosen'))));
    const total = parts.reduce((s, e) => s + (e[1] ? e[1].price : 0), 0);
    totalEl.textContent = 'Total: ' + money(total) + ' / ' + money(BUDGET);
    totalEl.classList.toggle('over', total > BUDGET);
  }

  function onChange() { renderPreview(); validate(false); }

  function init(rootEl, apiObj) {
    api = apiObj; touched = new Set();
    role = ROLES[Math.floor(Math.random() * ROLES.length)];
    form = el('form'); form.noValidate = true;
    summary = el('div', 'summary'); summary.hidden = true; summary.tabIndex = -1; summary.setAttribute('role', 'alert');

    const nameInput = el('input'); nameInput.type = 'text'; nameInput.minLength = 2; nameInput.maxLength = 20;
    nameInput.pattern = '[A-Za-z0-9_ ]+'; nameInput.autocomplete = 'off';
    const submit = el('button', 'btn', 'Assemble PC'); submit.type = 'submit';
    form.append(summary, field('name', 'Player name', nameInput));
    Object.keys(PARTS).forEach(k => form.append(field(k, LABELS[k], makeSelect(k))));
    form.append(submit);
    fields = Array.from(form.elements).filter(f => f.name);

    previewList = el('ul'); totalEl = el('p', 'total'); statusEl = el('p', 'msg');
    const roleBox = el('div', 'role');
    roleBox.append(el('strong', '', 'Your role: ' + role.label), el('br'), el('span', '', role.need));
    const preview = el('aside', 'preview');
    preview.append(roleBox, el('h3', '', 'Live build'), previewList, totalEl);

    form.addEventListener('input', onChange);
    form.addEventListener('change', onChange);
    form.addEventListener('focusout', e => {
      if (e.target.name) { touched.add(e.target.name); validate(false); }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      fields.forEach(f => touched.add(f.name));
      const invalid = validate(true);
      if (invalid.length) {
        summary.hidden = false;
        summary.textContent = invalid.length + ' error' + (invalid.length > 1 ? 's' : '') + ' found. Fix the highlighted fields.';
        invalid[0].focus();
        return;
      }
      summary.hidden = true;
      const result = { name: nameInput.value.trim(), role: role.label };
      form.reset(); touched.clear();
      api.onComplete(result);
    });

    const layout = el('div', 'layout');
    layout.append(form, preview);
    rootEl.replaceChildren(
      el('h2', '', 'Level 3: Hardware Builder'),
      el('p', '', 'Build a PC within ' + money(BUDGET) + ', with matching sockets, that fits your random role.'),
      layout
    );
    renderPreview();
  }
  return { init, stop };
})();
