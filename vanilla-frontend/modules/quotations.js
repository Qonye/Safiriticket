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
  fetch('http://localhost:5000/api/clients')
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('filter-client');
      select.innerHTML += clients.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    });

  // Show system quotation creator by default
  renderSystemQuotationForm(document.getElementById('quotation-creator-area'));

  // Fetch and render quotations table with filters
  function fetchFilteredQuotations() {
    const client = document.getElementById('filter-client').value;
    const status = document.getElementById('filter-status').value;
    let url = 'http://localhost:5000/api/quotations?';
    if (client) url += `client=${encodeURIComponent(client)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    fetchQuotations(url);
  }

  document.getElementById('filter-apply-btn').onclick = fetchFilteredQuotations;

  // Initial fetch (all)
  fetchQuotations();
};

// --- System Quotation Creator ---
function renderSystemQuotationForm(container) {
  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <form id="quotation-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div>
          <label>Client<br>
            <select name="client" required style="padding:6px;width:180px;" id="quotation-client-select">
              <option value="">Loading...</option>
            </select>
          </label>
        </div>
        <div>
          <label>Expires At<br>
            <input type="date" name="expiresAt" style="padding:6px;width:140px;">
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
  fetch('http://localhost:5000/api/clients')
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
      const subtotal = qty * price;
      tr.querySelector('.item-subtotal').textContent = subtotal.toFixed(2);
      total += subtotal;
    });
    document.getElementById('items-total').textContent = `Total: $${total.toFixed(2)}`;
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
    // Gather items
    const items = Array.from(document.querySelectorAll('#items-tbody tr')).map(tr
