// Add financial charts below widgets in the overview/dashboard

// Store chart instances for cleanup
window.chartInstances = window.chartInstances || [];

// Cleanup function to destroy existing charts
window.destroyCharts = function() {
  window.chartInstances.forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  window.chartInstances = [];
};

window.renderFinancialCharts = function(container) {
  // Clean up any existing charts first
  window.destroyCharts();
  
  container.innerHTML = `
    <div id="financial-charts" style="margin-top:32px;">
      <!-- Top Row: Main Revenue Charts -->
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;">
        <div style="flex:1;min-width:300px;background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(140,36,28,0.1);border:1px solid #f0f0f0;">
          <div style="margin-bottom:16px;text-align:center;">
            <h3 style="color:#8c241c;margin:0;font-size:1.1em;">Revenue Status</h3>
            <p style="margin:4px 0 0;font-size:0.9em;color:#666;">Distribution by payment status</p>
          </div>
          <canvas id="revenue-status-chart" style="max-height:250px;"></canvas>
        </div>
        
        <div style="flex:1;min-width:300px;background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(140,36,28,0.1);border:1px solid #f0f0f0;">
          <div style="margin-bottom:16px;text-align:center;">
            <h3 style="color:#8c241c;margin:0;font-size:1.1em;">Currency Breakdown</h3>
            <p style="margin:4px 0 0;font-size:0.9em;color:#666;">Revenue distribution by currency</p>
          </div>
          <canvas id="currency-breakdown-chart" style="max-height:250px;"></canvas>
        </div>
      </div>      <!-- Middle Row: Monthly Trends -->
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(140,36,28,0.1);border:1px solid #f0f0f0;margin-bottom:32px;">
        <div style="margin-bottom:16px;text-align:center;">
          <h3 style="color:#8c241c;margin:0;font-size:1.1em;">Monthly Revenue Trends</h3>
          <p style="margin:4px 0 0;font-size:0.9em;color:#666;">Paid revenue over the last 12 months</p>
        </div>
        <canvas id="monthly-revenue-chart" style="height:180px;max-height:180px;"></canvas>
      </div>

      <!-- Bottom Row: Additional Insights -->
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:300px;background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(140,36,28,0.1);border:1px solid #f0f0f0;">
          <div style="margin-bottom:16px;text-align:center;">
            <h3 style="color:#8c241c;margin:0;font-size:1.1em;">Invoice Volume</h3>
            <p style="margin:4px 0 0;font-size:0.9em;color:#666;">Monthly invoice count trends</p>
          </div>
          <canvas id="invoice-volume-chart" style="max-height:200px;"></canvas>
        </div>
        
        <div style="flex:1;min-width:300px;background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(140,36,28,0.1);border:1px solid #f0f0f0;">
          <div style="margin-bottom:16px;text-align:center;">
            <h3 style="color:#8c241c;margin:0;font-size:1.1em;">Average Invoice Value</h3>
            <p style="margin:4px 0 0;font-size:0.9em;color:#666;">USD equivalent trends</p>
          </div>
          <canvas id="avg-invoice-chart" style="max-height:200px;"></canvas>
        </div>
      </div>
    </div>
    
    <div style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:8px;border-left:4px solid #8c241c;">
      <div style="font-size:0.9em;color:#666;text-align:center;">
        <strong>Note:</strong> Financial data converted to USD equivalents using current exchange rates for aggregation purposes
      </div>
    </div>
  `;

  // Enhanced color schemes
  const statusColors = {
    paid: '#2ecc40',
    unpaid: '#f39c12', 
    overdue: '#e74c3c'
  };

  const currencyColors = {
    'USD': '#8c241c',
    'KES': '#2ecc40',
    'GBP': '#3498db',
    'EUR': '#9b59b6',
    'CAD': '#f39c12',
    'AUD': '#e67e22'
  };

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

  // Helper to convert currency to USD (simplified rates)
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

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#8c241c',
        borderWidth: 1,
        cornerRadius: 6
      }
    }
  };    // Fetch financials data for status chart
  fetch(`${window.API_BASE_URL}/api/financials`)
    .then(r => r.json())
    .then(data => {      // 1. Revenue Status Doughnut Chart (improved pie chart)
      const ctx1 = document.getElementById('revenue-status-chart').getContext('2d');
      const chart1 = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Paid Revenue', 'Unpaid Revenue', 'Overdue Revenue'],
          datasets: [{
            data: [data.paidRevenue, data.unpaidRevenue, data.overdueRevenue],
            backgroundColor: [statusColors.paid, statusColors.unpaid, statusColors.overdue],
            borderWidth: 3,
            borderColor: '#fff',
            hoverBorderWidth: 4,
            hoverOffset: 8
          }]
        },
        options: {
          ...commonOptions,
          cutout: '60%',
          plugins: {
            ...commonOptions.plugins,
            tooltip: {
              ...commonOptions.plugins.tooltip,              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      // Store chart for cleanup
      window.chartInstances.push(chart1);

      // 2. Currency Breakdown Polar Area Chart
      if (data.currencyData) {
        const currencies = Object.keys(data.currencyData);
        const currencyValues = currencies.map(curr => data.currencyData[curr].paidRevenue);
        const currencyColors_array = currencies.map(curr => currencyColors[curr] || '#95a5a6');
          const ctx_currency = document.getElementById('currency-breakdown-chart').getContext('2d');
        const chart2 = new Chart(ctx_currency, {
          type: 'polarArea',
          data: {
            labels: currencies.map(curr => `${curr} Revenue`),
            datasets: [{
              data: currencyValues,
              backgroundColor: currencyColors_array.map(color => color + '80'), // Add transparency
              borderColor: currencyColors_array,
              borderWidth: 2
            }]
          },
          options: {
            ...commonOptions,
            scales: {
              r: {
                beginAtZero: true,
                grid: { color: '#f0f0f0' },
                ticks: { 
                  font: { size: 10 },
                  color: '#666'
                }
              }
            },
            plugins: {
              ...commonOptions.plugins,
              tooltip: {
                ...commonOptions.plugins.tooltip,
                callbacks: {                  label: function(context) {
                    const currency = currencies[context.dataIndex];
                    const value = context.raw;
                    const symbol = getCurrencySymbol(currency);
                    return `${context.label}: ${symbol}${value.toFixed(2)}`;
                  }
                }
              }
            }
          }
        });
        
        // Store chart for cleanup
        window.chartInstances.push(chart2);
      }
    });

  // Fetch invoices for detailed charts
  fetch(`${window.API_BASE_URL}/api/invoices`)
    .then(r => r.json())
    .then(invoices => {
      // Process monthly data with USD conversion
      const monthlyData = {};
      const monthlyVolume = {};
      
      invoices.forEach(inv => {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const paidAmount = Number(inv.paidAmount) || 0;
        const currency = inv.currency || 'USD';
        const paidUSD = convertToUSD(paidAmount, currency);
        
        if (!monthlyData[key]) {
          monthlyData[key] = { total: 0, byStatus: { paid: 0, unpaid: 0, overdue: 0 } };
          monthlyVolume[key] = { total: 0, byStatus: { paid: 0, unpaid: 0, overdue: 0 } };
        }
        
        monthlyData[key].total += paidUSD;
        monthlyVolume[key].total += 1;
        
        if (inv.status) {
          const status = inv.status.toLowerCase();
          if (monthlyData[key].byStatus[status] !== undefined) {
            monthlyData[key].byStatus[status] += paidUSD;
            monthlyVolume[key].byStatus[status] += 1;
          }
        }
      });

      // Get last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      }

      // 3. Monthly Revenue Trends (Line Chart)
      const monthlyRevenue = months.map(month => monthlyData[month]?.total || 0);
      const paidRevenue = months.map(month => monthlyData[month]?.byStatus.paid || 0);
        const ctx3 = document.getElementById('monthly-revenue-chart').getContext('2d');
      const chart3 = new Chart(ctx3, {
        type: 'line',
        data: {
          labels: months.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }),
          datasets: [
            {
              label: 'Total Revenue (USD)',
              data: monthlyRevenue,
              borderColor: '#8c241c',
              backgroundColor: 'rgba(140, 36, 28, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#8c241c',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8
            },
            {
              label: 'Paid Revenue (USD)',
              data: paidRevenue,
              borderColor: '#2ecc40',
              backgroundColor: 'rgba(46, 204, 64, 0.1)',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              pointBackgroundColor: '#2ecc40',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            x: {
              grid: { color: '#f0f0f0', drawBorder: false },
              ticks: { font: { size: 11 }, color: '#666' }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#f0f0f0', drawBorder: false },
              ticks: { 
                font: { size: 11 }, 
                color: '#666',
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          plugins: {
            ...commonOptions.plugins,
            tooltip: {
              ...commonOptions.plugins.tooltip,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
                }
              }
            }          }
        }
      });
      
      // Store chart for cleanup
      window.chartInstances.push(chart3);

      // 4. Invoice Volume Chart (Bar Chart)
      const volumeData = months.map(month => monthlyVolume[month]?.total || 0);
        const ctx4 = document.getElementById('invoice-volume-chart').getContext('2d');
      const chart4 = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: months.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short' });
          }),
          datasets: [{
            label: 'Invoices Created',
            data: volumeData,
            backgroundColor: months.map((_, index) => {
              const opacity = 0.6 + (index * 0.4 / months.length);
              return `rgba(140, 36, 28, ${opacity})`;
            }),
            borderColor: '#8c241c',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#666' }
            },            y: {
              beginAtZero: true,
              grid: { color: '#f0f0f0', drawBorder: false },
              ticks: { 
                font: { size: 10 }, 
                color: '#666',
                stepSize: 1
              }
            }
          }
        }
      });
      
      // Store chart for cleanup
      window.chartInstances.push(chart4);

      // 5. Average Invoice Value Chart (Area Chart)
      const avgValues = months.map(month => {
        const total = monthlyData[month]?.total || 0;
        const count = monthlyVolume[month]?.total || 0;
        return count > 0 ? total / count : 0;
      });
        const ctx5 = document.getElementById('avg-invoice-chart').getContext('2d');
      const chart5 = new Chart(ctx5, {
        type: 'line',
        data: {
          labels: months.map(month => {
            const [year, monthNum] = month.split('-');
            const date = new Date(year, monthNum - 1);
            return date.toLocaleDateString('en-US', { month: 'short' });
          }),
          datasets: [{
            label: 'Average Invoice Value',
            data: avgValues,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3498db',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#666' }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#f0f0f0', drawBorder: false },
              ticks: { 
                font: { size: 10 }, 
                color: '#666',
                callback: function(value) {
                  return '$' + value.toFixed(0);
                }
              }
            }
          },
          plugins: {
            ...commonOptions.plugins,
            tooltip: {
              ...commonOptions.plugins.tooltip,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                }
              }
            }          }
        }
      });
      
      // Store chart for cleanup
      window.chartInstances.push(chart5);
    });
};

// Usage: Call window.renderFinancialCharts(someContainerElement) after rendering widgets.
// Requires Chart.js to be loaded in your HTML.