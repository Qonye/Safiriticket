// Attach to window for global access
window.renderQuotations = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Quotations</h2>
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
            <tr>
              <td><input type="text" class="item-desc" style="width:140px;padding:4px;" required></td>
              <td><input type="number" class="item-qty" min="1" value="1" style="width:60px;padding:4px;" required></td>
              <td><input type="number" class="item-price" min="0" step="0.01" value="0" style="width:80px;padding:4px;" required></td>
              <td class="item-subtotal">0</td>
              <td><button type="button" class="remove-item-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Remove</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" id="add-item-btn" style="padding:6px 14px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Item</button>
        <span id="items-total" style="margin-left:24px;font-weight:bold;color:#8c241c;">Total: $0</span>
      </div>
      <button type="submit" form="quotation-form" style="margin-top:14px;padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Quotation</button>
      <div id="quotation-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
    <div id="quotations-list">Loading...</div>
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

  function addItemRow(desc = '', qty = 1, price = 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="item-desc" style="width:140px;padding:4px;" value="${desc}" required></td>
      <td><input type="number" class="item-qty" min="1" value="${qty}" style="width:60px;padding:4px;" required></td>
      <td><input type="number" class="item-price" min="0" step="0.01" value="${price}" style="width:80px;padding:4px;" required></td>
      <td class="item-subtotal">0</td>
      <td><button type="button" class="remove-item-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Remove</button></td>
    `;
    document.getElementById('items-tbody').appendChild(tr);
    attachItemEvents(tr);
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

  // Attach events to initial row
  document.querySelectorAll('#items-tbody tr').forEach(attachItemEvents);

  document.getElementById('add-item-btn').onclick = () => addItemRow();

  // --- Quotation CRUD logic ---
  function fetchQuotations() {
    fetch('http://localhost:5000/api/quotations')
      .then(r => r.json())
      .then(quotations => {
        window.quotations = quotations;
        if (!quotations.length) {
          document.getElementById('quotations-list').innerHTML = '<p>No quotations found.</p>';
          return;
        }
        document.getElementById('quotations-list').innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th style="background:#8c241c;">Client</th>
                <th style="background:#8c241c;">Status</th>
                <th style="background:#8c241c;">Total</th>
                <th style="background:#8c241c;">Expires At</th>
                <th style="background:#8c241c;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${quotations.map(q => `
                <tr data-id="${q._id}">
                  <td>${q.client?.name || ''} <span style="color:#b47572;font-size:0.95em;">${q.client?.email || ''}</span></td>
                  <td>
                    <select class="status-select" style="padding:4px 8px;">
                      <option value="Pending" ${q.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Accepted" ${q.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                      <option value="Declined" ${q.status === 'Declined' ? 'selected' : ''}>Declined</option>
                      <option value="Expired" ${q.status === 'Expired' ? 'selected' : ''}>Expired</option>
                    </select>
                  </td>
                  <td>$${q.total || 0}</td>
                  <td>
                    <span class="expires-at-label">${q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : ''}</span>
                    <input type="date" class="edit-expires-at" value="${q.expiresAt ? new Date(q.expiresAt).toISOString().slice(0,10) : ''}" style="display:none;padding:4px;">
                  </td>
                  <td>
                    ${q.status === 'Accepted' ? `<button class="create-invoice-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Create Invoice</button>` : ''}
                    <button class="edit-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit</button>
                    <button class="save-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Save</button>
                    <button class="cancel-btn" style="background:#b47572;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Cancel</button>
                    <button class="delete-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Delete</button>
                    <button class="preview-quotation-btn" style="background:#8c241c;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Preview</button>
                    <button class="download-quotation-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">PDF</button>
                    <button class="email-quotation-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Email</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        // Status change handler
        document.querySelectorAll('.status-select').forEach(sel => {
          sel.onchange = function() {
            const tr = sel.closest('tr');
            const id = tr.getAttribute('data-id');
            fetch(`http://localhost:5000/api/quotations/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: sel.value })
            })
              .then(r => r.json())
              .then(() => fetchQuotations());
          };
        });

        // Create Invoice handler
        document.querySelectorAll('.create-invoice-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            fetch('http://localhost:5000/api/invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quotation: id })
            })
              .then(r => r.json())
              .then(() => {
                alert('Invoice created from quotation!');
              });
          };
        });

        // Edit, Save, Cancel handlers for expiresAt
        document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            tr.querySelector('.expires-at-label').style.display = 'none';
            tr.querySelector('.edit-expires-at').style.display = '';
            tr.querySelector('.save-btn').style.display = '';
            tr.querySelector('.cancel-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.cancel-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            tr.querySelector('.expires-at-label').style.display = '';
            tr.querySelector('.edit-expires-at').style.display = 'none';
            tr.querySelector('.save-btn').style.display = 'none';
            tr.querySelector('.edit-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.save-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const expiresAt = tr.querySelector('.edit-expires-at').value;
            fetch(`http://localhost:5000/api/quotations/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ expiresAt })
            })
              .then(r => r.json())
              .then(() => fetchQuotations());
          };
        });

        // Delete handler
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.onclick = function() {
            if (!confirm('Delete this quotation?')) return;
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            fetch(`http://localhost:5000/api/quotations/${id}`, {
              method: 'DELETE'
            })
              .then(r => r.json())
              .then(() => fetchQuotations());
          };
        });

        // Preview PDF
        document.querySelectorAll('.preview-quotation-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const quotation = window.quotations.find(q => q._id === id);
            if (!quotation) return;
            const template = await window.loadTemplate('quotation');
            const html = fillQuotationTemplate(template, quotation);
            window.previewPDF(html, { margin: 10, jsPDF: { format: 'a4' } });
          };
        });

        // Download PDF
        document.querySelectorAll('.download-quotation-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const quotation = window.quotations.find(q => q._id === id);
            if (!quotation) return;
            const template = await window.loadTemplate('quotation');
            const html = fillQuotationTemplate(template, quotation);
            window.downloadPDF(html, `quotation-${quotation.number || quotation._id}.pdf`, { margin: 10, jsPDF: { format: 'a4' } });
          };
        });

        // Send via Email
        document.querySelectorAll('.email-quotation-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            fetch(`http://localhost:5000/api/quotations/${id}/email`, { method: 'POST' })
              .then(r => r.json())
              .then(res => {
                btn.textContent = 'Sent!';
                setTimeout(() => { btn.textContent = 'Email'; btn.disabled = false; }, 1500);
              })
              .catch(() => {
                btn.textContent = 'Error';
                setTimeout(() => { btn.textContent = 'Email'; btn.disabled = false; }, 1500);
              });
          };
        });

        // (Optional) Add more edit fields as needed
      });
  }

  fetchQuotations();

  document.getElementById('quotation-form').onsubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    // Gather items
    const items = Array.from(document.querySelectorAll('#items-tbody tr')).map(tr => ({
      description: tr.querySelector('.item-desc').value.trim(),
      quantity: Number(tr.querySelector('.item-qty').value),
      price: Number(tr.querySelector('.item-price').value)
    })).filter(item => item.description && item.quantity > 0);

    const total = updateSubtotalsAndTotal();

    const data = {
      client: form.client.value,
      status: "Pending", // Always set to Pending on creation
      expiresAt: form.expiresAt.value,
      items,
      total
    };
    fetch('http://localhost:5000/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(quotation => {
        document.getElementById('quotation-form-msg').textContent = 'Quotation added!';
        form.reset();
        // Remove all item rows except one
        const tbody = document.getElementById('items-tbody');
        while (tbody.rows.length > 1) tbody.deleteRow(1);
        tbody.querySelector('.item-desc').value = '';
        tbody.querySelector('.item-qty').value = 1;
        tbody.querySelector('.item-price').value = 0;
        updateSubtotalsAndTotal();
        fetchQuotations();
        setTimeout(() => {
          document.getElementById('quotation-form-msg').textContent = '';
        }, 1500);
      })
      .catch(() => {
        document.getElementById('quotation-form-msg').textContent = 'Error adding quotation.';
      });
  };
};

async function previewQuotationPDF(quotation) {
  const template = await window.loadTemplate('quotation');
  // ...replace placeholders in template with quotation data...
  // ...generate PDF or show preview...
}

// Helper to fill template placeholders
function fillQuotationTemplate(template, quotation) {
  let html = template;
  html = html.replace(/{{number}}/g, quotation.number || '');
  html = html.replace(/{{clientName}}/g, quotation.client?.name || '');
  html = html.replace(/{{clientEmail}}/g, quotation.client?.email || '');
  html = html.replace(/{{status}}/g, quotation.status || '');
  html = html.replace(/{{expiresAt}}/g, quotation.expiresAt ? new Date(quotation.expiresAt).toLocaleDateString() : '');
  html = html.replace(/{{total}}/g, quotation.total || '');
  // Items
  const itemsHtml = (quotation.items || []).map(item =>
    `<tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>₹${item.price || ''}</td>
      <td>₹${item.quantity && item.price ? Number(item.quantity) * Number(item.price) : ''}</td>
    </tr>`
  ).join('');
  html = html.replace(/{{items}}/g, itemsHtml);
  // Fill org details and logo
  html = window.fillOrgDetails(html);
  return html;
}

// When rendering the quotation form or preview, do NOT allow manual entry for number.
// When displaying a new quotation preview, fetch the next number from the backend before rendering.

async function getNextQuotationNumber() {
  // Fetch all quotations and find the highest number, then increment
  const res = await fetch('http://localhost:5000/api/quotations');
  const quotations = await res.json();
  let max = 0;
  quotations.forEach(q => {
    if (q.number && typeof q.number === 'string') {
      const match = q.number.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
  });
  return 'Q-' + String(max + 1).padStart(3, '0');
}

// Example usage in preview or add form:
async function renderQuotationPreview(quotation) {
  let number = quotation.number;
  if (!number) {
    number = await getNextQuotationNumber();
  }
  const template = await window.loadTemplate('quotation');
  // Inject the number into the quotation object for template filling
  const html = window.fillQuotationTemplate(template, { ...quotation, number });
  window.previewPDF(html, {
    margin: [0, 0, 0, 0],
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2 }
  });
}
