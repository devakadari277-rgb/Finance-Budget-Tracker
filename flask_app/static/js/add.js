document.getElementById('date').valueAsDate = new Date();
const now = new Date();
document.getElementById('time').value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
let type = 'income';

function showHide() {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-type="' + type + '"]').classList.add('active');
  document.getElementById('type-field').style.display = type === 'income' ? 'block' : 'none';
  document.getElementById('expense-fields').style.display = type === 'expense' ? 'block' : 'none';
  document.getElementById('cat-field').style.display = type === 'expense' ? 'block' : 'none';
  document.getElementById('payment-field').style.display = type === 'expense' ? 'block' : 'none';
  document.getElementById('phonepay-sub').style.display = (type === 'expense' && document.getElementById('payment_mode').value === 'phonepay') ? 'block' : 'none';
  document.getElementById('savings-note-field').style.display = type === 'savings' ? 'block' : 'none';
  document.getElementById('notes-field').style.display = type !== 'savings' ? 'block' : 'none';
}

document.querySelectorAll('[data-type]').forEach(btn => {
  btn.addEventListener('click', function() {
    type = this.dataset.type;
    showHide();
  });
});

document.getElementById('payment_mode').addEventListener('change', function() {
  var isPhonePe = this.value === 'phonepay';
  document.getElementById('phonepay-sub').style.display = isPhonePe ? 'block' : 'none';
  if (!isPhonePe) {
    document.getElementById('screenshot-upload').style.display = 'none';
    document.getElementById('scan-upload').style.display = 'none';
  }
});

document.querySelectorAll('input[name="phonepay_type"]').forEach(function(radio) {
  radio.addEventListener('change', function() {
    document.getElementById('screenshot-upload').style.display = this.value === 'screenshot' ? 'block' : 'none';
    document.getElementById('scan-upload').style.display = this.value === 'scan' ? 'block' : 'none';
  });
});

document.getElementById('add-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var amt = parseFloat(document.getElementById('amount').value);
  var dt = document.getElementById('date').value;
  var tm = document.getElementById('time').value;
  if (type === 'income') {
    fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amt,
        date: dt,
        time: tm,
        type: document.getElementById('type').value,
        source: document.getElementById('notes').value
      })
    }).then(function(r) { return r.json(); }).then(function() {
      showToast('Income added successfully!', 'success'); 
      document.getElementById('amount').value = ''; 
      document.getElementById('notes').value = '';
      loadRecentEntries(); // Refresh list
    });
    return;
  }
  if (type === 'savings') {
    fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amt,
        date: dt,
        time: tm,
        notes: document.getElementById('savings_notes').value
      })
    }).then(function(r) { return r.json(); }).then(function() {
      showToast('Savings added successfully!', 'success'); 
      document.getElementById('amount').value = ''; 
      document.getElementById('savings_notes').value = '';
      loadRecentEntries(); // Refresh list
    });
    return;
  }
  var paymentMode = document.getElementById('payment_mode').value;
  var phonepayType = document.querySelector('input[name="phonepay_type"]:checked').value;
  if (paymentMode === 'phonepay') paymentMode = 'phonepay_' + phonepayType;
  fetch('/api/expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amt,
      date: dt,
      time: tm,
      category: document.getElementById('category').value,
      description: document.getElementById('notes').value,
      payment_mode: paymentMode
    })
  }).then(function(r) { return r.json(); }).then(function() {
    showToast('Expense added successfully!', 'success'); 
    document.getElementById('amount').value = ''; 
    document.getElementById('notes').value = '';
    document.getElementById('screenshot_file').value = ''; 
    document.getElementById('scan_file').value = '';
    loadRecentEntries(); // Refresh list
  });
});

function loadRecentEntries() {
    const listEl = document.getElementById('recent-entries-list');
    if (!listEl) return;
    
    fetch('/api/history?year=' + new Date().getFullYear())
        .then(r => r.json())
        .then(data => {
            const recent = data.slice(0, 5); // Just last 5
            listEl.innerHTML = '';
            if (recent.length === 0) {
                listEl.innerHTML = '<p class="text-muted small">No recent entries found.</p>';
                return;
            }
            recent.forEach(item => {
                const div = document.createElement('div');
                div.className = 'list-group-item px-0 py-2 border-0 border-bottom d-flex justify-content-between align-items-center';
                div.innerHTML = `
                    <div>
                        <div class="fw-bold small">${item.subtype}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">₹${parseFloat(item.amount).toLocaleString()} • ${item.date} ${item.time || ''}</div>
                    </div>
                    <div>
                      <button class="btn btn-link btn-sm text-primary p-0 me-2 recent-edit-btn" data-item='${JSON.stringify(item).replace(/'/g, "&apos;")}' title="Edit">
                          <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-link btn-sm text-danger p-0 recent-delete-btn" data-type="${item.type}" data-id="${item.id}" title="Delete">
                          <i class="bi bi-trash"></i>
                      </button>
                    </div>
                `;
                listEl.appendChild(div);
            });
        });
}

// Robust Event Delegation for dynamic buttons
document.getElementById('recent-entries-list').addEventListener('click', function(e) {
    const editBtn = e.target.closest('.recent-edit-btn');
    const deleteBtn = e.target.closest('.recent-delete-btn');
    
    if (editBtn) {
        e.preventDefault();
        try {
            const item = JSON.parse(editBtn.getAttribute('data-item'));
            window.editRecentEntry(item);
        } catch (err) {
            console.error('Failed to parse item data', err);
        }
    }
    
    if (deleteBtn) {
        e.preventDefault();
        const type = deleteBtn.getAttribute('data-type');
        const id = deleteBtn.getAttribute('data-id');
        window.deleteRecentEntry(type, id);
    }
});

window.deleteRecentEntry = function(type, id) {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    fetch(`/api/history/delete/${type}/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(d => {
            if (d.ok) {
                showToast('Entry removed successfully', 'info');
                loadRecentEntries();
            }
        });
}

let editModal;
window.editRecentEntry = function(item) {
    if(!editModal) {
      const modalEl = document.getElementById('editModal');
      if (modalEl) editModal = new bootstrap.Modal(modalEl);
      else return;
    }
    
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-type-val').value = item.type;
    document.getElementById('edit-amount').value = item.amount;
    document.getElementById('edit-date').value = item.date;
    document.getElementById('edit-time').value = item.time || '';
    
    const dynamicFields = document.getElementById('edit-dynamic-fields');
    if (item.type === 'income') {
        dynamicFields.innerHTML = `
            <div class="mb-3">
              <label class="form-label">Income Type</label>
              <input type="text" class="form-control" id="edit-subtype" value="${item.subtype}">
            </div>
            <div class="mb-3">
              <label class="form-label">Source/Notes</label>
              <input type="text" class="form-control" id="edit-notes" value="${item.source || ''}">
            </div>
        `;
    } else if (item.type === 'expense') {
        dynamicFields.innerHTML = `
            <div class="mb-3">
              <label class="form-label">Expense Category</label>
              <input type="text" class="form-control" id="edit-subtype" value="${item.subtype}">
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <input type="text" class="form-control" id="edit-notes" value="${item.description || ''}">
            </div>
        `;
    } else if (item.type === 'saving') {
        dynamicFields.innerHTML = `
            <div class="mb-3">
              <label class="form-label">Notes</label>
              <input type="text" class="form-control" id="edit-notes" value="${item.notes || ''}">
            </div>
        `;
    }
    
    editModal.show();
}

document.getElementById('edit-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const type = document.getElementById('edit-type-val').value;
    
    const payload = {
        amount: parseFloat(document.getElementById('edit-amount').value),
        date: document.getElementById('edit-date').value,
        time: document.getElementById('edit-time').value
    };
    
    if (type === 'income') {
        payload.type = document.getElementById('edit-subtype').value;
        payload.source = document.getElementById('edit-notes').value;
    } else if (type === 'expense') {
        payload.category = document.getElementById('edit-subtype').value;
        payload.description = document.getElementById('edit-notes').value;
    } else if (type === 'saving') {
        payload.notes = document.getElementById('edit-notes').value;
    }
    
    fetch(`/api/edit/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(d => {
        if (d.ok) {
            editModal.hide();
            showToast('Transaction updated successfully', 'success');
            loadRecentEntries();
        } else {
            showToast(d.error || 'Failed to update', 'danger');
        }
    });
});

loadRecentEntries();

