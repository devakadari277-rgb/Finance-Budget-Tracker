const now = new Date();
let year = now.getFullYear();

for (let y = year; y >= year - 5; y--) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  if (y === year) opt.selected = true;
  document.getElementById('sel-year').appendChild(opt);
}

function load() {
  fetch(`/api/yearly/${year}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(d => {
      const months = d.months || [];
      const totalInc = months.reduce((s, m) => s + m.income, 0);
      const totalExp = months.reduce((s, m) => s + m.expense, 0);
      document.getElementById('yearly-stats').innerHTML = `
        <div class="col-md-3"><div class="card card-stat-1"><div class="card-body"><small class="text-muted">Total Income</small><p class="mb-0 fw-bold">₹${totalInc.toLocaleString()}</p></div></div></div>
        <div class="col-md-3"><div class="card card-stat-2"><div class="card-body"><small class="text-muted">Total Expense</small><p class="mb-0 fw-bold">₹${totalExp.toLocaleString()}</p></div></div></div>
        <div class="col-md-3"><div class="card card-stat-3"><div class="card-body"><small class="text-muted">Total Savings</small><p class="mb-0 fw-bold">₹${(totalInc-totalExp).toLocaleString()}</p></div></div></div>
      `;
      if (window.yearlyChart) window.yearlyChart.destroy();
      window.yearlyChart = new Chart(document.getElementById('yearly-chart'), {
        type: 'line',
        data: {
          labels: months.map(m => m.month),
          datasets: [
            { label: 'Income', data: months.map(m => m.income), borderColor: '#10b981', tension: 0.3 },
            { label: 'Expense', data: months.map(m => m.expense), borderColor: '#f59e0b', tension: 0.3 },
            { label: 'Savings', data: months.map(m => m.savings), borderColor: '#0ea5e9', tension: 0.3 }
          ]
        },
        options: {
          scales: { x: { ticks: { color: '#1e293b' } }, y: { ticks: { color: '#1e293b' } } },
          plugins: { legend: { labels: { color: '#1e293b' } } }
        }
      });
    })
    .catch(function() {
      document.getElementById('yearly-stats').innerHTML = '<div class="col-12"><div class="card"><div class="card-body text-muted">Load failed. Try logging in again.</div></div></div>';
    });
}

document.getElementById('sel-year').addEventListener('change', e => { year = +e.target.value; load(); });
load();
