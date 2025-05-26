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
        </div>        <div>
          <label>From Quotation<br>
            <select name="quotation" id="invoice-quotation-select" style="padding:6px;width:180px;">
              <option value="">(Optional) Select Quotation</option>
            </select>
          </label>
        </div>
        <div>
          <label>Currency<br>
            <select name="currency" id="invoice-currency-select" style="padding:6px;width:120px;">
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
          <label>Payment Method<br>
            <select name="paymentMethod" id="invoice-payment-method-select" style="padding:6px;width:180px;">
              <option value="usd-dtb">USD - Diamond Trust Bank</option>
              <option value="kes-dtb">KES - Diamond Trust Bank</option>
              <option value="usd-NCBA">USD - NCBA Bank</option>
              <option value="gbp-barclays">GBP - Barckays Bank UK</option>
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
            <!-- The first row will be added by addInvoiceItemRow() -->
          </tbody>
        </table>
        <button type="button" id="add-invoice-item-btn" style="padding:6px 14px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Item</button>
        <span id="invoice-items-total" style="margin-left:24px;font-weight:bold;color:#8c241c;">Total: $0</span>
      </div>
      <button type="submit" form="invoice-form" style="margin-top:14px;padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Add Invoice</button>
      <div id="invoice-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
    <div style="margin-bottom:18px;display:flex;gap:16px;align-items:center;">
      <label>Client:
        <select id="filter-client" style="padding:6px;width:160px;">
          <option value="">All</option>
        </select>
      </label>
      <label>Status:
        <select id="filter-status" style="padding:6px;width:120px;">
          <option value="">All</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </label>
      <button id="filter-apply-btn" style="padding:6px 14px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Filter</button>
    </div>
    <div id="invoices-list">Loading...</div>
  `;

  // Populate client dropdown
  fetch(`${window.API_BASE_URL}/api/clients`, { credentials: 'include' })
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('invoice-client-select');
      select.innerHTML = clients.length
        ? clients.map(c => `<option value="${c._id}">${c.name} (${c.email})</option>`).join('')
        : '<option value="">No clients</option>';
    });

  // Populate quotations dropdown (only accepted quotations)
  fetch(`${window.API_BASE_URL}/api/quotations`, { credentials: 'include' })
    .then(r => r.json())
    .then(quotations => {
      const select = document.getElementById('invoice-quotation-select');
      select.innerHTML += quotations
        .filter(q => q.status === 'Accepted')
        .map(q => `<option value="${q._id}">#${q._id.slice(-5)} - ${q.client?.name || ''} ($${q.total || 0})</option>`)
        .join('');
    });

  // Populate client filter dropdown
  fetch(`${window.API_BASE_URL}/api/clients`, { credentials: 'include' })
    .then(r => r.json())
    .then(clients => {
      const select = document.getElementById('filter-client');
      select.innerHTML += clients.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
    });

  // Fetch and render invoices table with filters
  function fetchFilteredInvoices() {
    const client = document.getElementById('filter-client').value;
    const status = document.getElementById('filter-status').value;
    let url = `${window.API_BASE_URL}/api/invoices?`;
    if (client) url += `client=${encodeURIComponent(client)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    fetchInvoices(url);
  }

  document.getElementById('filter-apply-btn').onclick = fetchFilteredInvoices;

  // Initial fetch (all)
  fetchInvoices();

  // Helper function to get payment details based on selected method
  function getPaymentDetails(paymentMethod) {
    const paymentMethods = {
      'usd-dtb': {
        accountName: 'JUNGLE DWELLERS LTD',
        accountNumber: '0254001002',
        bankName: 'DIAMOND TRUST BANK',
        swiftCode: 'DTKEKENA',
        currency: 'USD',
        additionalInfo: '(Please use your name or invoice number as payment reference)'
      },      'kes-dtb': {
        accountName: 'JUNGLE DWELLERS LTD',
        accountNumber: '0254001001',
        bankName: 'DIAMOND TRUST BANK',
        swiftCode: 'DTKEKENA',
        currency: 'KES',
        additionalInfo: '(Please use your name or invoice number as payment reference)'
      },
      'usd-NCBA': {
        accountName: 'JUNGLE DWELLERS LTD',
        accountNumber: '8816130022 ',
        bankName: 'NCBA BANK KENYA',
        swiftCode: ' CBAFKENX',
        currency: 'USD',
        additionalInfo: '( Bank Code: 07 - 000, P.O. Box 44599-00100 Nairobi, Kenya,NCBA Center, Mara and Ragati Roads Upperhill, Please use your name or invoice number as payment reference)'
      },
      'gbp-barclays': {
        accountName: 'SAFIRI TICKETS LTD',
        accountNumber: '63557618',
        bankName: 'Barclays Bank UK',
        swiftCode: 'BUKBGB22',
        currency: 'GBP',
        additionalInfo: '(Sort Code: 20-89-56, IBAN: GB46 BUKB 2089 5663 5576 18 - Please use your name or invoice number as payment reference)'
      }
    };
    
    return paymentMethods[paymentMethod] || paymentMethods['usd-dtb'];
  }

  // Helper function to get currency symbol
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

  // --- Items logic ---
  function updateInvoiceSubtotalsAndTotal() {
    let total = 0;
    document.querySelectorAll('#invoice-items-tbody tr').forEach(tr => {
      const qty = Number(tr.querySelector('.item-qty').value) || 0;
      const price = Number(tr.querySelector('.item-price').value) || 0;
      let subtotal = qty * price;

      // If hotel, calculate nights from check-in/check-out
      const productSelect = tr.querySelector('.item-product');
      const selected = productSelect ? productSelect.options[productSelect.selectedIndex] : null;
      const type = selected ? selected.getAttribute('data-type') : null;

      let serviceFee = 0;
      if (type === 'hotel') {
        const checkin = tr.querySelector('.item-checkin')?.value;
        const checkout = tr.querySelector('.item-checkout')?.value;
        if (checkin && checkout) {
          const nights = (new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24);
          subtotal = price * (nights > 0 ? nights : 1);
        }
        serviceFee = Number(tr.querySelector('.item-service-fee')?.value) || 0;
      } else {
        serviceFee = Number(tr.querySelector('.item-service-fee')?.value) || 0;
      }      subtotal += serviceFee;
      tr.querySelector('.item-subtotal').textContent = subtotal.toFixed(2);
      total += subtotal;
    });
    const currency = document.getElementById('invoice-currency-select')?.value || 'USD';
    const currencySymbol = getCurrencySymbol(currency);
    document.getElementById('invoice-items-total').textContent = `Total: ${currencySymbol}${total.toFixed(2)}`;
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

  async function addInvoiceItemRow(desc = '', qty = 1, price = 0, productId = '', productType = '') {
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
    document.getElementById('invoice-items-tbody').appendChild(tr);

    // Show dynamic fields if a type is provided (for edit/restore)
    if (productType) renderServiceFields(tr, productType);

    // Attach events
    attachInvoiceItemEvents(tr);

    // Service select event: show/hide description and render dynamic fields
    tr.querySelector('.item-product').addEventListener('change', function() {
      const selected = this.options[this.selectedIndex];
      const type = selected.getAttribute('data-type');
      tr.querySelector('.item-desc').style.display = '';
      renderServiceFields(tr, type);
    });

    // Listen for changes in dynamic fields to update subtotal
    tr.addEventListener('input', updateInvoiceSubtotalsAndTotal);

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

  // Remove initial static row, always add the first row with service select on page load
  if (document.getElementById('invoice-items-tbody')) {
    addInvoiceItemRow();
  }

  document.getElementById('add-invoice-item-btn').onclick = () => addInvoiceItemRow();

  // When a quotation is selected, fill in items and client
  document.getElementById('invoice-quotation-select').addEventListener('change', function() {
    const qid = this.value;
    if (!qid) return;
    fetch(`${window.API_BASE_URL}/api/quotations/${qid}`, { credentials: 'include' })
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
  function fetchInvoices(url = `${window.API_BASE_URL}/api/invoices`) {
    fetch(url, { credentials: 'include' })
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
            <tbody>              ${invoices.map(inv => {
                const paid = Number(inv.paidAmount || 0);
                const total = Number(inv.total || 0);
                const due = Math.max(total - paid, 0).toFixed(2);
                const currency = inv.currency || 'USD';
                const currencySymbol = getCurrencySymbol(currency);
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
                  <td>${currencySymbol}${total.toFixed(2)}</td>
                  <td>
                    <span class="paid-label">${currencySymbol}${paid.toFixed(2)}</span>
                    <input type="number" class="edit-paid" min="0" max="${total}" value="${paid}" style="display:none;width:80px;padding:4px;">
                  </td>
                  <td>${currencySymbol}${due}</td>
                  <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ''}</td>
                  <td>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
                      <button class="edit-paid-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit Paid</button>
                      <button class="save-paid-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Save</button>
                      <button class="cancel-paid-btn" style="background:#b47572;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;display:none;">Cancel</button>
                      <button class="edit-btn" style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Edit</button>
                      <button class="delete-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Delete</button>
                      <button class="preview-invoice-btn" style="background:#8c241c;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Preview</button>
                      <button class="download-invoice-btn" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">PDF</button>
                      <button class="email-invoice-btn" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Email</button>
                    </div>
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
            fetch(`${window.API_BASE_URL}/api/invoices/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
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
            tr.querySelector('.edit-paid-btn').style.display = '';
            btn.style.display = 'none';
          };
        });
        document.querySelectorAll('.save-paid-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const paidAmount = Number(tr.querySelector('.edit-paid').value) || 0;
            fetch(`${window.API_BASE_URL}/api/invoices/${id}`, {
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
            fetch(`${window.API_BASE_URL}/api/invoices/${id}`, {
              method: 'DELETE'
            })
              .then(r => r.json())
              .then(() => fetchInvoices());
          };
        });

        // Preview PDF with user info
        document.querySelectorAll('.preview-invoice-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const invoice = window.invoices.find(inv => inv._id === id);
            if (!invoice) {
              console.error('Invoice data not found for preview:', id);
              alert('Could not find invoice details to generate PDF.');
              return;
            }
            if (window.newPdfEngine && typeof window.newPdfEngine.generateInvoice === 'function') {
              // Get current user info
              const response = await fetch(`${window.API_BASE_URL}/api/auth/me`, { credentials: 'include' });
              const currentUser = await response.json();
              await window.newPdfEngine.generateInvoice(invoice, 'preview', {}, currentUser);
            } else {
              console.error('newPdfEngine or its generateInvoice method is not available. Ensure new-pdf-engine.js is loaded correctly.');
              alert('Error: PDF preview functionality is currently unavailable. Please check console for details.');
            }
          };
        });
        document.querySelectorAll('.preview-invoice-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const invoice = window.invoices.find(inv => inv._id === id);
            if (!invoice) {
              console.error('Invoice data not found for preview:', id);
              alert('Could not find invoice details to generate PDF.');
              return;
            }
            if (window.newPdfEngine && typeof window.newPdfEngine.generateInvoice === 'function') {
              const currentUser = window.auth.getUserInfo();
              await window.newPdfEngine.generateInvoice(invoice, 'preview', {}, currentUser);
            } else {
              console.error('newPdfEngine or its generateInvoice method is not available. Ensure new-pdf-engine.js is loaded correctly.');
              alert('Error: PDF preview functionality is currently unavailable. Please check console for details.');
            }
          };
        });

        // Download PDF with user info
        document.querySelectorAll('.download-invoice-btn').forEach(btn => {
          btn.onclick = async function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            const invoice = window.invoices.find(inv => inv._id === id);
            if (!invoice) {
              console.error('Invoice data not found for download:', id);
              alert('Could not find invoice details to generate PDF.');
              return;
            }
            if (window.newPdfEngine && typeof window.newPdfEngine.generateInvoice === 'function') {
              const currentUser = window.auth.getUserInfo();
              await window.newPdfEngine.generateInvoice(invoice, 'download', { filename: `invoice-${invoice.number || invoice._id}.pdf` }, currentUser);
            } else {
              console.error('newPdfEngine or its generateInvoice method is not available. Ensure new-pdf-engine.js is loaded correctly.');
              alert('Error: PDF download functionality is currently unavailable. Please check console for details.');
            }
          };
        });

        // Send via Email
        document.querySelectorAll('.email-invoice-btn').forEach(btn => {
          btn.onclick = function() {
            const tr = btn.closest('tr');
            const id = tr.getAttribute('data-id');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            fetch(`${window.API_BASE_URL}/api/invoices/${id}/email`, { method: 'POST' })
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

  document.getElementById('invoice-form').onsubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    // Gather items
    const items = Array.from(document.querySelectorAll('#invoice-items-tbody tr')).map(tr => {
      const productSelect = tr.querySelector('.item-product');
      const selected = productSelect ? productSelect.options[productSelect.selectedIndex] : null;
      const type = selected ? selected.getAttribute('data-type') : null;
      let serviceFee = 0;
      if (type === 'hotel' || type === 'flight' || type === 'transfer') {
        serviceFee = Number(tr.querySelector('.item-service-fee')?.value) || 0;
      }
      // Gather dynamic fields
      const item = {
        description: tr.querySelector('.item-desc').value.trim(),
        quantity: Number(tr.querySelector('.item-qty').value),
        price: Number(tr.querySelector('.item-price').value),
        serviceFee,
        type // <-- ensure type is set for grouping in PDF
      };
      // Add dynamic fields for hotel
      if (type === 'hotel') {
        item.hotelName = tr.querySelector('.item-hotel-name')?.value || '';
        item.checkin = tr.querySelector('.item-checkin')?.value || '';
        item.checkout = tr.querySelector('.item-checkout')?.value || '';
      }
      // Add dynamic fields for flight
      if (type === 'flight') {
        item.airline = tr.querySelector('.item-airline')?.value || '';
        item.from = tr.querySelector('.item-from')?.value || '';
        item.to = tr.querySelector('.item-to')?.value || '';
        item.flightDate = tr.querySelector('.item-flight-date')?.value || '';
        item.class = tr.querySelector('.item-class')?.value || '';
      }
      // Add dynamic fields for transfer
      if (type === 'transfer') {
        item.from = tr.querySelector('.item-from')?.value || '';
        item.to = tr.querySelector('.item-to')?.value || '';
      }
      // ...add more types as needed...
      return item;
    }).filter(item => item.description && item.quantity > 0);

    const total = updateInvoiceSubtotalsAndTotal();

    // Always set client from the select (even if quotation is selected)
    let clientId = form.client.value;

    // If creating from a quotation, fetch the quotation to get the client if not selected
    const quotationId = form.quotation.value;
    if ((!clientId || clientId === "") && quotationId) {
      fetch(`${window.API_BASE_URL}/api/quotations/${quotationId}`)
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
    }    function submitInvoice(clientId) {
      if (!clientId || clientId === "") {
        document.getElementById('invoice-form-msg').textContent = 'Client is required.';
        return;
      }
      const currency = form.currency.value || 'USD';
      const paymentMethod = form.paymentMethod.value || 'usd-dtb';
      const paymentDetails = getPaymentDetails(paymentMethod);
      
      const data = {
        client: clientId,
        status: "Unpaid",
        dueDate: form.dueDate.value,
        items,
        total,
        currency,
        paymentDetails,
        quotation: quotationId || undefined
      };
      fetch(`${window.API_BASE_URL}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure session cookie is sent
        body: JSON.stringify(data)
      })
        .then(async r => {
          const resp = await r.json();
          if (!r.ok || resp.error) {
            document.getElementById('invoice-form-msg').textContent = resp.error ? `Error: ${resp.error}` : 'Error adding invoice.';
            return;
          }
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
  // Get current user from auth module
  const currentUser = window.auth.getUserInfo();
  
  const template = await window.loadTemplate('invoice');
  const html = window.fillInvoiceTemplate(template, invoice, currentUser);
  
  // Preview the PDF
  window.previewPDF(html, {
    margin: [0, 0, 0, 0],
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2 }
  });
}

// Helper to fill template placeholders using the full HTML template (with header/footer)
function fillInvoiceTemplate(template, invoice, currentUser) {
  let html = template;
  
  // Get currency symbol for display
  const currency = invoice.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  
  html = html.replace(/{{number}}/g, invoice.number || '');
  html = html.replace(/{{clientName}}/g, invoice.client?.name || '');
  html = html.replace(/{{clientEmail}}/g, invoice.client?.email || '');
  html = html.replace(/{{status}}/g, invoice.status || '');
  html = html.replace(/{{dueDate}}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '');
  html = html.replace(/{{paidAmount}}/g, `${currencySymbol}${(invoice.paidAmount || 0).toFixed(2)}`);
  html = html.replace(/{{amountDue}}/g, `${currencySymbol}${Math.max((invoice.total || 0) - (invoice.paidAmount || 0), 0).toFixed(2)}`);
  html = html.replace(/{{total}}/g, `${currencySymbol}${(invoice.total || 0).toFixed(2)}`);
  html = html.replace(/{{createdBy}}/g, currentUser?.name || 'Unknown User');
  html = html.replace(/{{creationDate}}/g, new Date().toLocaleDateString());

  // Payment details
  const paymentDetails = invoice.paymentDetails || {};
  html = html.replace(/{{paymentAccountName}}/g, paymentDetails.accountName || 'JUNGLE DWELLERS LTD');
  html = html.replace(/{{paymentAccountNumber}}/g, paymentDetails.accountNumber || '0254001002');
  html = html.replace(/{{paymentBankName}}/g, paymentDetails.bankName || 'DIAMOND TRUST BANK');
  html = html.replace(/{{paymentSwiftCode}}/g, paymentDetails.swiftCode || 'DTKEKENA');
  html = html.replace(/{{paymentCurrency}}/g, paymentDetails.currency || currency);
  html = html.replace(/{{paymentAdditionalInfo}}/g, paymentDetails.additionalInfo || '(Please use your name or invoice number as payment reference)');

  // Items with currency formatting
  const itemsHtml = (invoice.items || []).map(item => {
    const subtotal = item.quantity && item.price ? Number(item.quantity) * Number(item.price) + (Number(item.serviceFee) || 0) : '';
    return `<tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>${currencySymbol}${(item.price || 0).toFixed(2)}</td>
      <td>${subtotal ? `${currencySymbol}${subtotal.toFixed(2)}` : ''}</td>
    </tr>`;
  }).join('');
  html = html.replace(/{{items}}/g, itemsHtml);

  // Fill org details and logo (header/footer)
  return html;
}

// When generating the PDF, set html2pdf options to avoid extra pages
// Example usage in preview/download handlers:
// window.previewPDF(html, {
//   margin: [0, 0, 0, 0], // or [top, right, bottom, left] in mm
//   jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
//   pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
//   html2canvas: { scale: 2 }
// });
// 
// window.downloadPDF(html, `invoice-${invoice.number || invoice._id}.pdf`, {
//   margin: [0, 0, 0, 0],
//   jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
// });

async function getNextInvoiceNumber() {
  // Fetch all invoices and find the highest number, then increment
  const res = await fetch(`${window.API_BASE_URL}/api/invoices`);
  const invoices = await res.json();
  let max = 8462; // Start from 8462 so next number will be 8463
  invoices.forEach(inv => {
    if (inv.number && typeof inv.number === 'string') {
      const match = inv.number.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
  });
  return 'INV-' + String(max + 1).padStart(5, '0');
}

// Example usage in preview or add form:
async function renderInvoicePreview(invoice) {
  // Get current user from auth module
  const currentUser = window.auth.getUserInfo();
  
  let number = invoice.number;
  if (!number) {
    number = await getNextInvoiceNumber();
  }
  
  const template = await window.loadTemplate('invoice');
  const html = window.fillInvoiceTemplate(template, { ...invoice, number }, currentUser);
  
  // Preview and download the PDF
  window.previewPDF(html, {
    margin: [0, 0, 0, 0],
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
}

// Helper to fetch products/services for dropdowns
async function fetchProductsDropdownOptions() {
  const res = await fetch(`${window.API_BASE_URL}/api/products`);
  const products = await res.json();
  return products.map(p => `<option value="${p._id}" data-type="${p.type}">${p.name} (${p.type})</option>`).join('');
}
