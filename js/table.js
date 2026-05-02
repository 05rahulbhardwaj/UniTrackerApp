/* UniTrack — Table View */

const TableView = {
  sortCol: 'deadline',
  sortDir: 'asc',
  filterStatus: '',
  filterUni: '',

  render() {
    const el = document.getElementById('view-table');
    const unis = Store.getUniversities();
    let courses = Store.getCourses().map(c => {
      const u = Store.getUniversity(c.universityId);
      return { ...c, uniName: u ? u.name : '—', uniEmoji: u ? u.emoji : '🎓' };
    });

    if (this.filterStatus) courses = courses.filter(c => c.status === this.filterStatus);
    if (this.filterUni) courses = courses.filter(c => c.universityId === this.filterUni);

    courses.sort((a, b) => {
      let va = a[this.sortCol] || '', vb = b[this.sortCol] || '';
      if (this.sortCol === 'deadline') { va = va ? new Date(va).getTime() : Infinity; vb = vb ? new Date(vb).getTime() : Infinity; }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
      return this.sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    el.innerHTML = `
      <div class="view-header">
        <h1 class="view-title">All Applications</h1>
        <button class="btn-primary btn-sm" onclick="App.showModal('addCourse')">+ Add Course</button>
      </div>
      <div class="table-toolbar">
        <div class="table-filter">
          <span class="table-filter-label">Status</span>
          <select id="filter-status" onchange="TableView.filterStatus=this.value;TableView.render()">
            <option value="">All</option>
            ${Utils.STATUSES.map(s => `<option value="${s}" ${this.filterStatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="table-filter">
          <span class="table-filter-label">University</span>
          <select id="filter-uni" onchange="TableView.filterUni=this.value;TableView.render()">
            <option value="">All</option>
            ${unis.map(u => `<option value="${u.id}" ${this.filterUni===u.id?'selected':''}>${u.emoji} ${Utils.esc(u.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="table-container">
        <div class="table-scroll">
          ${courses.length === 0 ? `<div class="table-empty"><div class="table-empty-icon">📋</div><div class="table-empty-text">No applications found</div></div>` : `
          <table class="data-table">
            <thead><tr>
              ${this._th('uniName','University')}
              ${this._th('name','Course')}
              ${this._th('degree','Degree')}
              ${this._th('status','Status')}
              ${this._th('priority','Priority')}
              ${this._th('deadline','Deadline')}
              <th>Reqs</th>
              <th style="width:80px"></th>
            </tr></thead>
            <tbody>
              ${courses.map(c => this._row(c)).join('')}
            </tbody>
          </table>`}
        </div>
      </div>
    `;
  },

  _th(col, label) {
    const cls = this.sortCol === col ? (this.sortDir === 'asc' ? 'sort-asc' : 'sort-desc') : '';
    return `<th class="${cls}" onclick="TableView._sort('${col}')">${label}</th>`;
  },

  _sort(col) {
    if (this.sortCol === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortCol = col; this.sortDir = 'asc'; }
    this.render();
  },

  _row(c) {
    const reqs = Store.getRequirements(c.id);
    const done = reqs.filter(r => r.completed).length;
    return `<tr>
      <td><span style="margin-right:6px">${c.uniEmoji}</span>${Utils.esc(c.uniName)}</td>
      <td><span class="cell-editable" onclick="App.openCoursePanel('${c.id}')">${Utils.esc(c.name)}</span></td>
      <td>${Utils.esc(c.degree)}</td>
      <td><select class="table-status-select" style="background:${Utils.statusBg(c.status)};color:${Utils.statusColor(c.status)}"
        onchange="Store.updateCourse('${c.id}',{status:this.value});Utils.toast('Status updated','success')">
        ${Utils.STATUSES.map(s => `<option value="${s}" ${c.status===s?'selected':''}>${s}</option>`).join('')}
      </select></td>
      <td><span class="priority-dot" style="background:${Utils.priorityColor(c.priority)}"></span> ${c.priority || '—'}</td>
      <td>${c.deadline ? `<span class="deadline-badge ${Utils.deadlineClass(c.deadline)}">${Utils.deadlineLabel(c.deadline)}</span>` : '—'}</td>
      <td>${reqs.length > 0 ? `${done}/${reqs.length}` : '—'}</td>
      <td><div class="row-actions">
        <button class="btn-icon" onclick="App.showModal('editCourse','${c.id}')" title="Edit">✎</button>
        <button class="btn-icon" onclick="App.confirmDelete('course','${c.id}')" title="Delete">🗑</button>
      </div></td>
    </tr>`;
  }
};
