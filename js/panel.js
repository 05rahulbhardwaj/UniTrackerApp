/* UniTrack — Side Panel */

const Panel = {
  open: false,
  type: null, // 'university' or 'course'
  id: null,

  close() {
    this.open = false;
    document.getElementById('side-panel').classList.remove('open');
    document.getElementById('panel-overlay').classList.remove('open');
  },

  _open() {
    this.open = true;
    document.getElementById('side-panel').classList.add('open');
    document.getElementById('panel-overlay').classList.add('open');
  },

  openUniversity(uid) {
    this.type = 'university'; this.id = uid;
    this._open();
    this.renderUniversity(uid);
  },

  openCourse(cid) {
    this.type = 'course'; this.id = cid;
    this._open();
    this.renderCourse(cid);
  },

  renderUniversity(uid) {
    const u = Store.getUniversity(uid);
    if (!u) { this.close(); return; }
    const courses = Store.getCoursesByUniversity(uid);
    const panel = document.getElementById('side-panel');
    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-emoji">${u.emoji}</div>
        <div class="panel-title-group">
          <div class="panel-title">${Utils.esc(u.name)}</div>
          <div class="panel-subtitle">${Utils.esc(u.country)}${u.website ? ` · <a href="${Utils.esc(u.website)}" target="_blank" style="color:var(--accent-light)">Website ↗</a>` : ''}</div>
        </div>
        <button class="panel-close" onclick="Panel.close()">×</button>
      </div>
      <div class="panel-body">
        <div class="panel-section">
          <div class="panel-section-header">
            <span class="panel-section-title">Courses (${courses.length})</span>
            <button class="panel-section-action" onclick="App.showModal('addCourse','','${uid}')">+ Add Course</button>
          </div>
          ${courses.length === 0 ? '<div style="color:var(--text-muted);font-size:0.85rem">No courses added yet.</div>' :
            courses.map(c => this._courseCard(c)).join('')}
        </div>
        ${u.notes ? `<div class="panel-section"><div class="panel-section-title" style="margin-bottom:8px">Notes</div><div style="font-size:0.85rem;color:var(--text-secondary)">${Utils.esc(u.notes)}</div></div>` : ''}
      </div>
      <div class="panel-footer">
        <button class="btn-secondary btn-sm" onclick="App.showModal('editUniversity','${uid}')">✎ Edit</button>
        <button class="btn-danger btn-sm" onclick="App.confirmDelete('university','${uid}')">Delete</button>
      </div>
    `;
  },

  _courseCard(c) {
    const reqs = Store.getRequirements(c.id);
    const deps = Store.getDependencies(c.id);
    const done = reqs.filter(r => r.completed).length;
    const pct = reqs.length > 0 ? Math.round(done/reqs.length*100) : 0;
    return `<div class="panel-course-card">
      <div class="panel-course-header" onclick="this.nextElementSibling.classList.toggle('expanded');this.querySelector('.panel-course-toggle').classList.toggle('expanded')">
        <span class="status-pill" style="color:${Utils.statusColor(c.status)};background:${Utils.statusBg(c.status)}">${c.status}</span>
        <span class="panel-course-name">${Utils.esc(c.name)}</span>
        ${c.deadline ? `<span class="deadline-badge ${Utils.deadlineClass(c.deadline)}">${Utils.deadlineLabel(c.deadline)}</span>` : ''}
        <span class="panel-course-toggle">▸</span>
      </div>
      <div class="panel-course-body">
        <div class="panel-info-grid" style="margin-bottom:16px">
          <div class="panel-info-item"><div class="panel-info-label">Degree</div><div class="panel-info-value">${Utils.esc(c.degree)}</div></div>
          <div class="panel-info-item"><div class="panel-info-label">Priority</div><div class="panel-info-value"><span class="priority-dot" style="background:${Utils.priorityColor(c.priority)}"></span> ${c.priority}</div></div>
          <div class="panel-info-item"><div class="panel-info-label">Deadline</div><div class="panel-info-value">${Utils.formatDate(c.deadline)}</div></div>
          <div class="panel-info-item"><div class="panel-info-label">Fee</div><div class="panel-info-value">${Utils.esc(c.applicationFee) || '—'}</div></div>
        </div>

        <div class="panel-section-header">
          <span class="panel-section-title">Requirements (${done}/${reqs.length})</span>
          <button class="panel-section-action" onclick="App.showModal('addRequirement','${c.id}')">+ Add</button>
        </div>
        ${reqs.length > 0 ? `<div class="progress-bar" style="margin-bottom:10px"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}
        <ul class="checklist">
          ${reqs.map(r => `<li class="checklist-item">
            <div class="checklist-checkbox ${r.completed?'checked':''}" onclick="Store.updateRequirement('${r.id}',{completed:${!r.completed}})"></div>
            <span class="checklist-label ${r.completed?'completed':''}">${Utils.esc(r.label)}</span>
            ${r.dueDate ? `<span class="checklist-due ${Utils.deadlineClass(r.dueDate)}">${Utils.deadlineLabel(r.dueDate)}</span>` : ''}
            <span class="checklist-delete" onclick="Store.deleteRequirement('${r.id}')">×</span>
          </li>`).join('')}
        </ul>

        <div class="panel-section-header" style="margin-top:16px">
          <span class="panel-section-title">Dependencies (${deps.length})</span>
          <button class="panel-section-action" onclick="App.showModal('addDependency','${c.id}')">+ Add</button>
        </div>
        ${deps.map(d => {
          const cls = d.status === 'Completed' ? 'dep-status-completed' : d.status === 'In Progress' ? 'dep-status-in-progress' : 'dep-status-pending';
          const nextStatus = d.status === 'Pending' ? 'In Progress' : d.status === 'In Progress' ? 'Completed' : 'Pending';
          return `<div class="dep-item">
            <span class="dep-status-pill ${cls}" onclick="Store.updateDependency('${d.id}',{status:'${nextStatus}'})" title="Click to cycle">${d.status}</span>
            <span class="dep-label">${Utils.esc(d.label)}</span>
            <span class="dep-delete" onclick="Store.deleteDependency('${d.id}')">×</span>
          </div>`;
        }).join('')}

        <div style="margin-top:14px;display:flex;gap:8px">
          <button class="btn-secondary btn-sm" onclick="App.showModal('editCourse','${c.id}')">✎ Edit Course</button>
          <button class="btn-danger btn-sm" onclick="App.confirmDelete('course','${c.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  },

  renderCourse(cid) {
    const c = Store.getCourse(cid);
    if (!c) { this.close(); return; }
    const uni = Store.getUniversity(c.universityId);
    if (uni) { this.openUniversity(uni.id); return; }
    this.close();
  },

  refresh() {
    if (!this.open) return;
    if (this.type === 'university') this.renderUniversity(this.id);
    else if (this.type === 'course') this.renderCourse(this.id);
  }
};
