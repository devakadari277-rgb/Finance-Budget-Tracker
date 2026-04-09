function loadTargets() {
  fetch('/api/targets')
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(list) {
      var html = '';
      if (!list || list.length === 0) {
        html = '<div class="text-center p-5"><i class="bi bi-target fs-1 text-muted d-block mb-3"></i><p class="text-muted">No targets added yet. Use the form on the left to set your first goal!</p></div>';
      } else {
        list.forEach(function(t) {
          var status = t.monthly_gap <= 0 ? 'On Track' : 'At Risk';
          var statusClass = t.monthly_gap <= 0 ? 'success' : 'danger';
          var progress = t.required_monthly > 0 ? Math.min((t.actual_monthly / t.required_monthly) * 100, 100) : 0;

          var adviceHtml = '';
          if (t.advice_list && t.advice_list.length > 0) {
            adviceHtml = '<div class="mt-3 p-3 bg-white rounded-3 border border-warning-subtle shadow-sm">' +
                         '<div class="fw-bold text-warning mb-2 small"><i class="bi bi-lightbulb-fill me-1"></i>Strategic Advice</div><ul class="mb-0 ps-3 small text-dark">';
            t.advice_list.forEach(function(adv) {
              adviceHtml += '<li class="mb-1">' + adv + '</li>';
            });
            adviceHtml += '</ul></div>';
          }

          html += `
            <div class="card mb-4 border-0 shadow-sm overflow-hidden" style="border-left: 5px solid var(--bs-${statusClass}) !important;">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <h5 class="fw-bold mb-1 text-dark">${t.name}</h5>
                    <span class="badge bg-${statusClass}-subtle text-${statusClass} border border-${statusClass}">${status}</span>
                  </div>
                  <div class="text-end">
                    <div class="small text-muted mb-1">Target Capital</div>
                    <div class="h4 fw-bold mb-0 text-primary">₹${t.target_amount.toLocaleString()}</div>
                    <div class="small text-dark mt-1">Timeline: <strong>${t.years} Years</strong></div>
                  </div>
                </div>

                <div class="table-responsive mb-4">
                  <table class="table table-sm table-bordered mb-0 small">
                    <thead class="table-light">
                      <tr>
                        <th>Metric</th>
                        <th class="text-end">Monthly</th>
                        <th class="text-end">Yearly</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="text-muted">Target Required</td>
                        <td class="text-end fw-bold text-dark">₹${Math.round(t.required_monthly).toLocaleString()}</td>
                        <td class="text-end fw-bold text-dark">₹${Math.round(t.required_yearly).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td class="text-muted">Current Average</td>
                        <td class="text-end fw-bold text-success">₹${Math.round(t.actual_monthly).toLocaleString()}</td>
                        <td class="text-end fw-bold text-success">₹${Math.round(t.actual_yearly).toLocaleString()}</td>
                      </tr>
                      <tr class="${t.monthly_gap > 0 ? 'table-danger' : 'table-success'}">
                        <td class="fw-bold">Shortfall / Gap</td>
                        <td class="text-end fw-bold">₹${Math.round(t.monthly_gap).toLocaleString()}</td>
                        <td class="text-end fw-bold">₹${Math.round(t.yearly_gap).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="row g-3 mb-4">
                  <div class="col-6">
                    <div class="p-3 bg-light rounded-3 text-center h-100">
                      <div class="small text-muted mb-1">Actual Time Needed</div>
                      <div class="h5 fw-bold mb-0 text-dark">${t.revised_years_needed ? t.revised_years_needed.toFixed(1) + ' Years' : '∞ (Impossible)'}</div>
                      <small class="text-muted italic">at current rate</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-3 bg-light rounded-3 text-center h-100">
                      <div class="small text-muted mb-1">Ideal Capacity Time</div>
                      <div class="h5 fw-bold mb-0 text-dark">${t.months_to_goal_at_capacity ? (t.months_to_goal_at_capacity / 12).toFixed(1) + ' Years' : 'N/A'}</div>
                      <small class="text-muted italic">if max capacity used</small>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Pace to Target</span>
                    <span class="fw-bold text-dark">${progress.toFixed(1)}%</span>
                  </div>
                  <div class="progress shadow-sm" style="height: 10px; border-radius: 5px;">
                    <div class="progress-bar bg-${statusClass} progress-bar-striped progress-bar-animated" style="width: ${progress}%"></div>
                  </div>
                </div>

                ${adviceHtml}

              </div>
            </div>`;
        });
      }
      document.getElementById('target-list').innerHTML = html;
    })
    .catch(function(err) { 
      console.error(err);
      document.getElementById('target-list').innerHTML = '<div class="alert alert-danger">Failed to load targets. Please refresh.</div>'; 
    });
}

function loadProfile() {
  fetch('/api/profile')
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(p) {
      var inc = p.monthly_income || 0;
      var exp = p.monthly_expense || 0;
      document.getElementById('p-income').value = inc ? inc : '';
      document.getElementById('p-expense').value = exp ? exp : '';

      var btn = document.getElementById('add-target-btn');
      var hint = document.getElementById('add-target-hint');
      if (inc > 0) {
        btn.disabled = false;
        hint.textContent = 'Income setup saved. Now you can add targets and get income-based evaluation.';
      } else {
        btn.disabled = true;
        hint.textContent = 'Please save Monthly Income first to enable target evaluation.';
      }
    })
    .catch(function() {});
}

document.getElementById('profile-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var msg = document.getElementById('profile-msg');
  msg.textContent = 'Saving...';
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monthly_income: parseFloat(document.getElementById('p-income').value || 0),
      monthly_expense: parseFloat(document.getElementById('p-expense').value || 0)
    })
  })
    .then(function(r) { return r.json(); })
    .then(function() {
      msg.textContent = 'Saved. Targets are now enabled.';
      loadProfile();
      loadTargets();
    })
    .catch(function() { msg.textContent = 'Save failed.'; });
});

document.getElementById('target-form').addEventListener('submit', function(e) {
  e.preventDefault();
  fetch('/api/targets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('tname').value,
      target_amount: parseFloat(document.getElementById('tamount').value),
      years: parseFloat(document.getElementById('tyears').value),
      notes: document.getElementById('tnotes').value
    })
  }).then(function(r) {
    if (!r.ok) return r.json().then(function(d) { throw new Error(d.error || 'Failed'); });
    return r.json();
  }).then(function() {
    showToast('Target added successfully!', 'success');
    document.getElementById('tname').value = '';
    document.getElementById('tamount').value = '';
    document.getElementById('tyears').value = '';
    document.getElementById('tnotes').value = '';
    loadTargets();
  }).catch(function(e) {
    showToast(e.message || 'Could not add target.', 'error');
  });
});

document.getElementById('clear-targets-btn').addEventListener('click', function() {
  if (confirm('Are you sure you want to delete ALL your target goals? This action cannot be undone.')) {
    var btn = this;
    var originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Clearing...';
    
    fetch('/api/targets/clear', { method: 'POST' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.ok) {
          showToast('Target history cleared successfully.', 'success');
          loadTargets();
        } else {
          showToast(d.error || 'Failed to clear history.', 'error');
        }
      })
      .catch(function() { showToast('Network error while clearing targets.', 'error'); })
      .finally(function() {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      });
  }
});

loadProfile();
loadTargets();
