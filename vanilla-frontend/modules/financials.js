window.renderFinancials = function(main) {
  main.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #8c241c;">
      <h2 style="color:#8c241c;margin:0;">Financial Overview</h2>
      <button id="refresh-financials-btn" style="padding:8px 20px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;transition:background 0.2s;">
        🔄 Refresh All
      </button>
    </div>
    
    <!-- Key Metrics Cards -->
    <div id="financials-widgets" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:20px;margin-bottom:32px;"></div>
    
    <!-- Summary Section -->
    <div id="financials-summary" style="margin-bottom:32px;padding:20px;background:#f8f9fa;border-radius:8px;border-left:4px solid #8c241c;">Loading...</div>
    
    <!-- Revenue Analysis Section -->
    <div id="financials-charts" style="margin-bottom:32px;padding:20px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
    
    <!-- Payment Transactions Section -->
    <div id="payments-section" style="margin-bottom:32px;padding:20px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="color:#8c241c;margin:0;">Payment Transactions</h3>
        <button id="refresh-payments-btn" style="padding:6px 16px;background:#8c241c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;">Refresh</button>
      </div>
      <div id="payments-list" style="overflow-x:auto;">Loading payments...</div>
    </div>
    
    <!-- Invoice Details Section -->
    <div id="financials-details" style="margin-bottom:32px;padding:20px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"></div>
    
    <!-- Manual Payment Form (Collapsible) -->
    <div style="margin-bottom:32px;">
      <button id="toggle-payment-form" style="width:100%;padding:12px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:1em;margin-bottom:16px;">
        ➕ Add Manual Payment
      </button>
      <div id="manual-payment-form-container" style="display:none;padding:20px;background:#f8f9fa;border-radius:8px;border:1px solid #ddd;">
        <h3 style="color:#8c241c;margin-top:0;">Record Manual Payment</h3>
        <form id="add-payment-form" style="max-width:600px;">
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Invoice</label>
            <select id="payment-invoice-select" class="finance-form-select" required>
              <option value="">Select Invoice</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Amount</label>
              <input type="number" id="payment-amount" class="finance-form-input" step="0.01" min="0" required placeholder="Enter amount">
            </div>
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Payment Method</label>
              <select id="payment-method-select" class="finance-form-select" required>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="MPESA">M-Pesa</option>
                <option value="CARD">Card</option>
                <option value="PESAPAL">Pesapal</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Transaction ID/Reference</label>
              <input type="text" id="payment-transaction-id" class="finance-form-input" placeholder="Optional reference">
            </div>
            <div>
              <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Payment Date</label>
              <input type="date" id="payment-date" class="finance-form-input" required>
            </div>
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Notes</label>
            <textarea id="payment-notes" class="finance-form-input" rows="3" placeholder="Optional notes"></textarea>
          </div>
          <button type="submit" class="finance-form-btn">Record Payment</button>
        </form>
      </div>
    </div>
    
    <style>
      .finance-form-input {
        width: 100%;
        padding: 0.7rem;
        margin-bottom: 0;
        border: 1.5px solid #8c241c;
        border-radius: 6px;
        background: #fff;
        font-size: 1em;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px rgba(140, 36, 28, 0.1);
      }
      .finance-form-input:focus {
        outline: none;
        border-color: #eb7b24;
        box-shadow: 0 2px 8px rgba(140, 36, 28, 0.2);
      }
      .finance-form-select {
        width: 100%;
        padding: 0.7rem;
        margin-bottom: 0;
        border: 1.5px solid #8c241c;
        border-radius: 6px;
        background: #fff;
        font-size: 1em;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px rgba(140, 36, 28, 0.1);
      }
      .finance-form-select:focus {
        outline: none;
        border-color: #eb7b24;
        box-shadow: 0 2px 8px rgba(140, 36, 28, 0.2);
      }
      .finance-form-btn {
        width: 100%;
        padding: 0.7rem;
        background: #8c241c;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        font-size: 1em;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px rgba(140, 36, 28, 0.1);
      }
      .finance-form-btn:hover {
        background: #a63a2e;
        box-shadow: 0 2px 12px rgba(140, 36, 28, 0.2);
      }
      #refresh-financials-btn:hover {
        background: #a63a2e;
      }
      #refresh-payments-btn:hover {
        background: #a63a2e;
      }
      #toggle-payment-form:hover {
        background: #a63a2e;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }
      .data-table th {
        background: #8c241c;
        color: #fff;
        padding: 12px;
        text-align: left;
        font-weight: bold;
        font-size: 0.9em;
      }
      .data-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #eee;
      }
      .data-table tbody tr:hover {
        background: #f8f9fa;
      }
      .finance-card {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-left: 4px solid #8c241c;
      }
    </style>
  `;
  
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

  // Helper to convert currency to USD (same rates as dashboard and server)
  function convertToUSD(amount, currency) {
    const rates = {
      'USD': 1.0,
      'KES': 0.0067,
      'GBP': 1.23,
      'EUR': 1.03,
      'CAD': 0.70,
      'AUD': 0.62
    };
    return amount * (rates[currency] || 1);
  }

  function renderCharts(data) {
    Chart.helpers.each(Chart.instances, (instance) => {
      instance.destroy();
    });
    Chart.instances = [];
    
    const paid = data.paidRevenue || 0;
    const unpaid = data.unpaidRevenue || 0;
    const overdue = data.overdueRevenue || 0;
    const total = paid + unpaid + overdue || 1;

    function bar(width, color, label, value) {
      return `
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <div style="width:100px;font-weight:bold;">${label}</div>
          <svg width="300" height="24" style="margin-right:12px;">
            <rect x="0" y="4" width="${Math.max(20, 280 * value / total)}" height="16" fill="${color}" rx="4"/>
          </svg>
          <span style="font-weight:bold;color:${color};font-size:1.1em;">$${value.toFixed(2)}</span>
        </div>
      `;
    }

    let exchangeRateInfo = '';
    if (data.exchangeRates) {
      const rates = data.exchangeRates;
      exchangeRateInfo = `
        <div style="margin-top:20px;padding:16px;background:#f8f9fa;border-radius:6px;border-left:4px solid #8c241c;">
          <div style="font-weight:bold;margin-bottom:12px;color:#8c241c;font-size:1.1em;">Current Exchange Rates (to USD)</div>
          <div style="display:flex;flex-wrap:wrap;gap:20px;font-size:0.95em;margin-bottom:8px;">
            ${Object.entries(rates).filter(([curr]) => curr !== 'USD').map(([currency, rate]) => 
              `<span style="padding:4px 8px;background:#fff;border-radius:4px;"><strong>${currency}:</strong> ${rate.toFixed(4)}</span>`
            ).join('')}
          </div>
          <div style="margin-top:8px;font-size:0.85em;color:#666;">
            Exchange rates are approximate and used for aggregation purposes only.
            <a href="#" id="view-current-rates" style="color:#8c241c;text-decoration:none;margin-left:8px;">View detailed rates →</a>
          </div>
        </div>
      `;
    }

    document.getElementById('financials-charts').innerHTML = `
      <h3 style="color:#8c241c;margin-top:0;margin-bottom:20px;">Revenue Analysis (USD Equivalents)</h3>
      <div style="max-width:500px;margin-bottom:20px;">
        ${bar(280, '#2ecc40', 'Paid', paid)}
        ${bar(280, '#e45424', 'Unpaid', unpaid)}
        ${bar(280, '#943c34', 'Overdue', overdue)}
        <div style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:6px;">
          <div style="font-size:1.1em;font-weight:bold;color:#333;">Total Revenue: <span style="color:#8c241c;">$${(paid + unpaid + overdue).toFixed(2)}</span></div>
          <div style="margin-top:4px;font-size:0.9em;color:#666;">All amounts converted to USD using current exchange rates</div>
        </div>
      </div>
      ${exchangeRateInfo}
    `;
  }
  
  function fetchPayments() {
    console.log('Fetching payments...');
    fetch(`${window.API_BASE_URL}/api/invoices`)
      .then(r => r.json())
      .then(invoices => {
        if (!invoices.length) {
          document.getElementById('payments-list').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No invoices found.</p>';
          return;
        }
        
        Promise.all(invoices.map(invoice => 
          fetch(`${window.API_BASE_URL}/api/payments/invoice/${invoice._id}`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then(payments => ({ invoice, payments }))
            .catch(() => ({ invoice, payments: [] }))
        ))
        .then(results => {
          const allPayments = results
            .flatMap(result => result.payments.map(payment => ({
              ...payment,
              invoice: result.invoice
            })))
            .filter(payment => payment._id);
          
          if (!allPayments.length) {
            document.getElementById('payments-list').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No payment transactions found.</p>';
            return;
          }
          
          allPayments.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
          
          document.getElementById('payments-list').innerHTML = `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allPayments.map(payment => {
                  const date = payment.paymentDate || payment.createdAt;
                  const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
                  const currencySymbol = getCurrencySymbol(payment.currency);
                  
                  let statusColor = '#666';
                  let statusBadge = '';
                  if (payment.status === 'COMPLETED') {
                    statusColor = '#2ecc40';
                    statusBadge = '✅';
                  } else if (payment.status === 'FAILED') {
                    statusColor = '#e74c3c';
                    statusBadge = '❌';
                  } else if (payment.status === 'PENDING') {
                    statusColor = '#f39c12';
                    statusBadge = '⏳';
                  }
                  
                  return `
                    <tr>
                      <td>${formattedDate}</td>
                      <td><strong>${payment.invoice?.number || 'Unknown'}</strong></td>
                      <td><strong>${currencySymbol}${payment.amount.toFixed(2)}</strong></td>
                      <td>${payment.paymentMethod || payment.method || 'N/A'}</td>
                      <td style="color:${statusColor};font-weight:bold;">${statusBadge} ${payment.status || 'N/A'}</td>
                      <td style="font-family:monospace;font-size:0.9em;">${payment.transactionId || 'N/A'}</td>
                      <td>
                        <button class="delete-payment-btn" data-payment-id="${payment._id}" data-invoice-number="${payment.invoice?.number || 'Unknown'}" style="background:#e74c3c;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.85em;">Delete</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
          
          document.querySelectorAll('.delete-payment-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
              const paymentId = this.getAttribute('data-payment-id');
              const invoiceNumber = this.getAttribute('data-invoice-number');
              
              if (confirm(`Delete payment for invoice ${invoiceNumber}? This will reset the invoice payment status.`)) {
                try {
                  const response = await fetch(`${window.API_BASE_URL}/api/payments/${paymentId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    alert('Payment deleted successfully!');
                    fetchPayments();
                    fetchFinancials();
                  } else {
                    alert('Error: ' + (result.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Error deleting payment:', error);
                  alert('Error deleting payment. Please try again.');
                }
              }
            });
          });
        });
      });
  }
  
  function fetchFinancials() {
    fetch(`${window.API_BASE_URL}/api/financials`)
      .then(r => r.json())
      .then(data => {
        // Render key metrics widgets
        document.getElementById('financials-widgets').innerHTML = `
          <div class="finance-card" style="border-left-color:#2ecc40;">
            <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Total Revenue</div>
            <div style="font-size:2em;font-weight:bold;color:#2ecc40;">$${(data.revenue || 0).toFixed(2)}</div>
            <div style="font-size:0.85em;color:#888;margin-top:4px;">USD Equivalent</div>
          </div>
          <div class="finance-card" style="border-left-color:#2ecc40;">
            <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Paid Invoices</div>
            <div style="font-size:2em;font-weight:bold;color:#2ecc40;">${data.paid || 0}</div>
            <div style="font-size:0.85em;color:#888;margin-top:4px;">Completed</div>
          </div>
          <div class="finance-card" style="border-left-color:#e45424;">
            <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Unpaid Invoices</div>
            <div style="font-size:2em;font-weight:bold;color:#e45424;">${data.unpaid || 0}</div>
            <div style="font-size:0.85em;color:#888;margin-top:4px;">Pending</div>
          </div>
          <div class="finance-card" style="border-left-color:#943c34;">
            <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Overdue Invoices</div>
            <div style="font-size:2em;font-weight:bold;color:#943c34;">${data.overdue || 0}</div>
            <div style="font-size:0.85em;color:#888;margin-top:4px;">Requires Attention</div>
          </div>
          <div class="finance-card" style="border-left-color:#8c241c;">
            <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Total Invoices</div>
            <div style="font-size:2em;font-weight:bold;color:#8c241c;">${data.totalInvoices || 0}</div>
            <div style="font-size:0.85em;color:#888;margin-top:4px;">All Statuses</div>
          </div>
        `;
        
        // Render summary with currency breakdown
        let currencySummaryHtml = '';
        if (data.currencyData) {
          const currencies = Object.keys(data.currencyData);
          if (currencies.length > 0) {
            currencySummaryHtml = `
              <div style="margin-top:20px;">
                <h4 style="color:#8c241c;margin-bottom:16px;">Revenue by Currency</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
                  ${currencies.map(currency => {
                    const currData = data.currencyData[currency];
                    const symbol = getCurrencySymbol(currency);
                    return `
                      <div style="background:#fff;padding:16px;border-radius:6px;border:1px solid #ddd;">
                        <div style="font-weight:bold;font-size:1.1em;color:#8c241c;margin-bottom:12px;">${currency} <span style="font-size:0.9em;color:#666;">(${currData.totalInvoices} invoices)</span></div>
                        <div style="display:flex;flex-direction:column;gap:8px;font-size:0.95em;">
                          <div>Revenue: <strong style="color:#2ecc40;">${symbol}${currData.paidRevenue.toFixed(2)}</strong></div>
                          <div>Unpaid: <strong style="color:#e45424;">${symbol}${currData.unpaidRevenue.toFixed(2)}</strong></div>
                          <div>Overdue: <strong style="color:#943c34;">${symbol}${currData.overdueRevenue.toFixed(2)}</strong></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }
        }
        
        document.getElementById('financials-summary').innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="color:#8c241c;margin:0;">Financial Summary</h3>
          </div>
          <div style="font-size:1.1em;margin-bottom:12px;">
            <strong>Total Revenue (USD Equivalent):</strong> <span style="color:#2ecc40;font-weight:bold;font-size:1.2em;">$${(data.revenue || 0).toFixed(2)}</span>
          </div>
          <div style="font-size:0.9em;color:#666;margin-bottom:12px;">
            Revenue converted to USD equivalents using current exchange rates for aggregation purposes.
          </div>
          ${currencySummaryHtml}
        `;
        
        renderCharts(data);
      });

    // Store invoices globally for filtering
    let allInvoicesData = [];
    let currentPage = 1;
    const itemsPerPage = 15;
    
    function renderInvoicesTable(invoices, page = 1) {
      if (!invoices || invoices.length === 0) {
        document.getElementById('invoice-table-container').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No invoices match your filters.</p>';
        document.getElementById('invoice-pagination').innerHTML = '';
        return;
      }
      
      const totalPages = Math.ceil(invoices.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedInvoices = invoices.slice(startIndex, endIndex);
      
      Promise.all(paginatedInvoices.map(async inv => {
          let expenses = [];
          try {
            const res = await fetch(`${window.API_BASE_URL}/api/invoices/${inv._id}/expenses`);
            expenses = await res.json();
          } catch {}
          const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          
          const currency = inv.currency || 'USD';
          const totalUSD = convertToUSD(Number(inv.total || 0), currency);
          const paidUSD = convertToUSD(Number(inv.paidAmount || 0), currency);
          const dueUSD = convertToUSD(Math.max((Number(inv.total || 0) - Number(inv.paidAmount || 0)), 0), currency);
          const profit = paidUSD - expenseTotal;
          
          const currencySymbol = getCurrencySymbol(currency);
          const originalTotal = `${currencySymbol}${(inv.total || 0).toFixed(2)}`;
          const originalPaid = `${currencySymbol}${(inv.paidAmount || 0).toFixed(2)}`;
          const originalDue = `${currencySymbol}${((inv.total || 0) - (inv.paidAmount || 0)).toFixed(2)}`;
          
          const paymentLinkBtn = inv.paymentLink ? 
            `<button class="copy-payment-link" data-link="${inv.paymentLink}" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.85em;">Copy Link</button>` : 
            '<span style="color:#999;">No link</span>';
          
          let statusBadge = '';
          if (inv.status === 'Paid') statusBadge = '✅';
          else if (inv.status === 'Overdue') statusBadge = '⚠️';
          else if (inv.status === 'Unpaid') statusBadge = '⏳';
          
          return {
            inv,
            row: `
              <tr>
                <td><strong>${inv.client?.name || 'Unknown'}</strong><br><span style="color:#666;font-size:0.9em;">${inv.client?.email || ''}</span></td>
                <td>${statusBadge} ${inv.status || 'N/A'}</td>
                <td>$${totalUSD.toFixed(2)}<br><span style="color:#888;font-size:0.85em;">${originalTotal}</span></td>
                <td>$${paidUSD.toFixed(2)}<br><span style="color:#888;font-size:0.85em;">${originalPaid}</span></td>
                <td>$${dueUSD.toFixed(2)}<br><span style="color:#888;font-size:0.85em;">${originalDue}</span></td>
                <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                <td>$${expenseTotal.toFixed(2)}</td>
                <td style="font-weight:bold;color:${profit >= 0 ? '#2ecc40' : '#d63031'};">$${profit.toFixed(2)}</td>
                <td>${paymentLinkBtn}</td>
              </tr>
            `,
            paymentLinkBtn
          };
        })).then(results => {
          const invoiceRows = results.map(r => r.row).join('');
          
          document.getElementById('invoice-table-container').innerHTML = `
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Total (USD)</th>
                    <th>Paid (USD)</th>
                    <th>Due (USD)</th>
                    <th>Due Date</th>
                    <th>Expenses (USD)</th>
                    <th>Profit (USD)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceRows}
                </tbody>
              </table>
            </div>
          `;
          
          // Pagination controls
          let paginationHtml = '';
          if (totalPages > 1) {
            paginationHtml = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding:16px;background:#f8f9fa;border-radius:6px;">
                <div style="color:#666;">
                  Showing ${startIndex + 1}-${Math.min(endIndex, invoices.length)} of ${invoices.length} invoices
                </div>
                <div style="display:flex;gap:8px;">
                  <button id="prev-page-btn" ${page <= 1 ? 'disabled' : ''} style="padding:6px 16px;background:${page <= 1 ? '#ccc' : '#8c241c'};color:#fff;border:none;border-radius:4px;cursor:${page <= 1 ? 'not-allowed' : 'pointer'};" ${page <= 1 ? '' : 'onclick="window.goToInvoicePage(' + (page - 1) + ')"'}>
                    ← Previous
                  </button>
                  <span style="padding:6px 12px;background:#fff;border-radius:4px;font-weight:bold;color:#8c241c;">
                    Page ${page} of ${totalPages}
                  </span>
                  <button id="next-page-btn" ${page >= totalPages ? 'disabled' : ''} style="padding:6px 16px;background:${page >= totalPages ? '#ccc' : '#8c241c'};color:#fff;border:none;border-radius:4px;cursor:${page >= totalPages ? 'not-allowed' : 'pointer'};" ${page >= totalPages ? '' : 'onclick="window.goToInvoicePage(' + (page + 1) + ')"'}>
                    Next →
                  </button>
                </div>
              </div>
            `;
          }
          document.getElementById('invoice-pagination').innerHTML = paginationHtml;
          
          // Add event listeners for copy payment link buttons
          document.querySelectorAll('.copy-payment-link').forEach(btn => {
            btn.addEventListener('click', function() {
              const link = this.getAttribute('data-link');
              navigator.clipboard.writeText(link)
                .then(() => {
                  const originalText = this.textContent;
                  this.textContent = 'Copied!';
                  setTimeout(() => {
                    this.textContent = originalText;
                  }, 2000);
                })
                .catch(() => {
                  alert('Failed to copy payment link. Please try again.');
                });
            });
          });
        });
    }
    
    function filterInvoices() {
      const statusFilter = document.getElementById('invoice-status-filter')?.value || 'all';
      const currencyFilter = document.getElementById('invoice-currency-filter')?.value || 'all';
      const searchTerm = document.getElementById('invoice-search')?.value.toLowerCase() || '';
      
      let filtered = [...allInvoicesData];
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(inv => inv.status === statusFilter);
      }
      
      if (currencyFilter !== 'all') {
        filtered = filtered.filter(inv => (inv.currency || 'USD') === currencyFilter);
      }
      
      if (searchTerm) {
        filtered = filtered.filter(inv => {
          const clientName = (inv.client?.name || '').toLowerCase();
          const clientEmail = (inv.client?.email || '').toLowerCase();
          const invoiceNumber = (inv.number || '').toLowerCase();
          return clientName.includes(searchTerm) || clientEmail.includes(searchTerm) || invoiceNumber.includes(searchTerm);
        });
      }
      
      currentPage = 1; // Reset to first page when filtering
      renderInvoicesTable(filtered, currentPage);
    }
    
    // Global function for pagination
    window.goToInvoicePage = function(page) {
      const statusFilter = document.getElementById('invoice-status-filter')?.value || 'all';
      const currencyFilter = document.getElementById('invoice-currency-filter')?.value || 'all';
      const searchTerm = document.getElementById('invoice-search')?.value.toLowerCase() || '';
      
      let filtered = [...allInvoicesData];
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(inv => inv.status === statusFilter);
      }
      
      if (currencyFilter !== 'all') {
        filtered = filtered.filter(inv => (inv.currency || 'USD') === currencyFilter);
      }
      
      if (searchTerm) {
        filtered = filtered.filter(inv => {
          const clientName = (inv.client?.name || '').toLowerCase();
          const clientEmail = (inv.client?.email || '').toLowerCase();
          const invoiceNumber = (inv.number || '').toLowerCase();
          return clientName.includes(searchTerm) || clientEmail.includes(searchTerm) || invoiceNumber.includes(searchTerm);
        });
      }
      
      currentPage = page;
      renderInvoicesTable(filtered, currentPage);
    };
    
    fetch(`${window.API_BASE_URL}/api/invoices`)
      .then(r => r.json())
      .then(async invoices => {
        allInvoicesData = invoices;
        
        if (!invoices.length) {
          document.getElementById('financials-details').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No invoices found.</p>';
          return;
        }
        
        // Get unique currencies and statuses for filters
        const currencies = [...new Set(invoices.map(inv => inv.currency || 'USD'))].sort();
        const statuses = [...new Set(invoices.map(inv => inv.status || 'Unpaid'))].sort();
        
        const currencyBreakdown = {};
        invoices.forEach(inv => {
          const currency = inv.currency || 'USD';
          if (!currencyBreakdown[currency]) {
            currencyBreakdown[currency] = { total: 0, paid: 0, count: 0 };
          }
          currencyBreakdown[currency].total += Number(inv.total || 0);
          currencyBreakdown[currency].paid += Number(inv.paidAmount || 0);
          currencyBreakdown[currency].count++;
        });

        const currencyBreakdownHtml = Object.entries(currencyBreakdown)
          .map(([currency, data]) => {
            const symbol = getCurrencySymbol(currency);
            const due = data.total - data.paid;
            return `
              <div style="background:#f8f9fa;padding:16px;border-radius:6px;margin-bottom:12px;border-left:4px solid #8c241c;">
                <div style="font-weight:bold;color:#8c241c;margin-bottom:8px;font-size:1.1em;">${currency} <span style="font-size:0.9em;color:#666;">(${data.count} invoices)</span></div>
                <div style="display:flex;gap:32px;font-size:0.95em;">
                  <span>Total: <strong>${symbol}${data.total.toFixed(2)}</strong></span>
                  <span>Paid: <strong style="color:#2ecc40;">${symbol}${data.paid.toFixed(2)}</strong></span>
                  <span>Due: <strong style="color:#e45424;">${symbol}${due.toFixed(2)}</strong></span>
                </div>
              </div>
            `;
          }).join('');

        document.getElementById('financials-details').innerHTML = `
          <h3 style="color:#8c241c;margin-top:0;margin-bottom:20px;">Invoice Details</h3>
          <div style="margin-bottom:24px;">
            <h4 style="color:#8c241c;margin-bottom:12px;">Currency Breakdown</h4>
            ${currencyBreakdownHtml}
          </div>
          
          <div style="margin-bottom:20px;padding:16px;background:#f8f9fa;border-radius:8px;">
            <h4 style="color:#8c241c;margin-top:0;margin-bottom:16px;">Filter Invoices</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:12px;">
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">Search</label>
                <input type="text" id="invoice-search" placeholder="Client name, email, or invoice #" class="finance-form-input" style="margin-bottom:0;">
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">Status</label>
                <select id="invoice-status-filter" class="finance-form-select" style="margin-bottom:0;">
                  <option value="all">All Statuses</option>
                  ${statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">Currency</label>
                <select id="invoice-currency-filter" class="finance-form-select" style="margin-bottom:0;">
                  <option value="all">All Currencies</option>
                  ${currencies.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
            </div>
            <button id="clear-filters-btn" style="padding:8px 16px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;">Clear Filters</button>
          </div>
          
          <h4 style="color:#8c241c;margin-bottom:12px;">Invoices (USD Equivalents)</h4>
          <div id="invoice-table-container"></div>
          <div id="invoice-pagination"></div>
          
          <div style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:6px;font-size:0.9em;color:#666;">
            <strong>Note:</strong> All amounts are converted to USD equivalents using current exchange rates. Original currency amounts are shown in smaller text below USD values.
          </div>
        `;
        
        // Add event listeners for filters
        document.getElementById('invoice-search').addEventListener('input', filterInvoices);
        document.getElementById('invoice-status-filter').addEventListener('change', filterInvoices);
        document.getElementById('invoice-currency-filter').addEventListener('change', filterInvoices);
        document.getElementById('clear-filters-btn').addEventListener('click', function() {
          document.getElementById('invoice-search').value = '';
          document.getElementById('invoice-status-filter').value = 'all';
          document.getElementById('invoice-currency-filter').value = 'all';
          filterInvoices();
        });
        
        // Initial render with all invoices
        renderInvoicesTable(invoices, 1);
      });
  }
  
  // Toggle manual payment form
  document.getElementById('toggle-payment-form').addEventListener('click', function() {
    const container = document.getElementById('manual-payment-form-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    this.textContent = container.style.display === 'none' ? '➕ Add Manual Payment' : '➖ Hide Form';
  });
  
  // Fetch data
  fetchFinancials();
  fetchPayments();
  
  document.getElementById('refresh-financials-btn').onclick = function() {
    fetchFinancials();
    fetchPayments();
  };
  
  document.getElementById('refresh-payments-btn').onclick = function() {
    fetchPayments();
  };
  
  // Exchange rates viewer
  document.addEventListener('click', function(e) {
    if (e.target.id === 'view-current-rates') {
      e.preventDefault();
      fetch(`${window.API_BASE_URL}/api/exchange-rates`)
        .then(r => r.json())
        .then(data => {
          const ratesList = Object.entries(data.rates)
            .filter(([curr]) => curr !== 'USD')
            .map(([currency, rate]) => `${currency}: ${rate.toFixed(4)} USD`)
            .join('\n');
          
          alert(`Current Exchange Rates (Base: USD)\n\n${ratesList}\n\nLast Updated: ${new Date(data.lastUpdated).toLocaleString()}`);
        })
        .catch(() => alert('Unable to fetch current exchange rates'));
    }
  });
  
  // Populate invoice dropdown for manual payments
  fetch(`${window.API_BASE_URL}/api/invoices`)
    .then(r => r.json())
    .then(invoices => {
      const select = document.getElementById('payment-invoice-select');
      if (select) {
        select.innerHTML = '<option value="">Select Invoice</option>' + 
          invoices
            .filter(inv => inv.status !== 'Paid')
            .map(inv => {
              const currencySymbol = getCurrencySymbol(inv.currency || 'USD');
              const dueAmount = Math.max((inv.total || 0) - (inv.paidAmount || 0), 0);
              return `<option value="${inv._id}" data-currency="${inv.currency || 'USD'}" data-due="${dueAmount}">
                ${inv.number || inv._id} - ${inv.client?.name || 'Unknown'} (${currencySymbol}${dueAmount.toFixed(2)} due)
              </option>`;
            })
            .join('');
      }
    });

  // Set today's date as default
  const paymentDateInput = document.getElementById('payment-date');
  if (paymentDateInput) {
    paymentDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Handle manual payment form submission
  const paymentForm = document.getElementById('add-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const invoiceId = document.getElementById('payment-invoice-select').value;
      const amount = parseFloat(document.getElementById('payment-amount').value);
      const method = document.getElementById('payment-method-select').value;
      const transactionId = document.getElementById('payment-transaction-id').value;
      const paymentDate = document.getElementById('payment-date').value;
      const notes = document.getElementById('payment-notes').value;
      
      if (!invoiceId || isNaN(amount) || amount <= 0) {
        alert('Please select an invoice and enter a valid amount.');
        return;
      }
      
      const selectedOption = document.getElementById('payment-invoice-select').options[
        document.getElementById('payment-invoice-select').selectedIndex
      ];
      const currency = selectedOption.getAttribute('data-currency') || 'USD';
      
      fetch(`${window.API_BASE_URL}/api/payments/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId,
          amount,
          currency,
          paymentMethod: method,
          transactionId,
          paymentDate,
          notes
        })
      })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          alert('Payment recorded successfully!');
          paymentForm.reset();
          document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
          document.getElementById('manual-payment-form-container').style.display = 'none';
          document.getElementById('toggle-payment-form').textContent = '➕ Add Manual Payment';
          fetchFinancials();
          fetchPayments();
        } else {
          alert('Error: ' + (result.error || 'Failed to record payment'));
        }
      })
      .catch(err => {
        alert('Error: ' + err.message);
      });
    });
  }
};
