/* UniTrack — App Controller */

const App = {
  currentView: 'dashboard',

  async init() {
    // Show loading
    document.getElementById('app-loading').style.display = 'flex';
    document.getElementById('auth-container').style.display = 'none';
    document.querySelector('.app-layout').style.display = 'none';

    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      await this._startApp(session.user);
    } else {
      document.getElementById('app-loading').style.display = 'none';
      Auth.render();
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        document.getElementById('app-loading').style.display = 'flex';
        Auth.hide();
        await this._startApp(session.user);
      } else if (event === 'SIGNED_OUT') {
        document.querySelector('.app-layout').style.display = 'none';
        Panel.close();
        Auth.render();
      }
    });
  },

  async _startApp(user) {
    await Store.init(user.id);
    Store.onChange(() => this.refreshAll());
    this._bindNav();
    this._bindSearch();
    this._bindSidebar();
    this._bindExportImport();
    document.getElementById('panel-overlay').addEventListener('click', () => Panel.close());
    document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) this.closeModal(); });

    // Show user email in sidebar
    const emailEl = document.getElementById('user-email');
    if (emailEl) emailEl.textContent = user.email;

    document.getElementById('app-loading').style.display = 'none';
    document.querySelector('.app-layout').style.display = 'flex';

    const hash = location.hash.replace('#','') || 'dashboard';
    this.navigate(hash);
  },

  _bindNav() {
    document.querySelectorAll('.nav-item').forEach(a => {
      a.addEventListener('click', (e) => { e.preventDefault(); this.navigate(a.dataset.view); });
    });
  },

  _bindSearch() {
    const input = document.getElementById('global-search');
    input.addEventListener('input', Utils.debounce((e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { this.refreshAll(); return; }
      this.navigate('table');
      const el = document.getElementById('view-table');
      el.querySelectorAll('.data-table tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }, 250));
  },

  _bindSidebar() {
    document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  },

  _bindExportImport() {
    document.getElementById('btn-export').addEventListener('click', () => {
      const data = Store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'unitrack_backup.json'; a.click();
      URL.revokeObjectURL(url);
      Utils.toast('Data exported!', 'success');
    });
    document.getElementById('btn-import').addEventListener('click', () => this.showModal('import'));
  },

  navigate(view) {
    if (!['dashboard','kanban','table'].includes(view)) view = 'dashboard';
    this.currentView = view;
    location.hash = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === view));
    this.renderView(view);
    document.getElementById('sidebar').classList.remove('open');
  },

  renderView(view) {
    if (view === 'dashboard') Dashboard.render();
    else if (view === 'kanban') Kanban.render();
    else if (view === 'table') TableView.render();
  },

  refreshAll() { this.renderView(this.currentView); Panel.refresh(); },

  openCoursePanel(cid) { Panel.openCourse(cid); },

  async logout() {
    await supabaseClient.auth.signOut();
    location.reload();
  },

  // --- Modal System ---
  showModal(type, arg1, arg2) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    let html = '';

    if (type === 'addUniversity' || type === 'editUniversity') {
      const u = type === 'editUniversity' ? Store.getUniversity(arg1) : null;
      html = `<div class="modal-header"><h2>${u?'Edit':'Add'} University</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body"><form id="modal-form" onsubmit="App._saveUniversity(event,'${u?u.id:''}')">
          <div class="form-row"><div class="form-group" style="flex:0 0 70px"><label>Emoji</label><input name="emoji" value="${u?u.emoji:'🎓'}" maxlength="4" required></div>
            <div class="form-group"><label>Name</label><input name="name" value="${u?Utils.esc(u.name):''}" required placeholder="e.g. MIT"></div></div>
          <div class="form-row"><div class="form-group"><label>Country</label><input name="country" value="${u?Utils.esc(u.country):''}" placeholder="e.g. USA"></div>
            <div class="form-group"><label>Website</label><input name="website" value="${u?Utils.esc(u.website):''}" placeholder="https://..."></div></div>
          <div class="form-group"><label>Notes</label><textarea name="notes">${u?Utils.esc(u.notes):''}</textarea></div>
          <div class="form-actions"><button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn-primary">${u?'Save':'Add University'}</button></div>
        </form></div>`;
    } else if (type === 'addCourse' || type === 'editCourse') {
      const c = type === 'editCourse' ? Store.getCourse(arg1) : null;
      const defStatus = (!c && arg1 && Utils.STATUSES.includes(arg1)) ? arg1 : (c?c.status:'Researching');
      const defUni = (!c && arg2) ? arg2 : (c?c.universityId:'');
      const unis = Store.getUniversities();
      html = `<div class="modal-header"><h2>${c?'Edit':'Add'} Course</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body"><form id="modal-form" onsubmit="App._saveCourse(event,'${c?c.id:''}')">
          <div class="form-group"><label>University</label><select name="universityId" required><option value="">Select...</option>${unis.map(u=>`<option value="${u.id}" ${defUni===u.id?'selected':''}>${u.emoji} ${Utils.esc(u.name)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Course Name</label><input name="name" value="${c?Utils.esc(c.name):''}" required placeholder="e.g. MS Computer Science"></div>
          <div class="form-row"><div class="form-group"><label>Degree</label><select name="degree">${Utils.DEGREES.map(d=>`<option ${(c?c.degree:'MS')===d?'selected':''}>${d}</option>`).join('')}</select></div>
            <div class="form-group"><label>Department</label><input name="department" value="${c?Utils.esc(c.department):''}" placeholder="e.g. CS"></div></div>
          <div class="form-row"><div class="form-group"><label>Status</label><select name="status">${Utils.STATUSES.map(s=>`<option ${defStatus===s?'selected':''}>${s}</option>`).join('')}</select></div>
            <div class="form-group"><label>Priority</label><select name="priority">${Utils.PRIORITIES.map(p=>`<option ${(c?c.priority:'Medium')===p?'selected':''}>${p}</option>`).join('')}</select></div></div>
          <div class="form-row"><div class="form-group"><label>Deadline</label><input type="date" name="deadline" value="${c?Utils.inputDate(c.deadline):''}"></div>
            <div class="form-group"><label>Fee</label><input name="applicationFee" value="${c?Utils.esc(c.applicationFee):''}" placeholder="e.g. $75"></div></div>
          <div class="form-group"><label>Notes</label><textarea name="notes">${c?Utils.esc(c.notes):''}</textarea></div>
          <div class="form-actions"><button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn-primary">${c?'Save':'Add Course'}</button></div>
        </form></div>`;
    } else if (type === 'addRequirement') {
      html = `<div class="modal-header"><h2>Add Requirement</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body"><form id="modal-form" onsubmit="App._saveRequirement(event,'${arg1}')">
          <div class="form-group"><label>Requirement</label><input name="label" required placeholder="e.g. Statement of Purpose"></div>
          <div class="form-group"><label>Due Date</label><input type="date" name="dueDate"></div>
          <div class="form-group"><label>Notes</label><textarea name="notes"></textarea></div>
          <div class="form-actions"><button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn-primary">Add</button></div>
        </form></div>`;
    } else if (type === 'addDependency') {
      html = `<div class="modal-header"><h2>Add Dependency</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body"><form id="modal-form" onsubmit="App._saveDependency(event,'${arg1}')">
          <div class="form-group"><label>Dependency</label><input name="label" required placeholder="e.g. GRE Score ≥ 325"></div>
          <div class="form-group"><label>Status</label><select name="status">${Utils.DEP_STATUSES.map(s=>`<option>${s}</option>`).join('')}</select></div>
          <div class="form-group"><label>Notes</label><textarea name="notes"></textarea></div>
          <div class="form-actions"><button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn-primary">Add</button></div>
        </form></div>`;
    } else if (type === 'import') {
      html = `<div class="modal-header"><h2>Import Data</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
        <div class="modal-body"><form id="modal-form" onsubmit="App._doImport(event)">
          <div class="form-group"><label>Paste JSON or select file</label><textarea id="import-json" name="json" placeholder="Paste exported JSON..." style="min-height:120px"></textarea></div>
          <div class="form-group"><input type="file" accept=".json" onchange="App._readImportFile(event)"></div>
          <div class="form-actions"><button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn-primary">Import</button></div>
        </form></div>`;
    }
    container.innerHTML = html;
    overlay.classList.add('open');
  },

  closeModal() { document.getElementById('modal-overlay').classList.remove('open'); },

  _formData(e) { const fd = new FormData(e.target); const o = {}; fd.forEach((v,k)=>{o[k]=v}); return o; },

  _saveUniversity(e, id) {
    e.preventDefault(); const d = this._formData(e);
    if(id) { Store.updateUniversity(id,d); Utils.toast('University updated','success'); }
    else { Store.addUniversity(d); Utils.toast('University added','success'); }
    this.closeModal();
  },
  _saveCourse(e, id) {
    e.preventDefault(); const d = this._formData(e);
    if(id) { Store.updateCourse(id,d); Utils.toast('Course updated','success'); }
    else { Store.addCourse(d); Utils.toast('Course added','success'); }
    this.closeModal();
  },
  _saveRequirement(e, courseId) {
    e.preventDefault(); const d = this._formData(e); d.courseId = courseId; d.completed = false;
    Store.addRequirement(d); Utils.toast('Requirement added','success'); this.closeModal();
  },
  _saveDependency(e, courseId) {
    e.preventDefault(); const d = this._formData(e); d.courseId = courseId;
    Store.addDependency(d); Utils.toast('Dependency added','success'); this.closeModal();
  },
  _readImportFile(e) {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader(); r.onload = (ev) => { document.getElementById('import-json').value = ev.target.result; }; r.readAsText(f);
  },
  async _doImport(e) {
    e.preventDefault();
    const json = document.getElementById('import-json').value;
    if (await Store.importData(json)) { Utils.toast('Data imported!','success'); this.closeModal(); }
    else { Utils.toast('Invalid JSON','error'); }
  },
  confirmDelete(type, id) {
    const name = type==='university' ? Store.getUniversity(id)?.name : Store.getCourse(id)?.name;
    if (confirm(`Delete "${name||'this item'}"? This cannot be undone.`)) {
      if(type==='university') { Store.deleteUniversity(id); Panel.close(); }
      else { Store.deleteCourse(id); }
      Utils.toast(`Deleted`,'info');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
