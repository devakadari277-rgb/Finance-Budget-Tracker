// Standalone calculator (button based) for /calculator page

(function () {
  var calcDisplay = document.getElementById('calc-display');
  var calcMini = document.getElementById('calc-mini');
  var calcClearHistory = document.getElementById('calc-clear-history');

  function calcReset() {
    if (calcDisplay) calcDisplay.value = '0';
    if (calcMini) calcMini.textContent = '';
    window.__calc_state = { a: null, op: null, newEntry: true };
  }

  function calcSetDisplay(v) {
    if (!calcDisplay) return;
    calcDisplay.value = v;
  }

  function calcAppendNumber(n) {
    if (!calcDisplay) return;
    var st = window.__calc_state || (window.__calc_state = { a: null, op: null, newEntry: true });
    if (st.newEntry || calcDisplay.value === '0') {
      calcSetDisplay(String(n));
      st.newEntry = false;
    } else {
      calcSetDisplay(calcDisplay.value + String(n));
    }
  }

  function calcAppendDot() {
    if (!calcDisplay) return;
    var st = window.__calc_state || (window.__calc_state = { a: null, op: null, newEntry: true });
    if (st.newEntry) {
      calcSetDisplay('0.');
      st.newEntry = false;
      return;
    }
    if (calcDisplay.value.indexOf('.') === -1) {
      calcSetDisplay(calcDisplay.value + '.');
    }
  }

  function calcDelete() {
    if (!calcDisplay) return;
    if (calcDisplay.value.length <= 1) calcSetDisplay('0');
    else calcSetDisplay(calcDisplay.value.slice(0, -1));
  }

  function calcToggleSign() {
    if (!calcDisplay) return;
    if (calcDisplay.value === '0') return;
    if (calcDisplay.value.startsWith('-')) calcSetDisplay(calcDisplay.value.slice(1));
    else calcSetDisplay('-' + calcDisplay.value);
  }

  function calcPercent() {
    if (!calcDisplay) return;
    var cur = parseFloat(calcDisplay.value);
    if (isNaN(cur)) return;
    calcSetDisplay(String(cur / 100));
  }

  function calcCompute(a, op, b) {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return b === 0 ? NaN : (a / b);
    return b;
  }

  function calcChooseOp(op) {
    if (!calcDisplay) return;
    var st = window.__calc_state || (window.__calc_state = { a: null, op: null, newEntry: true });
    var cur = parseFloat(calcDisplay.value);
    if (st.a === null) {
      st.a = isNaN(cur) ? 0 : cur;
    } else if (!st.newEntry) {
      var r = calcCompute(st.a, st.op, isNaN(cur) ? 0 : cur);
      st.a = r;
      calcSetDisplay(isNaN(r) ? 'Error' : String(r));
    }
    st.op = op;
    st.newEntry = true;
    if (calcMini) calcMini.textContent = (st.a != null ? st.a : '') + ' ' + (op === '*' ? '×' : (op === '/' ? '÷' : op));
  }

  function calcEquals() {
    if (!calcDisplay) return;
    var st = window.__calc_state || (window.__calc_state = { a: null, op: null, newEntry: true });
    if (st.a === null || !st.op) return;
    var cur = parseFloat(calcDisplay.value);
    var r = calcCompute(st.a, st.op, isNaN(cur) ? 0 : cur);
    calcSetDisplay(isNaN(r) ? 'Error' : String(r));
    if (calcMini) calcMini.textContent = '';
    st.a = null;
    st.op = null;
    st.newEntry = true;
  }

  function initCalculator() {
    var calcEl = document.querySelector('.calculator');
    if (!calcEl) return;
    calcReset();
    calcEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.num != null) {
        calcAppendNumber(btn.dataset.num);
        return;
      }
      if (btn.dataset.op) {
        calcChooseOp(btn.dataset.op);
        return;
      }
      if (btn.dataset.action === 'ac') return calcReset();
      if (btn.dataset.action === 'del') return calcDelete();
      if (btn.dataset.action === 'dot') return calcAppendDot();
      if (btn.dataset.action === 'sign') return calcToggleSign();
      if (btn.dataset.action === 'percent') return calcPercent();
      if (btn.dataset.action === 'eq') return calcEquals();
    });

    // Keyboard support (useful in real world)
    document.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (k >= '0' && k <= '9') return calcAppendNumber(k);
      if (k === '.') return calcAppendDot();
      if (k === 'Backspace') return calcDelete();
      if (k === 'Escape') return calcReset();
      if (k === 'Enter' || k === '=') return calcEquals();
      if (k === '+' || k === '-' || k === '*' || k === '/') return calcChooseOp(k);
    });

    if (calcClearHistory) {
      calcClearHistory.addEventListener('click', function () { calcReset(); });
    }
  }

  initCalculator();
})();
