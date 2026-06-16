/**
 * auth.js — ArtStore Admin Authentication
 * Simple password-based guard stored in sessionStorage.
 */

const Auth = (() => {
  const ADMIN_PASSWORD = 'biswajeet';

  /**
   * Attempt login. Returns true on success.
   * @param {string} password
   */
  function login(password) {
    if (password === ADMIN_PASSWORD) {
      Storage.setAdminAuth(true);
      return true;
    }
    return false;
  }

  function logout() {
    Storage.clearAdminAuth();
    window.location.href = 'login.html';
  }

  /**
   * Guard — redirect to login if not authenticated.
   * Call at top of admin.js.
   */
  function requireAuth() {
    if (!Storage.isAdminAuthed()) {
      window.location.replace('login.html');
    }
  }

  return { login, logout, requireAuth };
})();
