import React, { useEffect, useState } from 'react';
import './App.css';
import Clients from './Clients';
import Quotations from './Quotations';
import Invoices from './Invoices';
import Financials from './Financials';

function App() {
  const [message, setMessage] = useState('');
  const [counts, setCounts] = useState({ clients: 0, quotations: 0, invoices: 0 });
  const [activeSection, setActiveSection] = useState('overview');
  const [financials, setFinancials] = useState({
    paid: 0,
    unpaid: 0,
    overdue: 0,
    revenue: 0
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setMessage(data.status))
      .catch(() => setMessage('Backend not reachable'));
    // Fetch counts for dashboard widgets
    Promise.all([
      fetch('http://localhost:5000/api/clients').then(res => res.json()),
      fetch('http://localhost:5000/api/quotations').then(res => res.json()),
      fetch('http://localhost:5000/api/invoices').then(res => res.json())
    ]).then(([clients, quotations, invoices]) => {
      setCounts({
        clients: clients.length,
        quotations: quotations.length,
        invoices: invoices.length
      });
    });

    fetch('http://localhost:5000/api/invoices')
      .then(res => res.json())
      .then(invoices => {
        const paid = invoices.filter(i => i.status === 'Paid');
        const unpaid = invoices.filter(i => i.status === 'Unpaid');
        const overdue = invoices.filter(i => i.status === 'Overdue');
        setFinancials({
          paid: paid.length,
          unpaid: unpaid.length,
          overdue: overdue.length,
          revenue: paid.reduce((sum, i) => sum + (i.total || 0), 0)
        });
      });
  }, []);

  const showSection = (section) => setActiveSection(section);

  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <h2>Admin</h2>
        <nav>
          <ul>
            <li><button onClick={() => showSection('overview')}>Overview</button></li>
            <li><button onClick={() => showSection('clients')}>Clients</button></li>
            <li><button onClick={() => showSection('quotations')}>Quotations</button></li>
            <li><button onClick={() => showSection('invoices')}>Invoices</button></li>
            <li><button onClick={() => showSection('financials')}>Financials</button></li>
          </ul>
        </nav>
        <div className="sidebar-status">
          <span className={message === 'OK' ? 'status-ok' : 'status-bad'}>
            ●
          </span>
          Backend: {message}
        </div>
      </aside>
      <main className="main-content">
        {activeSection === 'overview' && (
          <section id="overview" className="dashboard-overview">
            <h1>Dashboard Overview</h1>
            <div className="widgets-row">
              <div className="widget" onClick={() => showSection('clients')}>
                <div className="widget-title">Clients</div>
                <div className="widget-count">{counts.clients}</div>
              </div>
              <div className="widget" onClick={() => showSection('quotations')}>
                <div className="widget-title">Quotations</div>
                <div className="widget-count">{counts.quotations}</div>
              </div>
              <div className="widget" onClick={() => showSection('invoices')}>
                <div className="widget-title">Invoices</div>
                <div className="widget-count">{counts.invoices}</div>
              </div>
              <div className="widget" onClick={() => showSection('financials')}>
                <div className="widget-title">Financials</div>
                <div className="widget-count">
                  <span title="Revenue">₹{financials.revenue}</span>
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: 8 }}>
                  Paid: {financials.paid} | Unpaid: {financials.unpaid} | Overdue: {financials.overdue}
                </div>
              </div>
            </div>
          </section>
        )}
        {activeSection === 'clients' && (
          <section id="clients" className="dashboard-section">
            <Clients />
          </section>
        )}
        {activeSection === 'quotations' && (
          <section id="quotations" className="dashboard-section">
            <Quotations />
          </section>
        )}
        {activeSection === 'invoices' && (
          <section id="invoices" className="dashboard-section">
            <Invoices />
          </section>
        )}
        {activeSection === 'financials' && (
          <section id="financials" className="dashboard-section">
            <Financials />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
