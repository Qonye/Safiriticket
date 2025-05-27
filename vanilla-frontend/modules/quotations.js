// Helper function to get currency symbol (accessible globally)
function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'KES': 'KSh',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return symbols[currency] || '$';
}

// Make function globally accessible
window.getCurrencySymbol = getCurrencySymbol;

// Attach to window for global access
window.renderQuotations = function(main) {
  
  main.innerHTML = `
    <h2 style="color:#8c241c;">Quotations</h2>
    <div id="quotation-creator-area"></div>
    <div style="margin-bottom:18px;display:flex;gap:16px;align-items:center;">
      <label>Client:
        <select id="filter-client" style="padding:6px;width:160px;">
          <option value="">All</option>
        </select>
      </label>
      <label>Status:
        <select id="filter-status" style="padding:6px;width:120px;">
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Expired">Expired</option>
        </select>
      </label>
      <button id="filter-apply-btn" style="padding:6px 14px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Filter</button>
    </div>
    <div id="quotations-list">Loading...</div>
  `;

  // Populate client filter dropdown
  fetch(`${window.API_BASE_URL}/api/clients`)
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('filter-client');
      select.innerHTML += clients.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    });

  // Show system quotation creator by default
  renderSystemQuotationForm(document.getElementById('quotation-creator-area'), fetchFilteredQuotations);

  // Fetch and render quotations table with filters
  function fetchFilteredQuotations() {
    const client = document.getElementById('filter-client').value;
    const status = document.getElementById('filter-status').value;
    let url = `${window.API_BASE_URL}/api/quotations?`;
    if (client) url += `client=${encodeURIComponent(client)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    fetchQuotations(url);
  }

  document.getElementById('filter-apply-btn').onclick = fetchFilteredQuotations;

  // Initial fetch (all)
  fetchQuotations();
  
  // Fetch and render quotations table with filters
  function fetchQuotations(url = `${window.API_BASE_URL}/api/quotations`) {
    const listDiv = document.getElementById('quotations-list');
    listDiv.textContent = 'Loading...';
    fetch(url)
      .then(r => r.json())
      .then(quotations => {
        if (!Array.isArray(quotations) || quotations.length === 0) {
          listDiv.textContent = 'No quotations found.';
          return;
        }
        // Render a table of quotations with actions
        listDiv.innerHTML = `
          <style>
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
              font-size: 1em;
              background: #fff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            }
            .data-table th {
              background: #8c241c;
              color: #fff;
              padding: 10px 8px;
              font-weight: 600;
              border-bottom: 2px solid #7a1f18;
              text-align: left;
            }
            .data-table td {
              padding: 9px 8px;
              border-bottom: 1px solid #eee;
              vertical-align: middle;
            }
            .data-table tr:nth-child(even) {
              background: #f9f6f5;
            }
            .data-table tr:hover {
              background: #f3e7e6;
            }
            .data-table select, .data-table button, .data-table a {
              font-size: 1em;
            }
            .data-table .q-status-select {
              padding: 4px 8px;
              border-radius: 4px;
              border: 1px solid #ccc;
              background: #fff;
              color: #8c241c;
              font-weight: 500;
            }
            .data-table .q-view-btn,
            .data-table .q-delete-btn {
              background: none;
              border: none;
              cursor: pointer;
              font-size: 1.1em;
              padding: 2px 6px;
              border-radius: 4px;
              transition: background 0.2s;
            }
            .data-table .q-view-btn:hover {
              background: #e5cfcf;
            }
            .data-table .q-delete-btn:hover {
              background: #fbeaea;
              color: #b71c1c;
            }
            .data-table a[download] {
              color: #8c241c;
              text-decoration: none;
              font-size: 1.1em;
            }
            .data-table a[download]:hover {
              text-decoration: underline;
              background: #f3e7e6;
            }
          </style>
          <table class="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Client</th>
                <th>Status</th>
                <th>Total</th>
                <th>Expires At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${quotations.map(q => `
                <tr data-id="${q._id}">
                  <td>${q.number || ''}</td>
                  <td>${q.client?.name || ''}</td>
                  <td>
                    <select class="q-status-select" data-current="${q.status}">
                      ${['Pending','Accepted','Declined','Expired'].map(status =>
                        `<option value="${status}"${q.status===status?' selected':''}>${status}</option>`
                      ).join('')}
                    </select>
                  </td>
                  <td>${getCurrencySymbol(q.currency || 'USD')}${q.total?.toFixed ? q.total.toFixed(2) : q.total || 0}</td>
                  <td>${q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : ''}</td>                  <td>
                    <button class="q-view-btn" title="View">👁️</button>
                    ${q.isExternal && q.externalPdfUrl ? `
                      <a href="${window.API_BASE_URL}/api/pdf/download/${q._id}" target="_blank" download style="margin-left:4px;" title="Download PDF">📄</a>
                    ` : ''}
                    <button class="q-delete-btn" title="Delete" style="margin-left:4px;">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        // Attach status change handler
        listDiv.querySelectorAll('.q-status-select').forEach(select => {
          select.onchange = function() {
            const tr = select.closest('tr');
            const id = tr.dataset.id;
            const newStatus = select.value;
            // Only update if changed
            if (select.dataset.current !== newStatus) {
              fetch(`${window.API_BASE_URL}/api/quotations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
              })
              .then(r => r.json())
              .then(() => fetchQuotations(url));
            }
          };
        });

        // Attach action handlers
        listDiv.querySelectorAll('.q-accept-btn').forEach(btn => {
          btn.onclick = function() {
            const id = btn.closest('tr').dataset.id;
            fetch(`${window.API_BASE_URL}/api/quotations/${id}/accept`, { method: 'POST' })
              .then(r => r.json())
              .then(() => fetchQuotations(url));
          };
        });
        listDiv.querySelectorAll('.q-decline-btn').forEach(btn => {
          btn.onclick = function() {
            const id = btn.closest('tr').dataset.id;
            fetch(`${window.API_BASE_URL}/api/quotations/${id}/decline`, { method: 'POST' })
              .then(r => r.json())
              .then(() => fetchQuotations(url));
          };
        });
        listDiv.querySelectorAll('.q-delete-btn').forEach(btn => {
          btn.onclick = function() {
            const id = btn.closest('tr').dataset.id;
            if (confirm('Delete this quotation?')) {
              fetch(`${window.API_BASE_URL}/api/quotations/${id}`, { method: 'DELETE' })
                .then(r => r.json())
                .then(() => fetchQuotations(url));
            }
          };
        });
        listDiv.querySelectorAll('.q-view-btn').forEach(btn => {
          btn.onclick = function() {
            const id = btn.closest('tr').dataset.id;
            viewQuotationModal(id);
          };
        });
      })
      .catch(err => {
        listDiv.textContent = 'Failed to load quotations.';
        console.error('Error loading quotations:', err);
      });
  }
};

// --- System Quotation Creator ---
function renderSystemQuotationForm(container, onQuotationAdded) {
  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <form id="quotation-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div>
          <label>Client<br>
            <select name="client" required style="padding:6px;width:180px;" id="quotation-client-select">
              <option value="">Loading...</option>
            </select>
          </label>
        </div>        <div>
          <label>Expires At<br>
            <input type="date" name="expiresAt" style="padding:6px;width:140px;">
          </label>
        </div>
        <div>
          <label>Currency<br>
            <select name="currency" id="quotation-currency-select" style="padding:6px;width:120px;">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="KES">KES</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </label>
        </div>
        <div>
          <label>Attach External PDF (optional)<br>
            <input type="file" name="pdf" accept="application/pdf">
          </label>
        </div>
      </form>
      <div style="width:100%;margin-top:14px;">
        <table id="items-table" class="data-table" style="margin-bottom:8px;">
          <thead>
            <tr>
              <th style="background:#8c241c;">Description</th>
              <th style="background:#8c241c;">Quantity</th>
              <th style="background:#8c241c;">Price</th>
              <th style="background:#8c241c;">Subtotal</th>
              <th style="background:#8c241c;">Action</th>
            </tr>
          </thead>
          <tbody id="items-tbody">
            <!-- The first row will be added by addQuotationItemRow() -->
          </tbody>
        </table>
        <button type="button" id="add-item-btn" style="padding:6px 14px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Item</button>
        <span id="items-total" style="margin-left:24px;font-weight:bold;color:#8c241c;">Total: $0</span>
      </div>
      <button type="submit" form="quotation-form" style="margin-top:14px;padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Quotation</button>
      <div id="quotation-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
  `;

  // Populate client dropdown
  fetch(`${window.API_BASE_URL}/api/clients`)
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('quotation-client-select');
      select.innerHTML = clients.length
        ? clients.map(c => `<option value="${c._id}">${c.name} (${c.email})</option>`).join('')
        : '<option value="">No clients</option>';
    });
  // --- Items logic ---
  
  function updateSubtotalsAndTotal() {
    let total = 0;
    document.querySelectorAll('#items-tbody tr').forEach(tr => {
      const qty = Number(tr.querySelector('.item-qty').value) || 0;
      const price = Number(tr.querySelector('.item-price').value) || 0;
      let subtotal = 0;
      let serviceFee = 0;
      const serviceFeeInput = tr.querySelector('.item-service-fee');
      if (serviceFeeInput) {
        serviceFee = Number(serviceFeeInput.value) || 0;
      }

      // Check if this is a hotel/accommodation row
      const productSelect = tr.querySelector('.item-product');
      const selectedOption = productSelect ? productSelect.options[productSelect.selectedIndex] : null;
      const type = selectedOption ? selectedOption.getAttribute('data-type') : 'other';

      if (type === 'hotel') {
        // Calculate number of nights
        const checkin = tr.querySelector('.item-checkin')?.value;
        const checkout = tr.querySelector('.item-checkout')?.value;
        let nights = 1;
        if (checkin && checkout) {
          const inDate = new Date(checkin);
          const outDate = new Date(checkout);
          nights = Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)));
        }
        subtotal = (qty * price * nights) + serviceFee;
        // Optionally, show nights in the UI
        let nightsSpan = tr.querySelector('.item-nights-span');
        if (!nightsSpan) {
          nightsSpan = document.createElement('span');
          nightsSpan.className = 'item-nights-span';
          nightsSpan.style = 'margin-left:8px;color:#8c241c;font-size:0.95em;';
          tr.querySelector('.item-price').parentNode.appendChild(nightsSpan);
        }
        nightsSpan.textContent = checkin && checkout ? `(${nights} night${nights > 1 ? 's' : ''})` : '';
      } else {
        subtotal = (qty * price) + serviceFee;
        // Remove nights span if not hotel
        const nightsSpan = tr.querySelector('.item-nights-span');
        if (nightsSpan) nightsSpan.remove();
      }      tr.querySelector('.item-subtotal').textContent = subtotal.toFixed(2);
      total += subtotal;
    });
    const currency = document.getElementById('quotation-currency-select')?.value || 'USD';
    const currencySymbol = getCurrencySymbol(currency);
    document.getElementById('items-total').textContent = `Total: ${currencySymbol}${total.toFixed(2)}`;
    return total;
  }

  // Helper to render the correct input fields for a selected service type
  function renderServiceFields(tr, type) {
    // Remove any previous dynamic fields
    const dynamic = tr.querySelector('.dynamic-fields');
    if (dynamic) dynamic.remove();

    // Add fields based on type
    let html = '';
    if (type === 'hotel') {
      html = `
        <div class="dynamic-fields" style="margin-top:4px;">
          <input type="text" class="item-hotel-name" placeholder="Hotel Name" style="width:110px;padding:4px;">
          <input type="date" class="item-checkin" placeholder="Check-in" style="width:110px;padding:4px;">
          <input type="date" class="item-checkout" placeholder="Check-out" style="width:110px;padding:4px;">
          <input type="number" class="item-service-fee" placeholder="Service Fee" style="width:90px;padding:4px;">
        </div>
      `;
    } else if (type === 'flight') {
      html = `
        <div class="dynamic-fields" style="margin-top:4px;">
          <input type="text" class="item-airline" placeholder="Airline" style="width:90px;padding:4px;">
          <input type="text" class="item-from" placeholder="From" style="width:70px;padding:4px;">
          <input type="text" class="item-to" placeholder="To" style="width:70px;padding:4px;">
          <input type="date" class="item-flight-date" placeholder="Date" style="width:110px;padding:4px;">
          <input type="number" class="item-service-fee" placeholder="Service Fee" style="width:90px;padding:4px;">
        </div>
      `;
    } else if (type === 'transfer') {
      html = `
        <div class="dynamic-fields" style="margin-top:4px;">
          <input type="text" class="item-from" placeholder="From" style="width:90px;padding:4px;">
          <input type="text" class="item-to" placeholder="To" style="width:90px;padding:4px;">
          <input type="number" class="item-service-fee" placeholder="Service Fee" style="width:90px;padding:4px;">
        </div>
      `;
    }
    // Add more types as needed...

    if (html) {
      tr.querySelector('td').insertAdjacentHTML('beforeend', html);
    }
  }

  async function addQuotationItemRow(desc = '', qty = 1, price = 0, productId = '', productType = '') {
    const options = await fetchProductsDropdownOptions();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <select class="item-product" style="width:140px;padding:4px;" required>
          <option value="">Select Service</option>
          ${options}
        </select>
        <input type="text" class="item-desc" style="width:120px;padding:4px;" placeholder="Description">
      </td>
      <td><input type="number" class="item-qty" min="1" value="${qty}" style="width:60px;padding:4px;" required></td>
      <td><input type="number" class="item-price" min="0" step="0.01" value="${price}" style="width:80px;padding:4px;" required></td>
      <td class="item-subtotal">0</td>
      <td><button type="button" class="remove-item-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Remove</button></td>
    `;
    document.getElementById('items-tbody').appendChild(tr);

    // Show dynamic fields if a type is provided (for edit/restore)
    if (productType) renderServiceFields(tr, productType);

    // Attach events
    attachItemEvents(tr);

    // Service select event: show/hide description and render dynamic fields
    tr.querySelector('.item-product').addEventListener('change', function() {
      const selected = this.options[this.selectedIndex];
      const type = selected.getAttribute('data-type');
      // Always show description field
      tr.querySelector('.item-desc').style.display = '';
      renderServiceFields(tr, type);
    });

    updateSubtotalsAndTotal();
  }

  function attachItemEvents(tr) {
    tr.querySelector('.item-qty').addEventListener('input', updateSubtotalsAndTotal);
    tr.querySelector('.item-price').addEventListener('input', updateSubtotalsAndTotal);
    tr.querySelector('.remove-item-btn').addEventListener('click', () => {
      tr.remove();
      updateSubtotalsAndTotal();
    });
  }

  // Always add the first row with service select on page load
  addQuotationItemRow();

  document.getElementById('add-item-btn').onclick = () => addQuotationItemRow();

  document.getElementById('quotation-form').onsubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const quotationMsg = document.getElementById('quotation-form-msg');
    quotationMsg.textContent = 'Submitting...';

    // Gather items
    const items = Array.from(document.querySelectorAll('#items-tbody tr')).map(tr => {
      const productSelect = tr.querySelector('.item-product');
      const selectedOption = productSelect ? productSelect.options[productSelect.selectedIndex] : null;
      const type = selectedOption ? selectedOption.getAttribute('data-type') : 'other';

      let serviceFee = 0;
      const serviceFeeInput = tr.querySelector('.item-service-fee');
      if (serviceFeeInput) {
        serviceFee = Number(serviceFeeInput.value) || 0;
      }

      // Always include required fields for the model
      const item = {
        description: tr.querySelector('.item-desc').value.trim(),
        quantity: Number(tr.querySelector('.item-qty').value),
        price: Number(tr.querySelector('.item-price').value),
        serviceFee: serviceFee
      };

      // Add dynamic fields only if they have a value
      if (type === 'hotel') {
        const hotelName = tr.querySelector('.item-hotel-name')?.value.trim();
        const checkin = tr.querySelector('.item-checkin')?.value;
        const checkout = tr.querySelector('.item-checkout')?.value;
        if (hotelName) item.hotelName = hotelName;
        if (checkin) item.checkin = checkin;
        if (checkout) item.checkout = checkout;
      } else if (type === 'flight') {
        const airline = tr.querySelector('.item-airline')?.value.trim();
        const from = tr.querySelector('.item-from')?.value.trim();
        const to = tr.querySelector('.item-to')?.value.trim();
        const flightDate = tr.querySelector('.item-flight-date')?.value;
        const flightClass = tr.querySelector('.item-class')?.value.trim();
        if (airline) item.airline = airline;
        if (from) item.from = from;
        if (to) item.to = to;
        if (flightDate) item.flightDate = flightDate;
        if (flightClass) item.class = flightClass;
      } else if (type === 'transfer') {
        const from = tr.querySelector('.item-from')?.value.trim();
        const to = tr.querySelector('.item-to')?.value.trim();
        if (from) item.from = from;
        if (to) item.to = to;
      }
      // ...add more types as needed...

      return item;
    }).filter(item =>
      item.description && item.quantity > 0 && item.price >= 0
    );

    if (items.length === 0 && !form.pdf.files[0]) {
      quotationMsg.textContent = 'Please add at least one item or attach a PDF.';
      return;
    }    const total = updateSubtotalsAndTotal();
    const clientId = form.client.value;
    const expiresAt = form.expiresAt.value;
    const currency = form.currency.value || 'USD';
    const pdfFile = form.pdf.files[0];

    let payload;
    const headers = {};

    if (pdfFile) {
      payload = new FormData();
      payload.append('client', clientId);
      if (expiresAt) payload.append('expiresAt', expiresAt);
      payload.append('currency', currency);
      // Always send items as a JSON string, even if empty, to match backend expectations
      payload.append('items', JSON.stringify(items.length ? items : []));
      payload.append('total', total);
      // Always include the filename for Cloudinary compatibility
      payload.append('pdf', pdfFile, pdfFile.name);
      payload.append('isExternal', 'true');
      // --- Fix: Remove Content-Type header if present ---
      // If you previously set headers['Content-Type'], remove it here:
      // delete headers['Content-Type'];
    } else {
      payload = JSON.stringify({
        client: clientId,
        expiresAt: expiresAt || null,
        currency: currency,
        items: items,
        total: total,
        isExternal: false
      });
      headers['Content-Type'] = 'application/json';
    }

    fetch(`${window.API_BASE_URL}/api/quotations`, {
      method: 'POST',
      // Only set headers if not using FormData
      headers: pdfFile ? undefined : headers,
      body: payload
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(newQuotation => {
      quotationMsg.textContent = 'Quotation added successfully!';
      form.reset();
      document.getElementById('items-tbody').innerHTML = '';
      addQuotationItemRow();
      updateSubtotalsAndTotal();
      if (typeof onQuotationAdded === 'function') onQuotationAdded();
      setTimeout(() => {
        quotationMsg.textContent = '';
      }, 2000);
    })
    .catch(error => {
      console.error('Error adding quotation:', error);
      let msg = 'Could not add quotation.';
      if (typeof error === 'object' && error !== null) {
        if (error.error) msg = error.error;
        if (error.details) msg += ` (${error.details})`;
      } else if (typeof error === 'string') {
        msg = error;
      }
      quotationMsg.textContent = `Error: ${msg}`;
    });
  };
}

// --- View Quotation Modal ---
function viewQuotationModal(id) {
  fetch(`${window.API_BASE_URL}/api/quotations/${id}`)
    .then(r => r.json())
    .then(q => {
      // Simple modal implementation
      let modal = document.getElementById('quotation-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quotation-modal';
        modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div style="background:#fff;padding:24px;max-width:600px;width:95vw;border-radius:8px;position:relative;">
          <button id="q-modal-close" style="position:absolute;top:8px;right:8px;font-size:1.2em;">✖</button>
          <h3>Quotation ${q.number || ''}</h3>
          <div><b>Client:</b> ${q.client?.name || ''}</div>
          <div><b>Status:</b> ${q.status || ''}</div>
          <div><b>Total:</b> $${q.total?.toFixed ? q.total.toFixed(2) : q.total || 0}</div>
          <div><b>Expires At:</b> ${q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : ''}</div>
          <div style="margin:10px 0;">
            <b>Items:</b>
            <ul>
              ${(q.items || []).map(item => `
                <li>
                  <b>${item.description || ''}</b>
                  (${item.quantity} x $${item.price})
                  ${typeof item.serviceFee === 'number' && item.serviceFee > 0 ? `, Service Fee: $${item.serviceFee}` : ''}
                  ${item.hotelName ? `, Hotel: ${item.hotelName}` : ''}
                  ${item.checkin ? `, Check-in: ${item.checkin}` : ''}
                  ${item.checkout ? `, Check-out: ${item.checkout}` : ''}
                  ${item.airline ? `, Airline: ${item.airline}` : ''}
                  ${item.from ? `, From: ${item.from}` : ''}
                  ${item.to ? `, To: ${item.to}` : ''}
                  ${item.flightDate ? `, Flight Date: ${item.flightDate}` : ''}
                  ${item.class ? `, Class: ${item.class}` : ''}
                </li>
              `).join('')}
            </ul>
          </div>          ${q.isExternal && q.externalPdfUrl ? `
            <div>
              <a href="${window.API_BASE_URL}/api/pdf/download/${q._id}" target="_blank" download style="color:#8c241c;">Download/View PDF</a>
            </div>
          ` : ''}
        </div>
      `;
      modal.onclick = e => {
        if (e.target === modal || e.target.id === 'q-modal-close') modal.remove();
      };
    });
}
