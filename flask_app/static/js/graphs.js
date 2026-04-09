const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let year = new Date().getFullYear();

for (let y = year; y >= year - 4; y--) {
  const opt = document.createElement('option');
  opt.value = y; opt.textContent = y;
  if (y === year) opt.selected = true;
  document.getElementById('sel-year').appendChild(opt);
}

let pieChart, barChart, lineChart, candleChart;

function load() {
  fetch(`/api/graphs/${year}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(d => {
      const months = d.months || [];
      const labels = months.map(m => monthNames[m.month - 1]);
      const incomeData = months.map(m => m.income);
      const expenseData = months.map(m => m.expense);
      const savingsData = months.map(m => m.savings);
      const cats = d.by_category || {};

      // Pie Chart
      if (pieChart) pieChart.destroy();
      pieChart = new ApexCharts(document.getElementById('chart-pie'), {
        series: Object.values(cats).length ? Object.values(cats) : [1],
        labels: Object.keys(cats).length ? Object.keys(cats) : ['No data'],
        chart: { type: 'pie', height: 280 },
        colors: ['#0ea5e9','#22d3ee','#10b981','#8b5cf6','#f59e0b','#f43f5e','#06b6d4','#84cc16'],
        legend: { position: 'bottom' }
      });
      pieChart.render();

      // Bar Chart
      if (barChart) barChart.destroy();
      barChart = new ApexCharts(document.getElementById('chart-bar'), {
        series: [
          { name: 'Income', data: incomeData },
          { name: 'Expense', data: expenseData }
        ],
        chart: { type: 'bar', height: 280 },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
        xaxis: { categories: labels },
        colors: ['#10b981', '#f59e0b'],
        legend: { position: 'top' }
      });
      barChart.render();

      // Line Chart
      if (lineChart) lineChart.destroy();
      lineChart = new ApexCharts(document.getElementById('chart-line'), {
        series: [
          { name: 'Income', data: incomeData },
          { name: 'Expense', data: expenseData },
          { name: 'Savings', data: savingsData }
        ],
        chart: { type: 'line', height: 300 },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: labels },
        colors: ['#10b981', '#f59e0b', '#0ea5e9'],
        legend: { position: 'top' }
      });
      lineChart.render();

      // Candlestick Chart (OHLC: Open=0, High=max, Low=min, Close=Savings)
      const candleData = months.map(m => {
        const o = 0, c = m.savings;
        const h = Math.max(o, m.income, c);
        const l = Math.min(o, -m.expense, c);
        return { x: monthNames[m.month - 1], y: [o, h, l, c] };
      });
      if (candleData.every(c => c.y[1] === 0 && c.y[2] === 0)) {
        candleData.forEach(c => { c.y = [0, 1, 0, 0.5]; });
      }
      if (candleChart) candleChart.destroy();
      candleChart = new ApexCharts(document.getElementById('chart-candle'), {
        series: [{ name: 'Cash Flow', data: candleData }],
        chart: { type: 'candlestick', height: 300 },
        xaxis: { type: 'category' },
        yaxis: { labels: { formatter: v => '₹' + v } },
        plotOptions: { candlestick: { colors: { upward: '#10b981', downward: '#f43f5e' } } },
        title: { text: 'Monthly: Green = Profit, Red = Loss' }
      });
      candleChart.render();

      // Pro Mixed Chart (Income/Expense vs Trend)
      const mixEl = document.getElementById('chart-mixed');
      if (mixEl) {
          if (window.mixChart) window.mixChart.destroy();
          window.mixChart = new ApexCharts(mixEl, {
              series: [
                  { name: 'Income', type: 'column', data: incomeData },
                  { name: 'Expense', type: 'column', data: expenseData },
                  { name: 'Trend', type: 'line', data: savingsData }
              ],
              chart: { height: 350, type: 'line', stacked: false },
              stroke: { width: [0, 0, 4], curve: 'smooth' },
              plotOptions: { bar: { columnWidth: '50%' } },
              colors: ['#10b981', '#f59e0b', '#0ea5e9'],
              xaxis: { categories: labels },
              yaxis: [
                  { title: { text: 'Flow (Income/Expense)' } },
                  { opposite: true, title: { text: 'Savings Trend' } }
              ],
              tooltip: { shared: true, intersect: false },
              legend: { position: 'top' }
          });
          window.mixChart.render();
      }
      
      // Dynamic Insights Logic
      generateInsights(months, cats);
    })
    .catch(function() {
      document.getElementById('chart-pie').innerHTML = '<p class="text-muted p-3">Load failed. Try logging in again.</p>';
    });
}

document.getElementById('sel-year').addEventListener('change', e => { year = +e.target.value; load(); });
load();

function generateInsights(months, cats) {
    const container = document.getElementById('smart-insights-container');
    const list = document.getElementById('smart-insights-list');
    if (!container || !list) return;

    const insights = [];
    const recentMonth = months[months.length - 1];
    
    // 1. Check for Highest Category
    const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
        insights.push(`Your highest spending is on <strong>${sortedCats[0][0]}</strong> (₹${sortedCats[0][1].toLocaleString()}).`);
    }

    // 2. Trend Analysis (Last 2 months)
    if (months.length >= 2) {
        const last = months[months.length - 1];
        const prev = months[months.length - 2];
        if (last.expense > prev.expense) {
            const diff = last.expense - prev.expense;
            insights.push(`Expenses increased by <strong>₹${diff.toLocaleString()}</strong> compared to last month.`);
        } else if (last.expense < prev.expense) {
            insights.push(`Great! You spent <strong>₹${(prev.expense - last.expense).toLocaleString()} less</strong> than last month.`);
        }
    }

    // 3. Savings Rate check
    if (recentMonth && recentMonth.income > 0) {
        const rate = (recentMonth.savings / recentMonth.income) * 100;
        if (rate > 20) {
            insights.push(`Healthy savings rate of <strong>${rate.toFixed(1)}%</strong> this month!`);
        } else if (rate < 5 && rate > 0) {
            insights.push(`Low savings rate (${rate.toFixed(1)}%). Try reducing discretionary spending.`);
        }
    }

    if (insights.length > 0) {
        container.style.display = 'block';
        list.innerHTML = insights.map(text => `
            <div class="col-md-6 col-lg-4">
                <div class="d-flex align-items-start small text-visible">
                    <i class="bi bi-check2-circle text-primary me-2 mt-1"></i>
                    <span>${text}</span>
                </div>
            </div>
        `).join('');
    } else {
        container.style.display = 'none';
    }
}
