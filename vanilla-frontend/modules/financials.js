window.renderFinancials = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Financial Overview</h2>
    <div id="financials-summary" style="margin-bottom:32px;">Loading...</div>
    <div class="widget-row" id="financials-widgets"></div>
    
    <!-- Online Payment Transactions (moved up for better visibility) -->
    <div id="payments-section" style="margin:32px 0;">
      <h3 style="color:#8c241c;">Online Payment Transactions</h3>
      <div id="payments-list">Loading payments...</div>
    </div>
    
    <div id="financials-charts" style="margin:32px 0 24px 0;"></div>
    <div id="financials-details"></div>
    <button id="refresh-financials-btn" style="margin:16px 0;padding:6px 16px;">Refresh</button>
    <style>
      .finance-form-input {
        width: 100%;
        padding: 0.7rem;
        margin-bottom: 10px;
        border: 1.5px solid #8c241c;
        border-radius: 6px;
        background: #f8f9fa;
        font-size: 1em;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px #e9c7bf33;
      }
      .finance-form-input:focus {
        outline: none;
        border-color: #eb7b24;
        box-shadow: 0 2px 8px #e9c7bf66;
        background: #fff;
      }
      .finance-form-select {
        width: 100%;
        padding: 0.7rem;
        margin-bottom: 10px;
        border: 1.5px solid #8c241c;
        border-radius: 6px;
        background: #f8f9fa;
        font-size: 1em;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px #e9c7bf33;
      }
      .finance-form-select:focus {
        outline: none;
        border-color: #eb7b24;
        box-shadow: 0 2px 8px #e9c7bf66;
        background: #fff;
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
        box-shadow: 0 1px 4px #e9c7bf33;
      }
      .finance-form-btn:hover {
        background: #a63a2e;
        box-shadow: 0 2px 12px #e9c7bf66;
      }
      .modal { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.18); z-index: 2000; align-items: center; justify-content: center; }
      .modal[open], .modal.show { display: flex !important; }
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

  // Helper function to group monetary amounts by currency
  function formatMultiCurrency(amounts) {
    const grouped = {};
    amounts.forEach(item => {
      const currency = item.currency || 'USD';
      if (!grouped[currency]) {
        grouped[currency] = 0;
      }
      grouped[currency] += item.amount || 0;
    });
    
    return Object.entries(grouped)
      .map(([currency, amount]) => `${getCurrencySymbol(currency)}${amount.toFixed(2)}`)
      .join(' + ');
  }
  function renderCharts(data) {
    // Destroy any existing Chart.js instances before creating new ones
    Chart.helpers.each(Chart.instances, (instance) => {
      instance.destroy();
    });
    Chart.instances = [];
    
    // Simple bar chart using inline SVG (no dependencies)
    const paid = data.paidRevenue || 0;
    const unpaid = data.unpaidRevenue || 0;
    const overdue = data.overdueRevenue || 0;
    const total = paid + unpaid + overdue || 1;

    function bar(width, color, label, value) {
      return `
        <div style="display:flex;align-items:center;margin-bottom:8px;">
          <div style="width:80px;">${label}</div>
          <svg width="220" height="18" style="margin-right:10px;">
            <rect x="0" y="2" width="${Math.max(10, 200 * value / total)}" height="14" fill="${color}" rx="4"/>
          </svg>
          <span style="font-weight:bold;color:${color};">$${value.toFixed(2)}</span>
        </div>
      `;
    }

    // Display exchange rates if available
    let exchangeRateInfo = '';
    if (data.exchangeRates) {
      const rates = data.exchangeRates;
      exchangeRateInfo = `
        <div style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:6px;border-left:4px solid #8c241c;">
          <div style="font-weight:bold;margin-bottom:8px;color:#8c241c;">Current Exchange Rates (to USD)</div>
          <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.9em;">
            ${Object.entries(rates).filter(([curr]) => curr !== 'USD').map(([currency, rate]) => 
              `<span><strong>${currency}:</strong> ${rate.toFixed(4)}</span>`
            ).join('')}
          </div>          <div style="margin-top:8px;font-size:0.85em;color:#666;">
            Exchange rates are approximate and used for aggregation purposes only.<br>
            <a href="#" id="view-current-rates" style="color:#8c241c;text-decoration:none;">View current rates</a>
          </div>
        </div>
      `;
    }

    document.getElementById('financials-charts').innerHTML = `
      <div style="margin-bottom:12px;font-weight:bold;color:#8c241c;">Revenue Analysis (USD Equivalents)</div>
      <div style="max-width:350px;">
        ${bar(200, '#2ecc40', 'Paid', paid)}
        ${bar(200, '#e45424', 'Unpaid', unpaid)}
        ${bar(200, '#943c34', 'Overdue', overdue)}
        <div style="margin-top:8px;font-size:0.95em;color:#555;">Total Revenue: $${(paid + unpaid + overdue).toFixed(2)}</div>
        <div style="margin-top:4px;font-size:0.9em;color:#888;">All amounts converted to USD using current exchange rates</div>
      </div>
      ${exchangeRateInfo}
    `;
  }
  
  function fetchPayments() {
    console.log('Starting to fetched payments...');
    // Fetch all invoices to get their IDs
    fetch(`${window.API_BASE_URL}/api/invoices`)
      .then(r => r.json())
      .then(invoices => {
        console.log(`Found ${invoices.length} invoices`);
        if (!invoices.length) {
          document.getElementById('payments-list').innerHTML = '<p>No invoices found.</p>';
          return;
        }
        
        // For each invoice, fetch its payments
        Promise.all(invoices.map(invoice => 
          fetch(`${window.API_BASE_URL}/api/payments/invoice/${invoice._id}`, { credentials: 'include' })
            .then(r => {
              if (!r.ok) {
                console.error(`Payment fetch failed for invoice ${invoice._id}:`, r.status, r.statusText);
                throw new Error(`HTTP ${r.status}`);
              }
              return r.json();
            })
            .then(payments => {
              console.log(`Fetched ${payments.length} payments for invoice ${invoice.number}`);
              return {
                invoice,
                payments
              };
            })
            .catch(error => {
              console.log(`No payments found for invoice ${invoice._id}:`, error.message);
              return {
                invoice,
                payments: []
              };
            })
        ))
        .then(results => {
          // Flatten all payments into a single array
          const allPayments = results
            .flatMap(result => result.payments.map(payment => ({
              ...payment,
              invoice: result.invoice
            })))
            .filter(payment => payment._id); // Filter out any empty results
            
          console.log(`Total payments found: ${allPayments.length}`);
          
          if (!allPayments.length) {
            document.getElementById('payments-list').innerHTML = '<p>No payment transactions found.</p>';
            return;
          }
          
          // Sort payments by date, newest first
          allPayments.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
          
          // Render payments table
          document.getElementById('payments-list').innerHTML = `
            <table class="data-table">
              <thead>
                <tr>
                  <th style="background:#8c241c;">Date</th>
                  <th style="background:#8c241c;">Invoice</th>
                  <th style="background:#8c241c;">Amount</th>
                  <th style="background:#8c241c;">Method</th>
                  <th style="background:#8c241c;">Status</th>
                  <th style="background:#8c241c;">Transaction ID</th>
                  <th style="background:#8c241c;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allPayments.map(payment => {
                  const date = payment.paymentDate || payment.createdAt;
                  const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
                  const currencySymbol = getCurrencySymbol(payment.currency);
                  
                  // Determine status color
                  let statusColor = '#666';
                  if (payment.status === 'COMPLETED') statusColor = '#2ecc40';
                  if (payment.status === 'FAILED') statusColor = '#e74c3c';
                  if (payment.status === 'PENDING') statusColor = '#f39c12';
                  
                  return `
                    <tr>
                      <td>${formattedDate}</td>
                      <td>${payment.invoice?.number || 'Unknown'}</td>
                      <td>${currencySymbol}${payment.amount.toFixed(2)}</td>
                      <td>${payment.paymentMethod || payment.method || 'N/A'}</td>
                      <td style="color:${statusColor};font-weight:bold;">${payment.status || 'N/A'}</td>
                      <td>${payment.transactionId || 'N/A'}</td>
                      <td>
                        <button class="delete-payment-btn" data-payment-id="${payment._id}" data-invoice-number="${payment.invoice?.number || 'Unknown'}" style="background:#e74c3c;color:#fff;border:none;padding:3px 6px;border-radius:3px;cursor:pointer;font-size:11px;">Delete</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
          
          // Add click handlers for delete payment buttons
          document.querySelectorAll('.delete-payment-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
              const paymentId = this.getAttribute('data-payment-id');
              const invoiceNumber = this.getAttribute('data-invoice-number');
              
              if (confirm(`Are you sure you want to delete this payment for invoice ${invoiceNumber}? This will reset the invoice payment status.`)) {
                try {
                  const response = await fetch(`${window.API_BASE_URL}/api/payments/${paymentId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    alert('Payment deleted successfully! Invoice status updated.');
                    fetchPayments(); // Refresh the payments list
                    fetchFinancials(); // Refresh the financials overview
                  } else {
                    alert('Error deleting payment: ' + (result.error || 'Unknown error'));
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
        // Create currency-specific summary if available
        let currencySummaryHtml = '';
        if (data.currencyData) {
          const currencies = Object.keys(data.currencyData);
          if (currencies.length > 0) {
            currencySummaryHtml = `
              <h4 style="margin:16px 0 8px;color:#8c241c;">Revenue by Currency</h4>
              <div style="display:flex;flex-wrap:wrap;gap:16px;">
                ${currencies.map(currency => {
                  const currData = data.currencyData[currency];
                  const symbol = getCurrencySymbol(currency);
                  return `
                    <div style="border:1px solid #eee;border-radius:6px;padding:8px 12px;background:#f8f9fa;flex:1;min-width:250px;">
                      <div style="font-weight:bold;margin-bottom:4px;">${currency} (${currData.totalInvoices} invoices)</div>
                      <div style="font-size:0.95em;display:flex;flex-direction:column;gap:3px;">
                        <div>Revenue: <strong>${symbol}${currData.paidRevenue.toFixed(2)}</strong></div>
                        <div>Unpaid: <strong style="color:#e45424;">${symbol}${currData.unpaidRevenue.toFixed(2)}</strong></div>
                        <div>Overdue: <strong style="color:#943c34;">${symbol}${currData.overdueRevenue.toFixed(2)}</strong></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }
        }        document.getElementById('financials-summary').innerHTML = `
          <div style="font-size:1.1em;">
            <strong>Total Revenue:</strong> <span style="color:#2ecc40;font-weight:bold;">$${data.revenue || 0}</span><br>
            <strong>Total Invoices:</strong> ${data.totalInvoices}<br>
            <div style="margin-top:8px;font-size:0.9em;color:#888;">Revenue converted to USD equivalents using current exchange rates</div>
          </div>
          ${currencySummaryHtml}
        `;
        document.getElementById('financials-widgets').innerHTML = `
          <div class="widget">
            <div class="widget-title">Paid Invoices</div>
            <div class="widget-count" style="color:#2ecc40;">${data.paid}</div>
          </div>
          <div class="widget">
            <div class="widget-title">Unpaid Invoices</div>
            <div class="widget-count" style="color:#e45424;">${data.unpaid}</div>
          </div>
          <div class="widget">
            <div class="widget-title">Overdue Invoices</div>
            <div class="widget-count" style="color:#943c34;">${data.overdue}</div>
          </div>
        `;
        // Render revenue analysis charts
        renderCharts(data);
      });

      fetch(`${window.API_BASE_URL}/api/invoices`)
      .then(r => r.json())
      .then(async invoices => {
        if (!invoices.length) {
          document.getElementById('financials-details').innerHTML = '<p>No invoices found.</p>';
          return;
        }        // For each invoice, fetch its expenses and calculate profit
        const invoiceRows = await Promise.all(invoices.map(async inv => {
          let expenses = [];
          try {
            const res = await fetch(`${window.API_BASE_URL}/api/invoices/${inv._id}/expenses`);
            expenses = await res.json();
          } catch {}
          const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          
          // Convert all amounts to USD equivalents for consistent display
          const currency = inv.currency || 'USD';
          const totalUSD = convertToUSD(Number(inv.total || 0), currency);
          const paidUSD = convertToUSD(Number(inv.paidAmount || 0), currency);
          const dueUSD = convertToUSD(Math.max((Number(inv.total || 0) - Number(inv.paidAmount || 0)), 0), currency);
          const profit = paidUSD - expenseTotal;
          
          // Show original currency in parentheses for reference
          const currencySymbol = getCurrencySymbol(currency);
          const originalTotal = `${currencySymbol}${(inv.total || 0)}`;
          const originalPaid = `${currencySymbol}${(inv.paidAmount || 0)}`;
          const originalDue = `${currencySymbol}${((inv.total || 0) - (inv.paidAmount || 0)).toFixed(2)}`;
          
          // Add payment link button if available
          const paymentLinkBtn = inv.paymentLink ? 
            `<button class="copy-payment-link" data-link="${inv.paymentLink}" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">Copy Payment Link</button>` : 
            '';
          
          return `
            <tr>
              <td>${inv.client?.name || ''} <span style="color:#b47572;font-size:0.95em;">${inv.client?.email || ''}</span></td>
              <td>${inv.status}</td>
              <td>$${totalUSD.toFixed(2)} <span style="font-size:0.85em;color:#888;">(${originalTotal})</span></td>
              <td>$${paidUSD.toFixed(2)} <span style="font-size:0.85em;color:#888;">(${originalPaid})</span></td>
              <td>$${dueUSD.toFixed(2)} <span style="font-size:0.85em;color:#888;">(${originalDue})</span></td>
              <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ''}</td>
              <td>$${expenseTotal.toFixed(2)}</td>
              <td style="font-weight:bold;color:${profit >= 0 ? '#2ecc40' : '#d63031'};">$${profit.toFixed(2)}</td>
              <td>${paymentLinkBtn}</td>
            </tr>
          `;
        }));// Calculate currency breakdown
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
              <div style="background:#f8f9fa;padding:12px;border-radius:6px;margin-bottom:8px;">
                <div style="font-weight:bold;color:#8c241c;margin-bottom:4px;">${currency} (${data.count} invoices)</div>
                <div style="display:flex;gap:24px;font-size:0.95em;">
                  <span>Total: <strong>${symbol}${data.total.toFixed(2)}</strong></span>
                  <span>Paid: <strong style="color:#2ecc40;">${symbol}${data.paid.toFixed(2)}</strong></span>
                  <span>Due: <strong style="color:#e45424;">${symbol}${due.toFixed(2)}</strong></span>
                </div>
              </div>
            `;
          }).join('');

        document.getElementById('financials-details').innerHTML = `
          <h3 style="color:#8c241c;">Currency Breakdown</h3>
          <div style="margin-bottom:24px;">
            ${currencyBreakdownHtml}
          </div>
            <h3 style="color:#8c241c;">All Invoices (USD Equivalents)</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="background:#8c241c;">Client</th>
                <th style="background:#8c241c;">Status</th>
                <th style="background:#8c241c;">Total (USD)</th>
                <th style="background:#8c241c;">Paid (USD)</th>
                <th style="background:#8c241c;">Due (USD)</th>
                <th style="background:#8c241c;">Due Date</th>
                <th style="background:#8c241c;">Expenses (USD)</th>
                <th style="background:#8c241c;">Profit (USD)</th>
                <th style="background:#8c241c;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceRows.join('')}
            </tbody>
          </table>          <div style="margin-top:16px;font-size:0.9em;color:#888;">
            <strong>Important Notes:</strong><br>
            • All amounts in the "All Invoices" section are converted to USD equivalents using current exchange rates<br>
            • Original currency amounts shown in parentheses for reference<br>
            • Expenses and profit calculations use USD equivalents for consistent aggregation<br>
            • Exchange rates are approximate and for internal analysis only
          </div>
        `;
        
        // Add event listeners for copy payment link buttons
        document.querySelectorAll('.copy-payment-link').forEach(btn => {
          btn.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            navigator.clipboard.writeText(link)
              .then(() => {
                this.textContent = 'Copied!';
                setTimeout(() => {
                  this.textContent = 'Copy Payment Link';
                }, 2000);
              })
              .catch(() => {
                alert('Failed to copy payment link. Please try again.');
              });
          });
        });
      });
  }
  
  // Fetch both financial data and payment transactions
  fetchFinancials();
  fetchPayments();
  
  document.getElementById('refresh-financials-btn').onclick = function() {
    fetchFinancials();
    fetchPayments();
  };
  
  // Add event listener for viewing exchange rates
  document.addEventListener('click', function(e) {
    if (e.target.id === 'view-current-rates') {
      e.preventDefault();
      fetch(`${window.API_BASE_URL}/api/exchange-rates`)
        .then(r => r.json())
        .then(data => {
          const ratesList = Object.entries(data.rates)
            .filter(([curr]) => curr !== 'USD')
            .map(([currency, rate]) => `${currency}: ${rate.toFixed(4)} USD`)
            .join('<br>');
          
          alert(`Current Exchange Rates (Base: USD)\n\n${ratesList.replace(/<br>/g, '\n')}\n\nLast Updated: ${new Date(data.lastUpdated).toLocaleString()}`);
        })
        .catch(() => alert('Unable to fetch current exchange rates'));
    }
  });
  
  // Add manual payment form
  document.getElementById('financials-details').insertAdjacentHTML('afterend', `
    <div style="margin-top:32px;">
      <h3 style="color:#8c241c;">Add Manual Payment</h3>
      <form id="add-payment-form" style="max-width:600px;background:#f8f9fa;padding:16px;border-radius:8px;border:1px solid #eee;">
        <div style="margin-bottom:16px;">
          <label style="display:block;margin-bottom:6px;font-weight:bold;">Invoice</label>
          <select id="payment-invoice-select" class="finance-form-select" required>
            <option value="">Select Invoice</option>
            <!-- Will be populated with invoices -->
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;margin-bottom:6px;font-weight:bold;">Amount</label>
          <input type="number" id="payment-amount" class="finance-form-input" step="0.01" min="0" required placeholder="Enter payment amount">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;margin-bottom:6px;font-weight:bold;">Payment Method</label>
          <select id="payment-method-select" class="finance-form-select" required>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="MPESA">M-Pesa</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;margin-bottom:6px;font-weight:bold;">Transaction ID/Reference</label>
          <input type="text" id="payment-transaction-id" class="finance-form-input" placeholder="Optional reference number">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;margin-bottom:6px;font-weight:bold;">Payment Date</label>
          <input type="date" id="payment-date" class="finance-form-input" required>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;margin-bottom:6px;font-weight:bold;">Notes</label>
          <textarea id="payment-notes" class="finance-form-input" rows="3" placeholder="Optional notes about this payment"></textarea>
        </div>
        <button type="submit" class="finance-form-btn">Record Payment</button>
      </form>
    </div>
  `);
  
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
  
  // Set today's date as default for payment date
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
      
      // Get currency from selected invoice option
      const selectedOption = document.getElementById('payment-invoice-select').options[
        document.getElementById('payment-invoice-select').selectedIndex
      ];
      const currency = selectedOption.getAttribute('data-currency') || 'USD';
      
      // Submit manual payment
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
          // Set today's date again
          document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
          // Refresh data
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