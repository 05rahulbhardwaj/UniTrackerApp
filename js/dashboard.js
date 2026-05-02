/* UniTrack — Dashboard View */

const Dashboard = {
  render() {
    const el = document.getElementById('view-dashboard');
    const unis = Store.getUniversities();
    const courses = Store.getCourses();
    const reqs = Store.getAllRequirements();
    const doneReqs = reqs.filter(r => r.completed).length;
    const totalReqs = reqs.length;
    const upcoming = courses.filter(c => c.deadline && Utils.daysUntil(c.deadline) >= 0)
      .sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 8);
    const accepted = courses.filter(c => c.status === 'Accepted').length;

    el.innerHTML = `
      <div class="view-header">
        <h1 class="view-title">Dashboard</h1>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card accent">
          <div class="stat-label">Universities</div>
          <div class="stat-value">${unis.length}</div>
          <div class="stat-sub">${courses.length} courses tracked</div>
        </div>
        <div class="stat-card ${accepted > 0 ? 'success' : ''}">
          <div class="stat-label">Accepted</div>
          <div class="stat-value">${accepted}</div>
          <div class="stat-sub">of ${courses.length} applications</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Upcoming Deadlines</div>
          <div class="stat-value">${upcoming.length}</div>
          <div class="stat-sub">${upcoming.filter(c => Utils.daysUntil(c.deadline) <= 7).length} within 7 days</div>
        </div>
        <div class="stat-card ${totalReqs > 0 && doneReqs === totalReqs ? 'success' : ''}">
          <div class="stat-label">Requirements Done</div>
          <div class="stat-value">${totalReqs > 0 ? Math.round(doneReqs/totalReqs*100) : 0}%</div>
          <div class="stat-sub">${doneReqs} of ${totalReqs} completed</div>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">Upcoming Deadlines</h2>
          <span class="section-subtitle">Next deadlines</span>
        </div>
        <div class="deadline-list" id="deadline-list">
          ${upcoming.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">No upcoming deadlines</div></div>' : upcoming.map(c => {
            const uni = Store.getUniversity(c.universityId);
            return `<div class="deadline-item" data-course-id="${c.id}" onclick="App.openCoursePanel('${c.id}')">
              <div class="deadline-item-emoji">${uni ? uni.emoji : '🎓'}</div>
              <div class="deadline-item-info">
                <div class="deadline-item-name">${Utils.esc(c.name)}</div>
                <div class="deadline-item-uni">${uni ? Utils.esc(uni.name) : '—'}</div>
              </div>
              <div class="deadline-item-badge">
                <span class="deadline-badge ${Utils.deadlineClass(c.deadline)}">${Utils.deadlineLabel(c.deadline)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">Universities</h2>
          <button class="btn-secondary btn-sm" onclick="App.showModal('addUniversity')">+ Add</button>
        </div>
        <div class="uni-grid">
          ${unis.map((u, i) => {
            const uCourses = Store.getCoursesByUniversity(u.id);
            const uReqs = uCourses.flatMap(c => Store.getRequirements(c.id));
            const uDone = uReqs.filter(r => r.completed).length;
            const pct = uReqs.length > 0 ? Math.round(uDone/uReqs.length*100) : 0;
            return `<div class="uni-card" style="animation-delay:${i*60}ms" onclick="Panel.openUniversity('${u.id}')">
              <div class="uni-card-header">
                <span class="uni-card-emoji">${u.emoji}</span>
                <div>
                  <div class="uni-card-title">${Utils.esc(u.name)}</div>
                  <div class="uni-card-country">${Utils.esc(u.country)}</div>
                </div>
              </div>
              <div class="uni-card-stats">
                <div class="uni-card-stat"><span>${uCourses.length}</span> courses</div>
                <div class="uni-card-stat"><span>${pct}%</span> reqs done</div>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }
};
