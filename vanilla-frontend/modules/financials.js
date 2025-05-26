window.renderFinancials = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Financial Overview</h2>
    <div id="financials-summary" style="margin-bottom:32px;">Loading...</div>
    <div class="widget-row" id="financials-widgets"></div>
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

    document.getElementById('financials-charts').innerHTML = `
      <div style="margin-bottom:12px;font-weight:bold;color:#8c241c;">Revenue Analysis</div>
      <div style="max-width:350px;">
        ${bar(200, '#2ecc40', 'Paid', paid)}
        ${bar(200, '#e45424', 'Unpaid', unpaid)}
        ${bar(200, '#943c34', 'Overdue', overdue)}
        <div style="margin-top:8px;font-size:0.95em;color:#555;">Total Revenue: $${(paid + unpaid + overdue).toFixed(2)}</div>
        <div style="margin-top:4px;font-size:0.9em;color:#888;">Note: All amounts shown in USD equivalent for aggregation</div>
      </div>
    `;
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
        }

        document.getElementById('financials-summary').innerHTML = `
          <div style="font-size:1.1em;">
            <strong>Total Revenue:</strong> <span style="color:#2ecc40;font-weight:bold;">$${data.revenue || 0}</span><br>
            <strong>Total Invoices:</strong> ${data.totalInvoices}<br>
            <div style="margin-top:8px;font-size:0.9em;color:#888;">Revenue shown in USD equivalent for aggregation</div>
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
        }
        // For each invoice, fetch its expenses and calculate profit
        const invoiceRows = await Promise.all(invoices.map(async inv => {
          let expenses = [];
          try {
            const res = await fetch(`${window.API_BASE_URL}/api/invoices/${inv._id}/expenses`);
            expenses = await res.json();
          } catch {}
          const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const profit = (inv.paidAmount || 0) - expenseTotal;
          const currency = inv.currency || 'USD';
          const currencySymbol = getCurrencySymbol(currency);
          
          return `
            <tr>
              <td>${inv.client?.name || ''} <span style="color:#b47572;font-size:0.95em;">${inv.client?.email || ''}</span></td>
              <td>${inv.status}</td>
              <td>${currencySymbol}${inv.total || 0}</td>
              <td>${currencySymbol}${inv.paidAmount || 0}</td>
              <td>${currencySymbol}${((inv.total || 0) - (inv.paidAmount || 0)).toFixed(2)}</td>
              <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ''}</td>
              <td>$${expenseTotal.toFixed(2)}</td>
              <td style="font-weight:bold;color:${profit >= 0 ? '#2ecc40' : '#d63031'};">$${profit.toFixed(2)}</td>
            </tr>
          `;
        }));        // Calculate currency breakdown
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
          
          <h3 style="color:#8c241c;">All Invoices</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="background:#8c241c;">Client</th>
                <th style="background:#8c241c;">Status</th>
                <th style="background:#8c241c;">Total</th>
                <th style="background:#8c241c;">Paid</th>
                <th style="background:#8c241c;">Due</th>
                <th style="background:#8c241c;">Due Date</th>
                <th style="background:#8c241c;">Expenses</th>
                <th style="background:#8c241c;">Profit</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceRows.join('')}
            </tbody>
          </table>
          <div style="margin-top:16px;font-size:0.9em;color:#888;">
            Note: Expenses and profit calculations are in USD. Invoice amounts show in their original currency.
          </div>
        `;
      });
  }

  fetchFinancials();
  document.getElementById('refresh-financials-btn').onclick = fetchFinancials;
};
