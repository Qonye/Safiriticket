// Make sure this attaches the function to window for global access
window.renderClients = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Clients</h2>
    <div style="margin-bottom:18px;">
      <form id="client-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div>
          <label>Name<br><input type="text" name="name" required style="padding:6px;width:180px;"></label>
        </div>
        <div>
          <label>Email<br><input type="email" name="email" required style="padding:6px;width:180px;"></label>
        </div>
        <div>
          <label>Phone<br><input type="text" name="phone" style="padding:6px;width:140px;"></label>
        </div>
        <button type="submit" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Client</button>
      </form>
      <div id="client-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
    <div id="clients-list">Loading...</div>
  `;

  function fetchClients() {
    fetch(`${window.API_BASE_URL}/api/clients`)
      .then(r => r.json())
      .then(clients => {
        if (!clients.length) {
          document.getElementById('clients-list').innerHTML = '<p>No clients found.</p>';
          return;
        }
        document.getElementById('clients-list').innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th style="background:#8c241c;">Name</th>
                <th style="background:#8c241c;">Email</th>
                <th style="background:#8c241c;">Phone</th>
                <th style="background:#8c241c;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map(c => `
                <tr data-id="${c._id}">
                  <td>
                    <span class="client-name">${c.name}</span>
                    <input class="edit-name" type="text" value="${c.name}" style="display:none;width:120px;padding:4px;">
                  </td>
                  <td>
                    <span class="client-email">${c.email}</span>
                    <input class="edit-email" type="email" value="${c.email}" style="display:none;width:140px;padding:4px;">
                  </td>
                  <td>
                    <span class="client-phone">${c.phone || ''}</span>
                    <input class="edit-phone" type="text" value="${c.phone || ''}" style="display:none;width:100px;padding:4px;">
                  </td>
                  <td>
                    <button class="edit-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit</button>
                    <button class="save-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Save</button>
                    <button class="cancel-btn" style="background:#b47572;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Cancel</button>
                    <button class="delete-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        // Edit, Save, Cancel, Delete handlers
        document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            tr.querySelector('.client-name').style.display = 'none';
            tr.querySelector('.client-email').style.display = 'none';
            tr.querySelector('.client-phone').style.display = 'none';
            tr.querySelector('.edit-name').style.display = '';
            tr.querySelector('.edit-email').style.display = '';
            tr.querySelector('.edit-phone').style.display = '';
            tr.querySelector('.save-btn').style.display = '';
            tr.querySelector('.cancel-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.cancel-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            tr.querySelector('.client-name').style.display = '';
            tr.querySelector('.client-email').style.display = '';
            tr.querySelector('.client-phone').style.display = '';
            tr.querySelector('.edit-name').style.display = 'none';
            tr.querySelector('.edit-email').style.display = 'none';
            tr.querySelector('.edit-phone').style.display = 'none';
            tr.querySelector('.save-btn').style.display = 'none';
            tr.querySelector('.edit-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.save-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const name = tr.querySelector('.edit-name').value.trim();
            const email = tr.querySelector('.edit-email').value.trim();
            const phone = tr.querySelector('.edit-phone').value.trim();
            fetch(`${window.API_BASE_URL}/api/clients/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, phone })
            })
              .then(r => r.json())
              .then(() => fetchClients());
          };
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.onclick = function() {
            if (!confirm('Delete this client?')) return;
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            fetch(`${window.API_BASE_URL}/api/clients/${id}`, {
              method: 'DELETE'
            })
              .then(r => r.json())
              .then(() => fetchClients());
          };
        });
      });
  }

  fetchClients();

  document.getElementById('client-form').onsubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim()
    };
    fetch(`${window.API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(client => {
        document.getElementById('client-form-msg').textContent = 'Client added!';
        form.reset();
        fetchClients();
        setTimeout(() => {
          document.getElementById('client-form-msg').textContent = '';
        }, 1500);
      })
      .catch(() => {
        document.getElementById('client-form-msg').textContent = 'Error adding client.';
      });
  };
};
