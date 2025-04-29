// Attach to window for global access
window.renderInvoices = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Invoices</h2>
    <div style="margin-bottom:18px;">
      <form id="invoice-form" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div>
          <label>Client<br>
            <select name="client" required style="padding:6px;width:180px;" id="invoice-client-select">
              <option value="">Loading...</option>
            </select>
          </label>
        </div>
        <div>
          <label>Due Date<br>
            <input type="date" name="dueDate" style="padding:6px;width:140px;">
          </label>
        </div>
        <div>
          <label>From Quotation<br>
            <select name="quotation" id="invoice-quotation-select" style="padding:6px;width:180px;">
              <option value="">(Optional) Select Quotation</option>
            </select>
          </label>
        </div>
      </form>
      <div style="width:100%;margin-top:14px;">
        <table id="invoice-items-table" class="data-table" style="margin-bottom:8px;">
          <thead>
            <tr>
              <th style="background:#8c241c;">Description</th>
              <th style="background:#8c241c;">Quantity</th>
              <th style="background:#8c241c;">Price</th>
              <th style="background:#8c241c;">Subtotal</th>
              <th style="background:#8c241c;">Action</th>
            </tr>
          </thead>
          <tbody id="invoice-items-tbody">
            <tr>
              <td><input type="text" class="item-desc" style="width:140px;padding:4px;" required></td>
              <td><input type="number" class="item-qty" min="1" value="1" style="width:60px;padding:4px;" required></td>
              <td><input type="number" class="item-price" min="0" step="0.01" value="0" style="width:80px;padding:4px;" required></td>
              <td class="item-subtotal">0</td>
              <td><button type="button" class="remove-item-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Remove</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" id="add-invoice-item-btn" style="padding:6px 14px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Item</button>
        <span id="invoice-items-total" style="margin-left:24px;font-weight:bold;color:#8c241c;">Total: $0</span>
      </div>
      <button type="submit" form="invoice-form" style="margin-top:14px;padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Invoice</button>
      <div id="invoice-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
    <div id="invoices-list">Loading...</div>
  `;

  // Populate client dropdown
  fetch('http://localhost:5000/api/clients')
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('invoice-client-select');
      select.innerHTML = clients.length
        ? clients.map(c => `<option value="${c._id}">${c.name} (${c.email})</option>`).join('')
        : '<option value="">No clients</option>';
    });

  // Populate quotations dropdown (only accepted quotations)
  fetch('http://localhost:5000/api/quotations')
    .then(r => r.json())
    .then(quotations => {
      const select = document.getElementById('invoice-quotation-select');
      select.innerHTML += quotations
        .filter(q => q.status === 'Accepted')
        .map(q => `<option value="${q._id}">#${q._id.slice(-5)} - ${q.client?.name || ''} ($${q.total || 0})</option>`)
        .join('');
    });

  // --- Items logic ---
  function updateInvoiceSubtotalsAndTotal() {
    let total = 0;
    document.querySelectorAll('#invoice-items-tbody tr').forEach(tr => {
      const qty = Number(tr.querySelector('.item-qty').value) || 0;
      const price = Number(tr.querySelector('.item-price').value) || 0;
      const subtotal = qty * price;
      tr.querySelector('.item-subtotal').textContent = subtotal.toFixed(2);
      total += subtotal;
    });
    document.getElementById('invoice-items-total').textContent = `Total: $${total.toFixed(2)}`;
    return total;
  }

  function addInvoiceItemRow(desc = '', qty = 1, price = 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="item-desc" style="width:140px;padding:4px;" value="${desc}" required></td>
      <td><input type="number" class="item-qty" min="1" value="${qty}" style="width:60px;padding:4px;" required></td>
      <td><input type="number" class="item-price" min="0" step="0.01" value="${price}" style="width:80px;padding:4px;" required></td>
      <td class="item-subtotal">0</td>
      <td><button type="button" class="remove-item-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Remove</button></td>
    `;
    document.getElementById('invoice-items-tbody').appendChild(tr);
    attachInvoiceItemEvents(tr);
    updateInvoiceSubtotalsAndTotal();
  }

  function attachInvoiceItemEvents(tr) {
    tr.querySelector('.item-qty').addEventListener('input', updateInvoiceSubtotalsAndTotal);
    tr.querySelector('.item-price').addEventListener('input', updateInvoiceSubtotalsAndTotal);
    tr.querySelector('.remove-item-btn').addEventListener('click', () => {
      tr.remove();
      updateInvoiceSubtotalsAndTotal();
    });
  }

  // Attach events to initial row
  document.querySelectorAll('#invoice-items-tbody tr').forEach(attachInvoiceItemEvents);

  document.getElementById('add-invoice-item-btn').onclick = () => addInvoiceItemRow();

  // When a quotation is selected, fill in items and client
  document.getElementById('invoice-quotation-select').addEventListener('change', function() {
    const qid = this.value;
    if (!qid) return;
    fetch(`http://localhost:5000/api/quotations/${qid}`)
      .then(r => r.json())
      .then(q => {
        // Set client
        if (q.client && q.client._id) {
          document.getElementById('invoice-client-select').value = q.client._id;
        }
        // Set items
        const tbody = document.getElementById('invoice-items-tbody');
        tbody.innerHTML = '';
        (q.items || []).forEach(item => {
          addInvoiceItemRow(item.description, item.quantity, item.price);
        });
        updateInvoiceSubtotalsAndTotal();
      });
  });

  // --- Invoice CRUD logic ---
  function fetchInvoices() {
    fetch('http://localhost:5000/api/invoices')
      .then(r => r.json())
      .then(invoices => {
        window.invoices = invoices; // Store invoices globally
        if (!invoices.length) {
          document.getElementById('invoices-list').innerHTML = '<p>No invoices found.</p>';
          return;
        }
        document.getElementById('invoices-list').innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th style="background:#8c241c;">Client</th>
                <th style="background:#8c241c;">Status</th>
                <th style="background:#8c241c;">Total</th>
                <th style="background:#8c241c;">Paid</th>
                <th style="background:#8c241c;">Due</th>
                <th style="background:#8c241c;">Due Date</th>
                <th style="background:#8c241c;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => {
                const paid = Number(inv.paidAmount || 0);
                const total = Number(inv.total || 0);
                const due = Math.max(total - paid, 0).toFixed(2);
                return `
                <tr data-id="${inv._id}">
                  <td>${inv.client?.name || ''} <span style="color:#b47572;font-size:0.95em;">${inv.client?.email || ''}</span></td>
                  <td>
                    <select class="status-select" style="padding:4px 8px;">
                      <option value="Unpaid" ${inv.status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                      <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
                      <option value="Overdue" ${inv.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                    </select>
                  </td>
                  <td>$${total}</td>
                  <td>
                    <span class="paid-label">$${paid}</span>
                    <input type="number" class="edit-paid" min="0" max="${total}" value="${paid}" style="display:none;width:80px;padding:4px;">
                  </td>
                  <td>$${due}</td>
                  <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ''}</td>
                  <td>
                    <button class="edit-paid-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit Paid</button>
                    <button class="save-paid-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Save</button>
                    <button class="cancel-paid-btn" style="background:#b47572;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Cancel</button>
                    <button class="edit-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit</button>
                    <button class="delete-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Delete</button>
                    <button class="preview-invoice-btn" style="background:#8c241c;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Preview</button>
                    <button class="download-invoice-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">PDF</button>
                    <button class="email-invoice-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Email</button>
                  </td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;

        // Status change handler
        document.querySelectorAll('.status-select').forEach(sel => {
          sel.onchange = function() {
            const tr = sel.closest('tr');
            const id = tr.getAttribute('data-id');
            const newStatus = sel.value;
            // Always send paidAmount when marking as Paid
            let payload = { status: newStatus };
            if (newStatus === 'Paid') {
              // Find the total for this invoice
              const total = Number(tr.querySelector('td:nth-child(3)').textContent.replace('$', '')) || 0;
              payload.paidAmount = total;
            }
            fetch(`http://localhost:5000/api/invoices/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
              .then(r => r.json())
              .then(() => {
                fetchInvoices();
              });
          };
        });

        // Paid amount edit/save/cancel handlers
        document.querySelectorAll('.edit-paid-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            tr.querySelector('.paid-label').style.display = 'none';
            tr.querySelector('.edit-paid').style.display = '';
            tr.querySelector('.save-paid-btn').style.display = '';
            tr.querySelector('.cancel-paid-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.cancel-paid-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            tr.querySelector('.paid-label').style.display = '';
            tr.querySelector('.edit-paid').style.display = 'none';
            tr.querySelector('.save-paid-btn').style.display = 'none';
            tr.querySelector('.edit-paid-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.save-paid-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const paidAmount = Number(tr.querySelector('.edit-paid').value) || 0;
            fetch(`http://localhost:5000/api/invoices/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paidAmount })
            })
              .then(r => r.json())
              .then(() => fetchInvoices());
          };
        });

        // Delete handler
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.onclick = function() {
            if (!confirm('Delete this invoice?')) return;
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            fetch(`http://localhost:5000/api/invoices/${id}`, {
              method: 'DELETE'
            })
              .then(r => r.json())
              .then(() => fetchInvoices());
          };
        });

        // Preview PDF
        document.querySelectorAll('.preview-invoice-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const invoice = window.invoices.find(inv => inv._id === id);
            if (!invoice) return;
            const template = await window.loadTemplate('invoice');
            const html = fillInvoiceTemplate(template, invoice);
            window.previewPDF(html, { margin: 10, jsPDF: { format: 'a4' } });
          };
        });

        // Download PDF
        document.querySelectorAll('.download-invoice-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const invoice = window.invoices.find(inv => inv._id === id);
            if (!invoice) return;
            const template = await window.loadTemplate('invoice');
            const html = fillInvoiceTemplate(template, invoice);
            window.downloadPDF(html, `invoice-${invoice.number || invoice._id}.pdf`, { margin: 10, jsPDF: { format: 'a4' } });
          };
        });

        // Send via Email
        document.querySelectorAll('.email-invoice-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            fetch(`http://localhost:5000/api/invoices/${id}/email`, { method: 'POST' })
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

        // (Optional) Add edit functionality for other fields as needed
      });
  }

  fetchInvoices();

  document.getElementById('invoice-form').onsubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    // Gather items
    const items = Array.from(document.querySelectorAll('#invoice-items-tbody tr')).map(tr => ({
      description: tr.querySelector('.item-desc').value.trim(),
      quantity: Number(tr.querySelector('.item-qty').value),
      price: Number(tr.querySelector('.item-price').value)
    })).filter(item => item.description && item.quantity > 0);

    const total = updateInvoiceSubtotalsAndTotal();

    // Always set client from the select (even if quotation is selected)
    let clientId = form.client.value;

    // If creating from a quotation, fetch the quotation to get the client if not selected
    const quotationId = form.quotation.value;
    if ((!clientId || clientId === "") && quotationId) {
      fetch(`http://localhost:5000/api/quotations/${quotationId}`)
        .then(r => r.json())
        .then(q => {
          // q.client may be an object or an id string
          clientId = q.client?._id || q.client || "";
          if (clientId) {
            submitInvoice(clientId);
          } else {
            document.getElementById('invoice-form-msg').textContent = 'Client is required.';
          }
        });
    } else {
      submitInvoice(clientId);
    }

    function submitInvoice(clientId) {
      if (!clientId || clientId === "") {
        document.getElementById('invoice-form-msg').textContent = 'Client is required.';
        return;
      }
      const data = {
        client: clientId,
        status: "Unpaid",
        dueDate: form.dueDate.value,
        items,
        total,
        quotation: quotationId || undefined
      };
      fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(r => r.json())
        .then(invoice => {
          document.getElementById('invoice-form-msg').textContent = 'Invoice added!';
          form.reset();
          // Remove all item rows except one
          const tbody = document.getElementById('invoice-items-tbody');
          while (tbody.rows.length > 1) tbody.deleteRow(1);
          tbody.querySelector('.item-desc').value = '';
          tbody.querySelector('.item-qty').value = 1;
          tbody.querySelector('.item-price').value = 0;
          updateInvoiceSubtotalsAndTotal();
          fetchInvoices();
          setTimeout(() => {
            document.getElementById('invoice-form-msg').textContent = '';
          }, 1500);
        })
        .catch(() => {
          document.getElementById('invoice-form-msg').textContent = 'Error adding invoice.';
        });
    }
  };
};

async function previewInvoicePDF(invoice) {
  const template = await window.loadTemplate('invoice');
  // ...replace placeholders in template with invoice data...
  // ...generate PDF or show preview...
}

// Helper to fill template placeholders using the full HTML template (with header/footer)
function fillInvoiceTemplate(template, invoice) {
  let html = template;
  html = html.replace(/{{number}}/g, invoice.number || '');
  html = html.replace(/{{clientName}}/g, invoice.client?.name || '');
  html = html.replace(/{{clientEmail}}/g, invoice.client?.email || '');
  html = html.replace(/{{status}}/g, invoice.status || '');
  html = html.replace(/{{dueDate}}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '');
  html = html.replace(/{{paidAmount}}/g, invoice.paidAmount || 0);
  html = html.replace(/{{amountDue}}/g, Math.max((invoice.total || 0) - (invoice.paidAmount || 0), 0));
  html = html.replace(/{{total}}/g, invoice.total || '');

  // Items
  const itemsHtml = (invoice.items || []).map(item =>
    `<tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>$${item.price || ''}</td>
      <td>$${item.quantity && item.price ? Number(item.quantity) * Number(item.price) : ''}</td>
    </tr>`
  ).join('');
  html = html.replace(/{{items}}/g, itemsHtml);

  // Fill org details and logo (header/footer)
  html = window.fillOrgDetails(html);

  return html;
}

// When generating the PDF, set html2pdf options to avoid extra pages
// Example usage in preview/download handlers:
window.previewPDF(html, {
  margin: [0, 0, 0, 0], // or [top, right, bottom, left] in mm
  jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  html2canvas: { scale: 2 }
});

window.downloadPDF(html, `invoice-${invoice.number || invoice._id}.pdf`, {
  margin: [0, 0, 0, 0],
  jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  html2canvas: { scale: 2 }
});

async function getNextInvoiceNumber() {
  // Fetch all invoices and find the highest number, then increment
  const res = await fetch('http://localhost:5000/api/invoices');
  const invoices = await res.json();
  let max = 0;
  invoices.forEach(inv => {
    if (inv.number && typeof inv.number === 'string') {
      const match = inv.number.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
  });
  return 'INV-' + String(max + 1).padStart(3, '0');
}

// Example usage in preview or add form:
async function renderInvoicePreview(invoice) {
  let number = invoice.number;
  if (!number) {
    number = await getNextInvoiceNumber();
  }
  const template = await window.loadTemplate('invoice');
  // Inject the number into the invoice object for template filling
  const html = window.fillInvoiceTemplate(template, { ...invoice, number });
  window.previewPDF(html, {
    margin: [0, 0, 0, 0],
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2 }
  });
}
