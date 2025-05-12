// Attach to window for global access
window.renderServices = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Services</h2>
    <div style="margin-bottom:18px;">
      <form id="service-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <input type="hidden" name="serviceId" id="service-id">
        <div>
          <label>Name<br>
            <input type="text" name="name" required style="padding:6px;width:180px;">
          </label>
        </div>
        <div>
          <label>Type<br>
            <select name="type" required style="padding:6px;width:140px;">
              <option value="">Select Type</option>
              <option value="hotel">Hotel</option>
              <option value="flight">Flight</option>
              <option value="transfer">Transfer</option>
              <option value="activity">Activity</option>
              <option value="fee">Fee/Other</option>
            </select>
          </label>
        </div>
        <div>
          <label>Description<br>
            <input type="text" name="description" style="padding:6px;width:220px;">
          </label>
        </div>
        <button type="button" id="quick-add-flight" style="padding:6px 12px;background:#ee9f64;color:#fff;border:none;border-radius:6px;cursor:pointer;">Quick Add Flight Service</button>
        <button type="submit" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Save Service</button>
      </form>
      <div id="service-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
    <div id="services-list">Loading...</div>
  `;

  // Add credentials: 'include' to all fetches to /api endpoints
  const originalFetch = window.fetch;
  window.fetch = function(resource, options = {}) {
    if (typeof resource === 'string' && resource.startsWith(window.API_BASE_URL + '/api')) {
      options.credentials = 'include';
    }
    return originalFetch(resource, options);
  };

  function fetchServices() {
    fetch(`${window.API_BASE_URL}/api/products`)
      .then(r => r.json())
      .then(services => {
        if (!services.length) {
          document.getElementById('services-list').innerHTML = '<p>No services found.</p>';
          return;
        }
        document.getElementById('services-list').innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th style="background:#8c241c;">Name</th>
                <th style="background:#8c241c;">Type</th>
                <th style="background:#8c241c;">Description</th>
                <th style="background:#8c241c;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${services.map(s => `
                <tr data-id="${s._id}">
                  <td>${s.name}</td>
                  <td>${s.type}</td>
                  <td>${s.description || ''}</td>
                  <td>
                    <button class="edit-service-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit</button>
                    <button class="delete-service-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        document.querySelectorAll('.delete-service-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            if (!confirm('Delete this service?')) return;
            fetch(`${window.API_BASE_URL}/api/products/${id}`, {
              method: 'DELETE'
            })
              .then(r => r.json())
              .then(() => fetchServices());
          };
        });

        document.querySelectorAll('.edit-service-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            fetch(`${window.API_BASE_URL}/api/products/${id}`)
              .then(r => r.json())
              .then(service => {
                document.querySelector('#service-id').value = service._id;
                document.querySelector('input[name="name"]').value = service.name;
                document.querySelector('select[name="type"]').value = service.type;
                document.querySelector('input[name="description"]').value = service.description || '';
                // Optionally, handle fields editing if needed
                // Scroll to form for better UX
                document.getElementById('service-form').scrollIntoView({ behavior: 'smooth' });
                // Change button text to indicate edit mode
                document.querySelector('#service-form button[type="submit"]').textContent = 'Update Service';
              });
          };
        });
      });
  }

  fetchServices();

  document.getElementById('service-form').onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const id = form.serviceId.value;
    const data = {
      name: form.name.value.trim(),
      type: form.type.value,
      description: form.description.value.trim()
    };
    let url = `${window.API_BASE_URL}/api/products`;
    let method = 'POST';
    if (id) {
      url += `/${id}`;
      method = 'PUT';
    }
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(service => {
        // Clear the hidden id field so next submit is always add, not update
        form.reset();
        form.serviceId.value = '';
        document.querySelector('#service-form button[type="submit"]').textContent = 'Save Service';
        document.getElementById('service-form-msg').textContent = id ? 'Service updated!' : 'Service added!';
        fetchServices();
        setTimeout(() => {
          document.getElementById('service-form-msg').textContent = '';
        }, 1500);
      })
      .catch(() => {
        document.getElementById('service-form-msg').textContent = 'Error saving service.';
      });
  };

  // Quick add flight service for demo/testing
  document.getElementById('quick-add-flight').onclick = function() {
    const data = {
      name: "Flight",
      type: "flight",
      description: "Flight booking service",
      fields: [
        { key: "description", label: "Description", inputType: "text", required: true },
        { key: "travelDate", label: "Travel Date", inputType: "date", required: true },
        { key: "airline", label: "Airline", inputType: "text", required: true },
        { key: "route", label: "Route", inputType: "text", required: true },
        { key: "class", label: "Class", inputType: "text", required: true },
        { key: "amount", label: "Amount", inputType: "number", required: true },
        { key: "service", label: "Service", inputType: "text", required: true },
        { key: "total", label: "Total", inputType: "number", required: true }
      ]
    };
    fetch(`${window.API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(service => {
        document.getElementById('service-form-msg').textContent = 'Flight service added!';
        fetchServices();
        setTimeout(() => {
          document.getElementById('service-form-msg').textContent = '';
        }, 1500);
      })
      .catch(() => {
        document.getElementById('service-form-msg').textContent = 'Error adding flight service.';
      });
  };
};
