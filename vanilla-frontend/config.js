// Define the base URL for your API.
// Make sure this file is loaded in your index.html before other scripts that make API calls.
window.API_BASE_URL =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://safiriticket.up.railway.app';
