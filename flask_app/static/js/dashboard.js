// Main dashboard stats
fetch('/api/dashboard')
  .then(r => { if (!r.ok) throw new Error('API error'); return r.json(); })
  .then(d => {
    document.getElementById('card-income').textContent = '₹' + (d.total_income || 0).toLocaleString();
    document.getElementById('card-expense').textContent = '₹' + (d.total_expense || 0).toLocaleString();
    document.getElementById('card-savings').textContent = '₹' + (d.total_savings || 0).toLocaleString();
    document.getElementById('card-rate').textContent = (d.savings_rate || 0).toFixed(1) + '%';
  })
  .catch(function() {
    document.getElementById('card-income').textContent = '₹0';
    document.getElementById('card-expense').textContent = '₹0';
    document.getElementById('card-savings').textContent = '₹0';
    document.getElementById('card-rate').textContent = '0%';
  });

// Savings summary (this month, last month, this year, last year)
fetch('/api/savings-summary')
  .then(function(r) { if (!r.ok) throw new Error('API error'); return r.json(); })
  .then(function(d) {
    var fmt = function(v) { return '₹' + (v || 0).toLocaleString(); };
    var tm = d.this_month || 0;
    var lm = d.last_month || 0;
    document.getElementById('sav-this-month').textContent = fmt(tm);
    document.getElementById('sav-last-month').textContent = fmt(lm);
    document.getElementById('sav-this-year').textContent = fmt(d.this_year);
    document.getElementById('sav-last-year').textContent = fmt(d.last_year);

    var changeEl = document.getElementById('sav-change-text');
    if (!changeEl) return;
    var diff = tm - lm;
    if (diff > 0) {
      changeEl.textContent = 'Great! Savings increased by ' + fmt(diff) + ' compared to last month.';
      changeEl.style.color = '#16a34a';
    } else if (diff < 0) {
      changeEl.textContent = 'Careful: savings decreased by ' + fmt(Math.abs(diff)) + ' compared to last month.';
      changeEl.style.color = '#b91c1c';
    } else {
      changeEl.textContent = 'Savings are the same as last month.';
      changeEl.style.color = '#64748b';
    }
  })
  .catch(function() {
    // Keep defaults if API fails
  });

// Profile Info Loading
fetch('/api/profile')
  .then(r => r.json())
  .then(p => {
    document.getElementById('profile-name').textContent = p.name;
    document.getElementById('profile-email').textContent = p.email;
    setAvatarImage(p.avatar_url || null);
  })
  .catch(() => {});

// Avatar photo upload (saved in database per user)
var avatar = document.getElementById('user-avatar');
var avatarFile = document.getElementById('avatar-file');
var avatarUploadBtn = document.getElementById('avatar-upload-btn');
var avatarRemoveBtn = document.getElementById('avatar-remove-btn');
var avatarImg = document.getElementById('avatar-img');
var avatarFallback = document.getElementById('avatar-fallback');

function setAvatarImage(url) {
  if (!avatarImg || !avatarFallback) return;
  if (url) {
    avatarImg.src = url;
    avatarImg.style.display = 'block';
    avatarFallback.style.display = 'none';
  } else {
    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
    avatarFallback.style.display = 'block';
  }
}

// Already handled in profile info loading above

if (avatarUploadBtn && avatarFile) {
  avatarUploadBtn.addEventListener('click', function() { avatarFile.click(); });
  if (avatar) {
      avatar.addEventListener('click', function() { avatarFile.click(); });
  }
  avatarFile.addEventListener('change', function() {
    if (!avatarFile.files || !avatarFile.files[0]) return;
    var fd = new FormData();
    fd.append('avatar', avatarFile.files[0]);
    fetch('/api/profile/avatar', { method: 'POST', body: fd })
      .then(function(r) { return r.json(); })
      .then(function(d) { 
          if (d.avatar_url) {
              setAvatarImage(d.avatar_url);
              showToast('Profile picture updated!', 'success');
          } else {
              showToast(d.error || 'Upload failed.', 'error');
          }
      })
      .catch(function() { showToast('Upload failed.', 'error'); });
  });
}

if (avatarRemoveBtn) {
  avatarRemoveBtn.addEventListener('click', function() {
    fetch('/api/profile/avatar', { method: 'DELETE' })
      .then(function(r) { return r.json(); })
      .then(function() { 
          setAvatarImage(null);
          showToast('Profile picture removed.', 'info');
      })
      .catch(function() {});
  });
}
