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
    <div style="margin-top:8px;font-size:0.9em;color:#888;text-align:center;">
      Note: Financial data is aggregated across all currencies for visualization purposes
    </div>
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
  
  // Fetch financials data for status chart
  fetch(`${window.API_BASE_URL}/api/financials`)
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
  fetch(`${window.API_BASE_URL}/api/invoices`)
    .then(r => r.json())
    .then(invoices => {
      // Group by month and currency
      const monthCurrencyData = {};
      
      invoices.forEach(inv => {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const currency = inv.currency || 'USD';
        
        if (!monthCurrencyData[key]) {
          monthCurrencyData[key] = {};
        }
        
        if (!monthCurrencyData[key][currency]) {
          monthCurrencyData[key][currency] = 0;
        }
        
        monthCurrencyData[key][currency] += (Number(inv.paidAmount) || 0);
      });
      
      // Get sorted list of months
      const labels = Object.keys(monthCurrencyData).sort();
      
      // Prepare datasets for each currency
      const currencies = [...new Set(invoices.map(inv => inv.currency || 'USD'))];
      const colors = ['#8c241c', '#2ecc40', '#3498db', '#f39c12', '#9b59b6', '#e74c3c'];
        const datasets = currencies.map((currency, index) => {
        return {
          label: `${currency} Revenue`,
          data: labels.map(month => (monthCurrencyData[month][currency] || 0)),
          backgroundColor: colors[index % colors.length]
        };
      });
      
      const ctx2 = document.getElementById('monthly-revenue-chart').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels,
          datasets
        },
        options: {
          plugins: {
            title: { display: true, text: 'Monthly Paid Revenue by Currency' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  const currency = label.split(' ')[0];
                  const value = context.raw;
                  return `${label}: ${getCurrencySymbol(currency)}${value.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Month' }, stacked: true },
            y: { 
              title: { display: true, text: 'Amount' }, 
              beginAtZero: true,
              stacked: true
            }
          }
        }
      });
    });
};

// Usage: Call window.renderFinancialCharts(someContainerElement) after rendering widgets.
// Requires Chart.js to be loaded in your HTML.