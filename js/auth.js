/* UniTrack — Auth Module */

const Auth = {
  mode: 'login', // 'login' or 'signup'

  render() {
    const c = document.getElementById('auth-container');
    c.style.display = 'flex';
    c.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <span class="logo-icon">🎓</span>
          <h1>UniTrack</h1>
          <p>Track your university applications</p>
        </div>
        <div class="auth-tabs">
          <div class="auth-tab ${this.mode==='login'?'active':''}" onclick="Auth.switchMode('login')">Log In</div>
          <div class="auth-tab ${this.mode==='signup'?'active':''}" onclick="Auth.switchMode('signup')">Sign Up</div>
        </div>
        <div class="auth-body">
          <div id="auth-error" class="auth-error"></div>
          <div id="auth-success" class="auth-success"></div>
          <form id="auth-form" onsubmit="Auth.submit(event)">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="auth-email" required placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="auth-password" required placeholder="Min 6 characters" minlength="6" autocomplete="current-password">
            </div>
            <button type="submit" class="auth-submit" id="auth-btn">
              ${this.mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>`;
  },

  switchMode(mode) {
    this.mode = mode;
    this.render();
  },

  async submit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-btn');
    const errEl = document.getElementById('auth-error');
    const sucEl = document.getElementById('auth-success');
    errEl.classList.remove('visible');
    sucEl.classList.remove('visible');
    btn.disabled = true;
    btn.textContent = 'Please wait...';

    try {
      if (this.mode === 'login') {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change listener in App will handle the rest
      } else {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          sucEl.textContent = 'Check your email to confirm your account, then log in.';
          sucEl.classList.add('visible');
          btn.disabled = false;
          btn.textContent = 'Create Account';
          return;
        }
        // If auto-confirmed, auth state change handles it
      }
    } catch (err) {
      errEl.textContent = err.message || 'Something went wrong';
      errEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = this.mode === 'login' ? 'Log In' : 'Create Account';
    }
  },

  hide() {
    document.getElementById('auth-container').style.display = 'none';
  }
};
