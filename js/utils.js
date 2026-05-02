/* UniTrack — Utility Helpers */

const Utils = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  inputDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  },

  daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const now = new Date(); now.setHours(0,0,0,0);
    const t = new Date(dateStr); t.setHours(0,0,0,0);
    return Math.ceil((t - now) / 86400000);
  },

  deadlineClass(dateStr) {
    const d = this.daysUntil(dateStr);
    if (d < 0) return 'deadline-passed';
    if (d <= 7) return 'deadline-urgent';
    if (d <= 30) return 'deadline-warning';
    return 'deadline-safe';
  },

  deadlineLabel(dateStr) {
    const d = this.daysUntil(dateStr);
    if (d === Infinity) return '—';
    if (d < 0) return `${Math.abs(d)}d overdue`;
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d <= 30) return `${d}d left`;
    return this.formatDateShort(dateStr);
  },

  toast(message, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${Utils.esc(message)}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-visible'));
    setTimeout(() => { t.classList.remove('toast-visible'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  },

  debounce(fn, ms = 300) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  },

  statusColor(status) {
    const m = {
      'Researching':'#8a8a9a','Shortlisted':'#7c5cfc','Applying':'#ffb84d',
      'Applied':'#3b82f6','Accepted':'#36d399','Rejected':'#ff4d6a','Enrolled':'#06b6d4'
    };
    return m[status] || '#8a8a9a';
  },

  statusBg(status) {
    const m = {
      'Researching':'rgba(138,138,154,0.12)','Shortlisted':'rgba(124,92,252,0.12)',
      'Applying':'rgba(255,184,77,0.12)','Applied':'rgba(59,130,246,0.12)',
      'Accepted':'rgba(54,211,153,0.12)','Rejected':'rgba(255,77,106,0.12)',
      'Enrolled':'rgba(6,182,212,0.12)'
    };
    return m[status] || 'rgba(138,138,154,0.12)';
  },

  priorityColor(p) {
    return { High:'var(--danger)', Medium:'var(--warning)', Low:'var(--success)' }[p] || 'var(--text-muted)';
  },

  STATUSES: ['Researching','Shortlisted','Applying','Applied','Accepted','Rejected','Enrolled'],
  PRIORITIES: ['High','Medium','Low'],
  DEGREES: ['MS','PhD','MBA','MEng','MA','BSc','Other'],
  DEP_STATUSES: ['Pending','In Progress','Completed']
};
