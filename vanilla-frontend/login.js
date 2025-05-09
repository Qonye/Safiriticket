document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.style.display = 'none';

  try {
    const res = await fetch(window.API_BASE_URL + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json();
      errorMsg.textContent = data.error || 'Login failed';
      errorMsg.style.display = 'block';
      return;
    }
    // On success, store user info in sessionStorage
    const user = await res.json();
    sessionStorage.setItem('user', JSON.stringify(user));
    window.location.href = 'index.html';
  } catch (err) {
    errorMsg.textContent = 'Network error. Please try again.';
    errorMsg.style.display = 'block';
  }
});
