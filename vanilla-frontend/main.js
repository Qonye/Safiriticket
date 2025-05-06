// Remove ES module imports, use global functions instead

document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main-content');
  const status = document.getElementById('sidebar-status');
  const buttons = document.querySelectorAll('.sidebar nav ul li button');

  // Add Services link to sidebar if not present
  const sidebarNav = document.querySelector('.sidebar nav ul');
  if (!sidebarNav.querySelector('[data-section="services"]')) {
    const li = document.createElement('li');
    li.innerHTML = `<button data-section="services">Services</button>`;
    sidebarNav.appendChild(li);
  }

  function setActive(section) {
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
    // Also handle dynamically added Services button
    const servicesBtn = document.querySelector('.sidebar nav ul button[data-section="services"]');
    if (servicesBtn) servicesBtn.classList.toggle('active', section === 'services');
  }

  function showOverview() {
    main.innerHTML = `
      <h1>Dashboard Overview</h1>
      <div class="widget-row" id="widget-row"></div>
      <div id="dashboard-charts-area"></div>
    `;
    // Fetch all data in parallel and then render widgets
    Promise.all([
      fetch(window.API_BASE_URL + '/api/clients').then(r => r.json()),
      fetch(window.API_BASE_URL + '/api/quotations').then(r => r.json()),
      fetch(window.API_BASE_URL + '/api/invoices').then(r => r.json())
    ]).then(([clients, quotations, invoices]) => {
      const widgetRow = document.getElementById('widget-row');
      widgetRow.innerHTML = `
        <div class="widget" id="widget-clients">
          <div class="widget-title">Clients</div>
          <div class="widget-count">${clients.length}</div>
        </div>
        <div class="widget" id="widget-quotations">
          <div class="widget-title">Quotations</div>
          <div class="widget-count">${quotations.length}</div>
        </div>
        <div class="widget" id="widget-invoices">
          <div class="widget-title">Invoices</div>
          <div class="widget-count">${invoices.length}</div>
        </div>
      `;
      document.getElementById('widget-clients').onclick = () => showSection('clients');
      document.getElementById('widget-quotations').onclick = () => showSection('quotations');
      document.getElementById('widget-invoices').onclick = () => showSection('invoices');
      // Render financial charts below widgets
      if (window.renderFinancialCharts) {
        window.renderFinancialCharts(document.getElementById('dashboard-charts-area'));
      }
    });
  }

  function showSection(section) {
    setActive(section);
    if (section === 'overview') showOverview();
    else if (section === 'quotations' && typeof window.renderQuotations === 'function') window.renderQuotations(main);
    else if (section === 'invoices' && typeof window.renderInvoices === 'function') window.renderInvoices(main);
    else if (section === 'financials' && typeof window.renderFinancials === 'function') window.renderFinancials(main);
    else if (section === 'orgsettings' && typeof window.renderOrgSettings === 'function') window.renderOrgSettings(main);
    else if (section === 'clients' && typeof window.renderClients === 'function') window.renderClients(main);
    else if (section === 'products' && typeof window.renderProducts === 'function') window.renderProducts(main);
    else if (section === 'services' && typeof window.renderServices === 'function') window.renderServices(main);
    else main.innerHTML = `<h2>${section.charAt(0).toUpperCase() + section.slice(1)}</h2><p>Section coming soon...</p>`;
  }

  // Sidebar navigation
  document.querySelectorAll('.sidebar nav ul li button').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  // Health check
  fetch(window.API_BASE_URL + '/api/health', { mode: 'cors' })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      status.innerHTML = `<span style="color:${data.status === 'OK' ? '#2ecc40' : '#e45424'};font-weight:bold;">●</span> Backend: ${data.status}`;
      if (data.status === 'OK') {
        showSection('overview');
      } else {
        main.innerHTML = `<div style="color:#e45424;font-size:1.2em;text-align:center;margin-top:40px;">Backend not reachable</div>`;
      }
    })
    .catch((err) => {
      status.innerHTML = `<span style="color:#e45424;font-weight:bold;">●</span> Backend: Not reachable`;
      main.innerHTML = `<div style="color:#e45424;font-size:1.2em;text-align:center;margin-top:40px;">Backend not reachable<br>${err.message}</div>`;
      // Debug info
      console.error('Failed to fetch backend:', err);
    });

  // Remove this line to avoid double call:
  // showSection('overview');
});
