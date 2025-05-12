// Attach to window for global access
window.renderFinancials = function(main) {
  main.innerHTML = `
    <h2 style="color:#8c241c;">Financial Overview</h2>
    <div id="financials-summary" style="margin-bottom:32px;">Loading...</div>
    <div class="widget-row" id="financials-widgets"></div>
    <div id="financials-charts" style="margin:32px 0 24px 0;"></div>
    <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start;">
      <div style="flex:1;min-width:320px;">
        <h3 style="color:#8c241c;">Expenses</h3>
        <button id="add-expense-btn" class="finance-form-btn" style="margin-bottom:18px;width:100%;">Add Expense</button>
        <div id="expenses-list" style="margin-top:18px;"></div>
      </div>
      <div style="flex:1;min-width:320px;">
        <h3 style="color:#8c241c;">Income</h3>
        <button id="add-income-btn" class="finance-form-btn" style="margin-bottom:18px;width:100%;">Add Income</button>
        <div id="income-list" style="margin-top:18px;"></div>
      </div>
    </div>
    <div id="financials-details"></div>
    <button id="refresh-financials-btn" style="margin:16px 0;padding:6px 16px;">Refresh</button>
    <div id="expense-modal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:2000;align-items:center;justify-content:center;">
      <div style="background:#fff;padding:32px 24px;border-radius:10px;max-width:400px;width:95vw;box-shadow:0 4px 32px #8c241c33;position:relative;">
        <button id="close-expense-modal" type="button" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:1.5em;color:#8c241c;cursor:pointer;">&times;</button>
        <h3 style="color:#8c241c;">Add Expense</h3>
        <form id="expense-form-modal">
          <input type="date" name="date" required class="finance-form-input">
          <input type="number" name="amount" placeholder="Amount" required min="0" step="0.01" class="finance-form-input">
          <input type="text" name="category" placeholder="Category" required class="finance-form-input">
          <input type="text" name="description" placeholder="Description" class="finance-form-input">
          <select name="invoice" id="expense-invoice-select-modal" class="finance-form-select">
            <option value="">(Optional) Link to Invoice</option>
          </select>
          <button type="submit" class="finance-form-btn">Add Expense</button>
        </form>
      </div>
    </div>
    <div id="income-modal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);z-index:2000;align-items:center;justify-content:center;">
      <div style="background:#fff;padding:32px 24px;border-radius:10px;max-width:400px;width:95vw;box-shadow:0 4px 32px #8c241c33;position:relative;">
        <button id="close-income-modal" type="button" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:1.5em;color:#8c241c;cursor:pointer;">&times;</button>
        <h3 style="color:#8c241c;">Add Income</h3>
        <form id="income-form-modal">
          <input type="date" name="date" required class="finance-form-input">
          <input type="number" name="amount" placeholder="Amount" required min="0" step="0.01" class="finance-form-input">
          <input type="text" name="source" placeholder="Source" required class="finance-form-input">
          <input type="text" name="description" placeholder="Description" class="finance-form-input">
          <button type="submit" class="finance-form-btn">Add Income</button>
        </form>
      </div>
    </div>
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
            const res = await fetch(`${window.API_BASE_URL}/api/invoices/${inv._id}/expenses`, { credentials: 'include' });
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

  // Expense logic
  // Populate invoice select for expenses
  fetch(`${window.API_BASE_URL}/api/invoices`, { credentials: 'include' })
    .then(r => r.json())
    .then(invoices => {
      const select = document.getElementById('expense-invoice-select');
      select.innerHTML = '<option value="">(Optional) Link to Invoice</option>' +
        invoices.map(inv => `<option value="${inv._id}">${inv.number || inv._id} - $${inv.total} (${inv.status})</option>`).join('');
    });

  function fetchExpenses() {
    fetch(`${window.API_BASE_URL}/api/expenses`, { credentials: 'include' })
      .then(r => r.json())
      .then(expenses => {
        document.getElementById('expenses-list').innerHTML = `
          <h4 style="color:#8c241c;">Expenses</h4>
          <table class="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Category</th><th>Description</th><th>Invoice</th></tr></thead>
            <tbody>
              ${expenses.map(e => `
                <tr>
                  <td>${e.date ? new Date(e.date).toLocaleDateString() : ''}</td>
                  <td>$${e.amount.toFixed(2)}</td>
                  <td>${e.category}</td>
                  <td>${e.description || ''}</td>
                  <td>${e.invoice || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      });
  }
  document.getElementById('expense-form').onsubmit = function(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = Object.fromEntries(fd.entries());
    fetch(`${window.API_BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(r => r.json()).then(() => {
      ev.target.reset();
      fetchExpenses();
    });
  };
  fetchExpenses();

  // Income logic
  function fetchIncome() {
    fetch(`${window.API_BASE_URL}/api/income`, { credentials: 'include' })
      .then(r => r.json())
      .then(income => {
        document.getElementById('income-list').innerHTML = `
          <h4 style="color:#8c241c;">Income</h4>
          <table class="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Source</th><th>Description</th></tr></thead>
            <tbody>
              ${income.map(i => `
                <tr>
                  <td>${i.date ? new Date(i.date).toLocaleDateString() : ''}</td>
                  <td>$${i.amount.toFixed(2)}</td>
                  <td>${i.source}</td>
                  <td>${i.description || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      });
  }
  document.getElementById('income-form').onsubmit = function(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = Object.fromEntries(fd.entries());
    fetch(`${window.API_BASE_URL}/api/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(r => r.json()).then(() => {
      ev.target.reset();
      fetchIncome();
    });
  };
  fetchIncome();
  document.getElementById('refresh-financials-btn').onclick = fetchFinancials;

  // Modal logic for expense and income (ensure DOM is ready)
  setTimeout(() => {
    document.getElementById('add-expense-btn').onclick = function() {
      document.getElementById('expense-modal').style.display = 'flex';
      fetch(`${window.API_BASE_URL}/api/invoices`, { credentials: 'include' })
        .then(r => r.json())
        .then(invoices => {
          const select = document.getElementById('expense-invoice-select-modal');
          select.innerHTML = '<option value="">(Optional) Link to Invoice</option>' +
            invoices.map(inv => `<option value="${inv._id}">${inv.number || inv._id} - $${inv.total} (${inv.status})</option>`).join('');
        });
    };
    document.getElementById('close-expense-modal').onclick = function() {
      document.getElementById('expense-modal').style.display = 'none';
    };
    document.getElementById('expense-modal').onclick = function(e) {
      if (e.target === this) this.style.display = 'none';
    };
    document.getElementById('expense-form-modal').onsubmit = function(ev) {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const data = Object.fromEntries(fd.entries());
      fetch(`${window.API_BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(r => r.json()).then(() => {
        ev.target.reset();
        document.getElementById('expense-modal').style.display = 'none';
        fetchExpenses();
      });
    };
    document.getElementById('add-income-btn').onclick = function() {
      document.getElementById('income-modal').style.display = 'flex';
    };
    document.getElementById('close-income-modal').onclick = function() {
      document.getElementById('income-modal').style.display = 'none';
    };
    document.getElementById('income-modal').onclick = function(e) {
      if (e.target === this) this.style.display = 'none';
    };
    document.getElementById('income-form-modal').onsubmit = function(ev) {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const data = Object.fromEntries(fd.entries());
      fetch(`${window.API_BASE_URL}/api/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(r => r.json()).then(() => {
        ev.target.reset();
        document.getElementById('income-modal').style.display = 'none';
        fetchIncome();
      });
    };
  }, 0);
};
