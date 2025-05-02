// Add financial charts below widgets in the overview/dashboard
window.renderFinancialCharts = function(container) {
  container.innerHTML += `
    <div id="financial-charts" style="margin-top:32px;display:flex;gap:32px;flex-wrap:wrap;">
      <div style="flex:1;min-width:320px;">
        <canvas id="revenue-status-chart" height="180"></canvas>
      </div>
      <div style="flex:1;min-width:320px;">
        <canvas id="monthly-revenue-chart" height="180"></canvas>
      </div>
    </div>
  `;

  // Fetch financials data for status chart
  fetch('http://localhost:5000/api/financials')
    .then(r => r.json())
    .then(data => {
      // Pie chart for Paid/Unpaid/Overdue revenue
      const ctx1 = document.getElementById('revenue-status-chart').getContext('2d');
      new Chart(ctx1, {
        type: 'pie',
        data: {
          labels: ['Paid', 'Unpaid', 'Overdue'],
          datasets: [{
            data: [data.paidRevenue, data.unpaidRevenue, data.overdueRevenue],
            backgroundColor: ['#2ecc40', '#f39c12', '#e74c3c']
          }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Revenue Breakdown' },
            legend: { position: 'bottom' }
          }
        }
      });
    });

  // Fetch monthly revenue for bar chart
  fetch('http://localhost:5000/api/invoices')
    .then(r => r.json())
    .then(invoices => {
      // Group by month
      const months = {};
      invoices.forEach(inv => {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = (months[key] || 0) + (Number(inv.paidAmount) || 0);
      });
      const labels = Object.keys(months).sort();
      const values = labels.map(l => months[l]);
      const ctx2 = document.getElementById('monthly-revenue-chart').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Paid Revenue',
            data: values,
            backgroundColor: '#8c241c'
          }]
        },
        options: {
          plugins: {
            title: { display: true, text: 'Monthly Paid Revenue' },
            legend: { display: false }
          },
          scales: {
            x: { title: { display: true, text: 'Month' } },
            y: { title: { display: true, text: 'Amount ($)' }, beginAtZero: true }
          }
        }
      });
    });
};

// Usage: Call window.renderFinancialCharts(someContainerElement) after rendering widgets.
// Requires Chart.js to be loaded in your HTML.