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
      </div>
    `;
  }

  function fetchFinancials() {
    fetch(`${window.API_BASE_URL}/api/financials`)
      .then(r => r.json())
      .then(data => {
        document.getElementById('financials-summary').innerHTML = `
          <div style="font-size:1.1em;">
            <strong>Total Revenue:</strong> <span style="color:#2ecc40;font-weight:bold;">$${data.revenue || 0}</span><br>
            <strong>Total Invoices:</strong> ${data.totalInvoices}
          </div>
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
          return `
            <tr>
              <td>${inv.client?.name || ''} <span style="color:#b47572;font-size:0.95em;">${inv.client?.email || ''}</span></td>
              <td>${inv.status}</td>
              <td>$${inv.total || 0}</td>
              <td>$${inv.paidAmount || 0}</td>
              <td>$${((inv.total || 0) - (inv.paidAmount || 0)).toFixed(2)}</td>
              <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ''}</td>
              <td>$${expenseTotal.toFixed(2)}</td>
              <td style="font-weight:bold;color:${profit >= 0 ? '#2ecc40' : '#d63031'};">$${profit.toFixed(2)}</td>
            </tr>
          `;
        }));
        document.getElementById('financials-details').innerHTML = `
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
        `;
      });
  }

  fetchFinancials();
  document.getElementById('refresh-financials-btn').onclick = fetchFinancials;
};
