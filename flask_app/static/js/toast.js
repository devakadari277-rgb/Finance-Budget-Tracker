/**
 * Premium Toast Notification System
 * Slides up from bottom, features a green tick for success.
 */
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '30px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    
    let icon = '<i class="bi bi-info-circle-fill"></i>';
    if (type === 'success') {
        icon = '<i class="bi bi-check-circle-fill text-success"></i>';
    } else if (type === 'error') {
        icon = '<i class="bi bi-exclamation-triangle-fill text-danger"></i>';
    }

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    // Style the toast
    Object.assign(toast.style, {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '12px 24px',
        borderRadius: '50px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        opacity: '0',
        transform: 'translateY(50px)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        color: '#1e293b',
        fontWeight: '600',
        fontSize: '0.95rem'
    });

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
};

// Global intercept for original alert if needed (optional)
// window.alert = (msg) => window.showToast(msg, 'info');
