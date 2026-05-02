/* UniTrack — Data Store (Supabase) */

const Store = {
  _data: { universities:[], courses:[], requirements:[], dependencies:[] },
  _userId: null,
  _listeners: [],

  async init(userId) {
    this._userId = userId;
    await this._fetchAll();
    if (this._data.universities.length === 0) await this.seed();
  },

  async _fetchAll() {
    const [u,c,r,d] = await Promise.all([
      supabaseClient.from('universities').select('*'),
      supabaseClient.from('courses').select('*'),
      supabaseClient.from('requirements').select('*'),
      supabaseClient.from('dependencies').select('*'),
    ]);
    this._data.universities = (u.data||[]).map(Store._fromU);
    this._data.courses = (c.data||[]).map(Store._fromC);
    this._data.requirements = (r.data||[]).map(Store._fromR);
    this._data.dependencies = (d.data||[]).map(Store._fromD);
  },

  onChange(fn) { this._listeners.push(fn); },
  _notify() { this._listeners.forEach(fn => fn()); },

  // --- Mapping ---
  _fromU(r) { return { id:r.id, name:r.name, country:r.country||'', website:r.website||'', emoji:r.emoji||'🎓', notes:r.notes||'', createdAt:r.created_at }; },
  _toU(u,uid) { return { id:u.id, user_id:uid, name:u.name, country:u.country||'', website:u.website||'', emoji:u.emoji||'🎓', notes:u.notes||'' }; },
  _fromC(r) { return { id:r.id, universityId:r.university_id, name:r.name, degree:r.degree||'MS', department:r.department||'', status:r.status||'Researching', deadline:r.deadline||'', priority:r.priority||'Medium', applicationFee:r.application_fee||'', notes:r.notes||'', createdAt:r.created_at }; },
  _toC(c,uid) { return { id:c.id, user_id:uid, university_id:c.universityId, name:c.name, degree:c.degree||'MS', department:c.department||'', status:c.status||'Researching', deadline:c.deadline||null, priority:c.priority||'Medium', application_fee:c.applicationFee||'', notes:c.notes||'' }; },
  _fromR(r) { return { id:r.id, courseId:r.course_id, label:r.label, completed:r.completed||false, dueDate:r.due_date||'', notes:r.notes||'' }; },
  _toR(r,uid) { return { id:r.id, user_id:uid, course_id:r.courseId, label:r.label, completed:r.completed||false, due_date:r.dueDate||null, notes:r.notes||'' }; },
  _fromD(r) { return { id:r.id, courseId:r.course_id, label:r.label, status:r.status||'Pending', notes:r.notes||'' }; },
  _toD(d,uid) { return { id:d.id, user_id:uid, course_id:d.courseId, label:d.label, status:d.status||'Pending', notes:d.notes||'' }; },

  // --- Universities ---
  getUniversities() { return this._data.universities; },
  getUniversity(id) { return this._data.universities.find(u=>u.id===id); },
  addUniversity(u) {
    u.id = crypto.randomUUID(); u.createdAt = new Date().toISOString();
    this._data.universities.push(u); this._notify();
    supabaseClient.from('universities').insert(Store._toU(u,this._userId)).then(({error})=>{if(error)console.error(error)});
    return u;
  },
  updateUniversity(id, upd) {
    const u = this.getUniversity(id); if(!u) return;
    Object.assign(u, upd); this._notify();
    supabaseClient.from('universities').update(Store._toU(u,this._userId)).eq('id',id).then(({error})=>{if(error)console.error(error)});
    return u;
  },
  deleteUniversity(id) {
    const cids = this._data.courses.filter(c=>c.universityId===id).map(c=>c.id);
    this._data.requirements = this._data.requirements.filter(r=>!cids.includes(r.courseId));
    this._data.dependencies = this._data.dependencies.filter(d=>!cids.includes(d.courseId));
    this._data.courses = this._data.courses.filter(c=>c.universityId!==id);
    this._data.universities = this._data.universities.filter(u=>u.id!==id);
    this._notify();
    // DB: delete cascaded items explicitly since we don't use FK
    cids.forEach(cid => {
      supabaseClient.from('requirements').delete().eq('course_id',cid).then(()=>{});
      supabaseClient.from('dependencies').delete().eq('course_id',cid).then(()=>{});
    });
    supabaseClient.from('courses').delete().eq('university_id',id).then(()=>{});
    supabaseClient.from('universities').delete().eq('id',id).then(({error})=>{if(error)console.error(error)});
  },

  // --- Courses ---
  getCourses() { return this._data.courses; },
  getCourse(id) { return this._data.courses.find(c=>c.id===id); },
  getCoursesByUniversity(uid) { return this._data.courses.filter(c=>c.universityId===uid); },
  addCourse(c) {
    c.id = crypto.randomUUID(); c.createdAt = new Date().toISOString();
    this._data.courses.push(c); this._notify();
    supabaseClient.from('courses').insert(Store._toC(c,this._userId)).then(({error})=>{if(error)console.error(error)});
    return c;
  },
  updateCourse(id, upd) {
    const c = this.getCourse(id); if(!c) return;
    Object.assign(c, upd); this._notify();
    supabaseClient.from('courses').update(Store._toC(c,this._userId)).eq('id',id).then(({error})=>{if(error)console.error(error)});
    return c;
  },
  deleteCourse(id) {
    this._data.requirements = this._data.requirements.filter(r=>r.courseId!==id);
    this._data.dependencies = this._data.dependencies.filter(d=>d.courseId!==id);
    this._data.courses = this._data.courses.filter(c=>c.id!==id);
    this._notify();
    supabaseClient.from('requirements').delete().eq('course_id',id).then(()=>{});
    supabaseClient.from('dependencies').delete().eq('course_id',id).then(()=>{});
    supabaseClient.from('courses').delete().eq('id',id).then(({error})=>{if(error)console.error(error)});
  },

  // --- Requirements ---
  getRequirements(cid) { return this._data.requirements.filter(r=>r.courseId===cid); },
  getAllRequirements() { return this._data.requirements; },
  addRequirement(r) {
    r.id = crypto.randomUUID(); this._data.requirements.push(r); this._notify();
    supabaseClient.from('requirements').insert(Store._toR(r,this._userId)).then(({error})=>{if(error)console.error(error)});
    return r;
  },
  updateRequirement(id, upd) {
    const r = this._data.requirements.find(x=>x.id===id); if(!r) return;
    Object.assign(r, upd); this._notify();
    supabaseClient.from('requirements').update(Store._toR(r,this._userId)).eq('id',id).then(({error})=>{if(error)console.error(error)});
    return r;
  },
  deleteRequirement(id) {
    this._data.requirements = this._data.requirements.filter(r=>r.id!==id); this._notify();
    supabaseClient.from('requirements').delete().eq('id',id).then(({error})=>{if(error)console.error(error)});
  },

  // --- Dependencies ---
  getDependencies(cid) { return this._data.dependencies.filter(d=>d.courseId===cid); },
  getAllDependencies() { return this._data.dependencies; },
  addDependency(d) {
    d.id = crypto.randomUUID(); this._data.dependencies.push(d); this._notify();
    supabaseClient.from('dependencies').insert(Store._toD(d,this._userId)).then(({error})=>{if(error)console.error(error)});
    return d;
  },
  updateDependency(id, upd) {
    const d = this._data.dependencies.find(x=>x.id===id); if(!d) return;
    Object.assign(d, upd); this._notify();
    supabaseClient.from('dependencies').update(Store._toD(d,this._userId)).eq('id',id).then(({error})=>{if(error)console.error(error)});
    return d;
  },
  deleteDependency(id) {
    this._data.dependencies = this._data.dependencies.filter(d=>d.id!==id); this._notify();
    supabaseClient.from('dependencies').delete().eq('id',id).then(({error})=>{if(error)console.error(error)});
  },

  // --- Export / Import ---
  exportData() { return JSON.stringify(this._data, null, 2); },
  async importData(json) {
    try {
      const data = JSON.parse(json);
      if (!data.universities || !data.courses) return false;
      // Clear existing
      await supabaseClient.from('dependencies').delete().eq('user_id', this._userId);
      await supabaseClient.from('requirements').delete().eq('user_id', this._userId);
      await supabaseClient.from('courses').delete().eq('user_id', this._userId);
      await supabaseClient.from('universities').delete().eq('user_id', this._userId);
      // Insert new
      if(data.universities.length) await supabaseClient.from('universities').insert(data.universities.map(u=>Store._toU(u,this._userId)));
      if(data.courses.length) await supabaseClient.from('courses').insert(data.courses.map(c=>Store._toC(c,this._userId)));
      if(data.requirements?.length) await supabaseClient.from('requirements').insert(data.requirements.map(r=>Store._toR(r,this._userId)));
      if(data.dependencies?.length) await supabaseClient.from('dependencies').insert(data.dependencies.map(d=>Store._toD(d,this._userId)));
      this._data = data;
      this._notify();
      return true;
    } catch(e) { console.error(e); return false; }
  },

  // --- Seed ---
  async seed() {
    const uid = this._userId;
    const unis = [
      { id:crypto.randomUUID(), name:'MIT', country:'USA', website:'https://mit.edu', emoji:'🏛️', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), name:'Stanford University', country:'USA', website:'https://stanford.edu', emoji:'🌲', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), name:'ETH Zurich', country:'Switzerland', website:'https://ethz.ch', emoji:'🇨🇭', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), name:'University of Toronto', country:'Canada', website:'https://utoronto.ca', emoji:'🍁', notes:'', createdAt:new Date().toISOString() },
    ];
    const courses = [
      { id:crypto.randomUUID(), universityId:unis[0].id, name:'MS Computer Science', degree:'MS', department:'EECS', status:'Applying', deadline:'2026-12-15', priority:'High', applicationFee:'$75', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), universityId:unis[0].id, name:'PhD EECS', degree:'PhD', department:'EECS', status:'Researching', deadline:'2026-12-15', priority:'Medium', applicationFee:'$75', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), universityId:unis[1].id, name:'MS Artificial Intelligence', degree:'MS', department:'CS', status:'Shortlisted', deadline:'2026-12-01', priority:'High', applicationFee:'$90', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), universityId:unis[2].id, name:'MS Data Science', degree:'MS', department:'CS', status:'Applied', deadline:'2026-07-15', priority:'Medium', applicationFee:'CHF 150', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), universityId:unis[3].id, name:'PhD Computer Science', degree:'PhD', department:'CS', status:'Shortlisted', deadline:'2026-11-01', priority:'Low', applicationFee:'CAD 125', notes:'', createdAt:new Date().toISOString() },
      { id:crypto.randomUUID(), universityId:unis[1].id, name:'MS Computer Science', degree:'MS', department:'CS', status:'Accepted', deadline:'2026-12-01', priority:'High', applicationFee:'$90', notes:'Received offer!', createdAt:new Date().toISOString() },
    ];
    const reqs = [
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'Statement of Purpose', completed:true, dueDate:'2026-12-10', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'3 Letters of Recommendation', completed:false, dueDate:'2026-12-10', notes:'Need 1 more' },
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'GRE Score Report', completed:true, dueDate:'2026-12-01', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'TOEFL Score Report', completed:true, dueDate:'2026-12-01', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'Official Transcripts', completed:false, dueDate:'2026-12-12', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[2].id, label:'Statement of Purpose', completed:false, dueDate:'2026-11-25', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[2].id, label:'3 Letters of Recommendation', completed:false, dueDate:'2026-11-25', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[2].id, label:'CV / Resume', completed:true, dueDate:'2026-11-20', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[3].id, label:'Motivation Letter', completed:true, dueDate:'2026-07-01', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[3].id, label:'2 Reference Letters', completed:true, dueDate:'2026-07-01', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[3].id, label:'Transcripts', completed:true, dueDate:'2026-07-01', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[4].id, label:'Research Proposal', completed:false, dueDate:'2026-10-20', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[4].id, label:'3 Letters of Recommendation', completed:false, dueDate:'2026-10-25', notes:'' },
    ];
    const deps = [
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'GRE Score ≥ 325', status:'Completed', notes:'Scored 328' },
      { id:crypto.randomUUID(), courseId:courses[0].id, label:'TOEFL Score ≥ 100', status:'Completed', notes:'Scored 112' },
      { id:crypto.randomUUID(), courseId:courses[2].id, label:'Strong research background', status:'In Progress', notes:'Working on publication' },
      { id:crypto.randomUUID(), courseId:courses[3].id, label:'GPA ≥ 3.5/4.0', status:'Completed', notes:'GPA: 3.8' },
      { id:crypto.randomUUID(), courseId:courses[4].id, label:'Published research paper', status:'Pending', notes:'' },
      { id:crypto.randomUUID(), courseId:courses[4].id, label:'IELTS ≥ 7.0', status:'In Progress', notes:'Exam booked for July' },
    ];

    // Insert in order
    await supabaseClient.from('universities').insert(unis.map(u=>Store._toU(u,uid)));
    await supabaseClient.from('courses').insert(courses.map(c=>Store._toC(c,uid)));
    await supabaseClient.from('requirements').insert(reqs.map(r=>Store._toR(r,uid)));
    await supabaseClient.from('dependencies').insert(deps.map(d=>Store._toD(d,uid)));

    this._data = { universities: unis, courses, requirements: reqs, dependencies: deps };
    this._notify();
  }
};
