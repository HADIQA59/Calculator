(() => {
  'use strict';

  const tapeCurrentEl = document.getElementById('tapeCurrent');
  const tapeLogEl = document.getElementById('tapeLog');
  const tapeScrollEl = document.getElementById('tapeScroll');
  const modeIndicator = document.getElementById('modeIndicator');
  const lever = document.getElementById('lever');
  const keypad = document.querySelector('.keypad');

  const MAX_DIGITS = 12;

  const state = {
    display: '0',      // string currently shown / being typed
    previous: null,     // number stored before an operator was pressed
    operator: null,      // '+', '-', '×', '÷'
    overwrite: true,     // next digit press replaces display instead of appending
    lastOpKey: null       // reference to the currently-selected operator button
  };

  function formatNumber(num) {
    if (!isFinite(num)) return 'Error';
    // Trim floating point noise, cap length
    let str = String(Math.round(num * 1e10) / 1e10);
    if (str.length > MAX_DIGITS + 1 && str.includes('.')) {
      str = num.toPrecision(MAX_DIGITS - String(Math.trunc(num)).length);
      str = String(parseFloat(str));
    }
    return str;
  }

 

  function setOperatorHighlight(key) {
    document.querySelectorAll('.key--op').forEach(k => k.classList.remove('is-selected'));
    if (key) key.classList.add('is-selected');
    modeIndicator.classList.toggle('active', !!key);
  }

  function printTapeLine(text) {
    const li = document.createElement('li');
    li.textContent = text;
    tapeLogEl.appendChild(li);
    // keep tape from growing forever
    while (tapeLogEl.children.length > 6) {
      tapeLogEl.removeChild(tapeLogEl.firstChild);
    }
  }

  function symbolFor(op) {
    return op;
  }

  function compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function inputDigit(digit) {
    if (state.overwrite) {
      state.display = digit === '.' ? '0.' : digit;
      state.overwrite = false;
    } else {
      if (digit === '.' && state.display.includes('.')) return;
      if (state.display.replace('-', '').replace('.', '').length >= MAX_DIGITS) return;
      state.display = state.display === '0' && digit !== '.' ? digit : state.display + digit;
    }
    updateDisplay();
  }

  function handleOperator(opSymbol, keyEl) {
    const current = parseFloat(state.display);

    if (state.operator && !state.overwrite) {
      // chain: compute running total first
      const result = compute(state.previous, current, state.operator);
      printTapeLine(`${formatNumber(state.previous)} ${state.operator} ${formatNumber(current)}`);
      state.previous = result;
      state.display = formatNumber(result);
    } else {
      state.previous = current;
    }

    state.operator = opSymbol;
    state.overwrite = true;
    setOperatorHighlight(keyEl);
    updateDisplay();
  }

  function handleEquals() {
    if (state.operator === null || state.previous === null) return;
    const current = parseFloat(state.display);
    const result = compute(state.previous, current, state.operator);

    printTapeLine(`${formatNumber(state.previous)} ${state.operator} ${formatNumber(current)} =`);

    state.display = formatNumber(result);
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    setOperatorHighlight(null);
    updateDisplay();
    pullLever();
  }

  function handleClear() {
    state.display = '0';
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    setOperatorHighlight(null);
    tapeLogEl.innerHTML = '';
    updateDisplay();
  }

  function handleBackspace() {
    if (state.overwrite) return;
    if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith('-'))) {
      state.display = '0';
      state.overwrite = true;
    } else {
      state.display = state.display.slice(0, -1);
    }
    updateDisplay();
  }

  function handlePercent() {
    const current = parseFloat(state.display);
    const result = state.previous !== null
      ? state.previous * (current / 100)
      : current / 100;
    state.display = formatNumber(result);
    state.overwrite = true;
    updateDisplay();
  }

  function handleDecimal() {
    inputDigit('.');
  }

  function pullLever() {
    lever.classList.add('pulled');
    setTimeout(() => lever.classList.remove('pulled'), 220);
  }

  // ---- Event wiring ----

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      inputDigit(btn.dataset.num);
      return;
    }

    switch (btn.dataset.action) {
      case 'clear': handleClear(); break;
      case 'backspace': handleBackspace(); break;
      case 'percent': handlePercent(); break;
      case 'decimal': handleDecimal(); break;
      case 'equals': handleEquals(); break;
      case 'add': handleOperator('+', btn); break;
      case 'subtract': handleOperator('−', btn); break;
      case 'multiply': handleOperator('×', btn); break;
      case 'divide': handleOperator('÷', btn); break;
    }
  });

  lever.addEventListener('click', handleEquals);

  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (/^[0-9]$/.test(key)) { inputDigit(key); return; }
    if (key === '.') { handleDecimal(); return; }
    if (key === 'Enter' || key === '=') { e.preventDefault(); handleEquals(); return; }
    if (key === 'Backspace') { handleBackspace(); return; }
    if (key === 'Escape') { handleClear(); return; }
    if (key === '%') { handlePercent(); return; }
    if (key === '+') { handleOperator('+', document.querySelector('[data-action="add"]')); return; }
    if (key === '-') { handleOperator('−', document.querySelector('[data-action="subtract"]')); return; }
    if (key === '*') { handleOperator('×', document.querySelector('[data-action="multiply"]')); return; }
    if (key === '/') { e.preventDefault(); handleOperator('÷', document.querySelector('[data-action="divide"]')); return; }
  });

  updateDisplay();
})();