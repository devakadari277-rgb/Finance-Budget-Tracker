document.addEventListener('DOMContentLoaded', function() {
  const currentYear = new Date().getFullYear();
  const yrEls = ['p1-year', 'p2-year'];
  
  yrEls.forEach(id => {
    const sel = document.getElementById(id);
    for (let y = currentYear; y >= currentYear - 4; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      sel.appendChild(opt);
    }
  });

  // Default selection: p1 = last month, p2 = this month
  const now = new Date();
  let m1 = now.getMonth(); // 0-indexed, so getMonth() is last month (1-12 based)
  let y1 = currentYear;
  if(m1 === 0) {
    m1 = 12;
    y1 = currentYear - 1;
    // ensure year exists in dropdown, else add it
    if(!document.querySelector(`#p1-year option[value="${y1}"]`)){
        document.getElementById('p1-year').appendChild(new Option(y1, y1));
    }
  }
  document.getElementById('p1-year').value = y1;
  document.getElementById('p1-month').value = m1;
  
  document.getElementById('p2-year').value = currentYear;
  document.getElementById('p2-month').value = now.getMonth() + 1; // current month

  let compChart;

  document.getElementById('btn-compare').addEventListener('click', async function() {
    const y1 = document.getElementById('p1-year').value;
    const m1 = document.getElementById('p1-month').value;
    const y2 = document.getElementById('p2-year').value;
    const m2 = document.getElementById('p2-month').value;
    
    // Update labels
    const p1Label = getPeriodLabel(y1, m1);
    const p2Label = getPeriodLabel(y2, m2);
    
    document.getElementById('lbl-p1-inc').textContent = p1Label;
    document.getElementById('lbl-p2-inc').textContent = p2Label;
    document.getElementById('lbl-p1-exp').textContent = p1Label;
    document.getElementById('lbl-p2-exp').textContent = p2Label;
    document.getElementById('lbl-p1-sav').textContent = p1Label;
    document.getElementById('lbl-p2-sav').textContent = p2Label;

    try {
      const btn = document.getElementById('btn-compare');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
      btn.disabled = true;

      const res = await fetch(`/api/compare?y1=${y1}&m1=${m1}&y2=${y2}&m2=${m2}`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Render cards
      updateCard('inc', data.period1.income, data.period2.income, data.diff.income);
      updateCard('exp', data.period1.expense, data.period2.expense, data.diff.expense, true); // true = inverted color logic (more expense is bad)
      updateCard('sav', data.period1.savings, data.period2.savings, data.diff.savings);

      document.getElementById('compare-results').style.display = 'block';

      // Render Chart
      if(compChart) compChart.destroy();
      const ctx = document.getElementById('compareChart').getContext('2d');
      compChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Income', 'Expense', 'Savings'],
          datasets: [
            {
              label: p1Label,
              data: [data.period1.income, data.period1.expense, data.period1.savings],
              backgroundColor: 'rgba(108, 117, 125, 0.7)',
              borderColor: 'rgb(108, 117, 125)',
              borderWidth: 1
            },
            {
              label: p2Label,
              data: [data.period2.income, data.period2.expense, data.period2.savings],
              backgroundColor: 'rgba(14, 165, 233, 0.8)',
              borderColor: 'rgb(14, 165, 233)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Side-by-Side Comparison' },
            legend: { position: 'top' }
          },
          scales: { y: { beginAtZero: true } }
        }
      });

    } catch(err) {
      showToast('Error loading comparison: ' + err.message, 'danger');
    } finally {
      const btn = document.getElementById('btn-compare');
      btn.innerHTML = '<i class="bi bi-bar-chart-fill me-2"></i>Run Comparison';
      btn.disabled = false;
    }
  });

  function getPeriodLabel(y, m) {
    if (m == 0) return `Year ${y}`;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${monthNames[m-1]} ${y}`;
  }

  function updateCard(type, val1, val2, diff, invertColors = false) {
    document.getElementById(`val-p1-${type}`).textContent = val1.toLocaleString();
    document.getElementById(`val-p2-${type}`).textContent = val2.toLocaleString();
    
    const diffEl = document.getElementById(`diff-${type}`);
    const sign = diff > 0 ? '+' : (diff < 0 ? '-' : '');
    diffEl.textContent = sign + '₹' + Math.abs(diff).toLocaleString();
    
    // Clear old colors
    diffEl.classList.remove('bg-success', 'bg-danger', 'bg-secondary');
    
    if (diff === 0) {
      diffEl.classList.add('bg-secondary');
    } else {
      let isGood = diff > 0;
      if (invertColors) isGood = !isGood; // For expenses, an increase is bad
      
      if (isGood) diffEl.classList.add('bg-success');
      else diffEl.classList.add('bg-danger');
    }
  }

});
