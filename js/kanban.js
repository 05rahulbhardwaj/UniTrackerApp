/* UniTrack — Kanban Board View */

const Kanban = {
  dragCourseId: null,

  render() {
    const el = document.getElementById('view-kanban');
    const courses = Store.getCourses();

    el.innerHTML = `
      <div class="view-header">
        <h1 class="view-title">Application Board</h1>
        <button class="btn-primary btn-sm" onclick="App.showModal('addCourse')">+ Add Course</button>
      </div>
      <div class="kanban-board" id="kanban-board">
        ${Utils.STATUSES.map(status => {
          const col = courses.filter(c => c.status === status);
          return `<div class="kanban-column" data-status="${status}"
            ondragover="Kanban.onDragOver(event)" ondragleave="Kanban.onDragLeave(event)" ondrop="Kanban.onDrop(event)">
            <div class="kanban-column-header">
              <span class="kanban-column-dot" style="background:${Utils.statusColor(status)}"></span>
              <span class="kanban-column-title">${status}</span>
              <span class="kanban-column-count">${col.length}</span>
            </div>
            <div class="kanban-column-body">
              ${col.map(c => Kanban.renderCard(c)).join('')}
            </div>
            <button class="kanban-add-card" onclick="App.showModal('addCourse','${status}')">+ Add</button>
          </div>`;
        }).join('')}
      </div>
    `;
  },

  renderCard(c) {
    const uni = Store.getUniversity(c.universityId);
    const reqs = Store.getRequirements(c.id);
    const done = reqs.filter(r => r.completed).length;
    return `<div class="kanban-card" draggable="true" data-id="${c.id}"
      ondragstart="Kanban.onDragStart(event)" ondragend="Kanban.onDragEnd(event)"
      onclick="App.openCoursePanel('${c.id}')">
      <div class="kanban-card-header">
        <span class="kanban-card-title">${Utils.esc(c.name)}</span>
        <span class="priority-dot" style="background:${Utils.priorityColor(c.priority)}"></span>
      </div>
      <div class="kanban-card-uni">
        <span class="kanban-card-uni-emoji">${uni ? uni.emoji : '🎓'}</span>
        ${uni ? Utils.esc(uni.name) : '—'}
      </div>
      <div class="kanban-card-footer">
        <div class="kanban-card-meta">
          <span class="kanban-card-degree">${Utils.esc(c.degree)}</span>
          ${reqs.length > 0 ? `<span class="kanban-card-req ${done === reqs.length ? 'kanban-card-req-done' : ''}">${done}/${reqs.length}</span>` : ''}
        </div>
        ${c.deadline ? `<span class="deadline-badge ${Utils.deadlineClass(c.deadline)}">${Utils.deadlineLabel(c.deadline)}</span>` : ''}
      </div>
    </div>`;
  },

  onDragStart(e) {
    Kanban.dragCourseId = e.target.dataset.id;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
  },

  onDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    Kanban.dragCourseId = null;
  },

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = e.target.closest('.kanban-column');
    if (col) col.classList.add('drag-over');
  },

  onDragLeave(e) {
    const col = e.target.closest('.kanban-column');
    if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
  },

  onDrop(e) {
    e.preventDefault();
    const col = e.target.closest('.kanban-column');
    if (!col) return;
    col.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const newStatus = col.dataset.status;
    const course = Store.getCourse(id);
    if (course && course.status !== newStatus) {
      Store.updateCourse(id, { status: newStatus });
      Utils.toast(`Moved to ${newStatus}`, 'success');
    }
  }
};
