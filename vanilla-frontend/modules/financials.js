// Attach to window for global access
window.renderFinancials = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Financial Overview</h2>
    <div id="financials-summary" style="margin-bottom:32px;">Loading...</div>
    <div class="widget-row" id="financials-widgets"></div>
    <div id="financials-charts" style="margin:32px 0 24px 0;"></div>
    <div id="financials-details"></div>
    <button id="refresh-financials-btn" style="margin:16px 0;padding:6px 16px;">Refresh</button>
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
    fetch('http://localhost:5000/api/financials')
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

    fetch('http://localhost:5000/api/invoices')
      .then(r => r.json())
      .then(invoices => {
        if (!invoices.length) {
          document.getElementById('financials-details').innerHTML = '<p>No invoices found.</p>';
          return;
        }
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
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td>${inv.client?.name || ''} <span style="color:#b47572;font-size:0.95em;">${inv.client?.email || ''}</span></td>
                  <td>${inv.status}</td>
                  <td>$${inv.total || 0}</td>
                  <td>$${inv.paidAmount || 0}</td>
                  <td>$${((inv.total || 0) - (inv.paidAmount || 0)).toFixed(2)}</td>
                  <td>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      });
  }

  fetchFinancials();
  document.getElementById('refresh-financials-btn').onclick = fetchFinancials;
};
