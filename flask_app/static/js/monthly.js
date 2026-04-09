const now = new Date();
let month = now.getMonth() + 1;
let year = now.getFullYear();

for (let m = 1; m <= 12; m++) {
  const opt = document.createElement('option');
  opt.value = m;
  opt.textContent = new Date(2000, m - 1).toLocaleString('default', { month: 'long' });
  if (m === month) opt.selected = true;
  document.getElementById('sel-month').appendChild(opt);
}
for (let y = year; y >= year - 4; y--) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  if (y === year) opt.selected = true;
  document.getElementById('sel-year').appendChild(opt);
}

function load() {
  fetch(`/api/monthly/${month}/${year}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(d => {
      document.getElementById('monthly-stats').innerHTML = `
        <div class="col-md-2"><div class="card card-stat-1"><div class="card-body"><small class="text-muted">Income</small><p class="mb-0 fw-bold">₹${(d.total_income||0).toLocaleString()}</p></div></div></div>
        <div class="col-md-2"><div class="card card-stat-2"><div class="card-body"><small class="text-muted">Expense</small><p class="mb-0 fw-bold">₹${(d.total_expense||0).toLocaleString()}</p></div></div></div>
        <div class="col-md-2"><div class="card card-stat-3"><div class="card-body"><small class="text-muted">Savings</small><p class="mb-0 fw-bold">₹${(d.total_savings||0).toLocaleString()}</p></div></div></div>
        <div class="col-md-2"><div class="card card-stat-4"><div class="card-body"><small class="text-muted">Rate</small><p class="mb-0 fw-bold">${(d.savings_rate||0).toFixed(1)}%</p></div></div></div>
        <div class="col-md-2"><div class="card card-stat-1"><div class="card-body"><small class="text-muted">Top Category</small><p class="mb-0 fw-bold">${d.top_category||'N/A'}</p></div></div></div>
      `;
      const cats = d.by_category || {};
      if (window.monthlyChart) window.monthlyChart.destroy();
      window.monthlyChart = new Chart(document.getElementById('monthly-chart'), {
        type: 'pie',
        data: {
          labels: Object.keys(cats),
          datasets: [{ data: Object.values(cats), backgroundColor: ['#0ea5e9','#22d3ee','#10b981','#8b5cf6','#f59e0b','#f43f5e'] }]
        },
        options: {
          plugins: { legend: { labels: { color: '#1e293b' } } }
        }
      });
    })
    .catch(function() {
      document.getElementById('monthly-stats').innerHTML = '<div class="col-12"><div class="card"><div class="card-body text-muted">Load failed. Try logging in again.</div></div></div>';
    });
}

document.getElementById('sel-month').addEventListener('change', e => { month = +e.target.value; load(); });
document.getElementById('sel-year').addEventListener('change', e => { year = +e.target.value; load(); });

document.getElementById('clear-month-btn').addEventListener('click', () => {
  if (!confirm(`Are you sure you want to clear ALL transactions for ${new Date(2000, month-1).toLocaleString('default', {month:'long'})} ${year}? This cannot be undone.`)) return;
  
  fetch(`/api/clear-month/${month}/${year}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        alert(d.message);
        load();
      } else {
        alert(d.error || 'Failed to clear data');
      }
    });
});

load();
