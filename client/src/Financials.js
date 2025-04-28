import React, { useEffect, useState } from 'react';

function Financials() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    paid: 0,
    unpaid: 0,
    overdue: 0,
    revenue: 0,
    total: 0
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        const paid = data.filter(i => i.status === 'Paid');
        const unpaid = data.filter(i => i.status === 'Unpaid');
        const overdue = data.filter(i => i.status === 'Overdue');
        setSummary({
          paid: paid.length,
          unpaid: unpaid.length,
          overdue: overdue.length,
          revenue: paid.reduce((sum, i) => sum + (i.total || 0), 0),
          total: data.reduce((sum, i) => sum + (i.total || 0), 0)
        });
      });
  }, []);

  return (
    <div className="entity-container">
      <h2 className="entity-title">Financial Tracker</h2>
      <div style={{ marginBottom: 24 }}>
        <strong>Total Revenue (Paid):</strong> ₹{summary.revenue} <br />
        <strong>Total Invoices:</strong> {invoices.length} <br />
        <strong>Paid:</strong> {summary.paid} | <strong>Unpaid:</strong> {summary.unpaid} | <strong>Overdue:</strong> {summary.overdue}
      </div>
      <table className="financial-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Status</th>
            <th>Total</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv._id}>
              <td>{inv._id.slice(-6).toUpperCase()}</td>
              <td>{inv.client?.name || inv.client}</td>
              <td>{inv.status}</td>
              <td>₹{inv.total}</td>
              <td>{inv.dueDate ? inv.dueDate.substring(0, 10) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Financials;
