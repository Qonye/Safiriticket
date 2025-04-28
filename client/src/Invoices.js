import React, { useEffect, useState } from 'react';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [form, setForm] = useState({
    client: '',
    quotation: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    total: 0,
    status: 'Unpaid',
    dueDate: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetch('http://localhost:5000/api/clients')
      .then(res => res.json())
      .then(data => setClients(data));
    fetch('http://localhost:5000/api/quotations')
      .then(res => res.json())
      .then(data => setQuotations(data));
  }, []);

  function fetchInvoices() {
    fetch('http://localhost:5000/api/invoices')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(() => setInvoices([]));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleItemChange(idx, e) {
    const items = form.items.map((item, i) =>
      i === idx ? { ...item, [e.target.name]: e.target.value } : item
    );
    setForm({ ...form, items });
  }

  function handleAddItem() {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, price: 0 }] });
  }

  function handleRemoveItem(idx) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  }

  function calculateTotal(items) {
    return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const total = calculateTotal(form.items);
    const payload = { ...form, total, dueDate: form.dueDate || undefined };
    if (editingId) {
      fetch(`http://localhost:5000/api/invoices/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        setEditingId(null);
        setForm({
          client: '',
          quotation: '',
          items: [{ description: '', quantity: 1, price: 0 }],
          total: 0,
          status: 'Unpaid',
          dueDate: ''
        });
        fetchInvoices();
      });
    } else {
      fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        setForm({
          client: '',
          quotation: '',
          items: [{ description: '', quantity: 1, price: 0 }],
          total: 0,
          status: 'Unpaid',
          dueDate: ''
        });
        fetchInvoices();
      });
    }
  }

  function handleEdit(invoice) {
    setEditingId(invoice._id);
    setForm({
      client: invoice.client?._id || invoice.client,
      quotation: invoice.quotation?._id || invoice.quotation,
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      total: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate ? invoice.dueDate.substring(0, 10) : ''
    });
  }

  function handleDelete(id) {
    if (window.confirm('Delete this invoice?')) {
      fetch(`http://localhost:5000/api/invoices/${id}`, { method: 'DELETE' })
        .then(() => fetchInvoices());
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm({
      client: '',
      quotation: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      total: 0,
      status: 'Unpaid',
      dueDate: ''
    });
  }

  return (
    <div className="entity-container">
      <h2 className="entity-title">Invoices</h2>
      <form className="entity-form" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <select name="client" value={form.client} onChange={handleChange} required>
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client._id} value={client._id}>{client.name}</option>
          ))}
        </select>
        <select name="quotation" value={form.quotation} onChange={handleChange}>
          <option value="">Select Quotation (optional)</option>
          {quotations.map(q => (
            <option key={q._id} value={q._id}>{q._id}</option>
          ))}
        </select>
        {form.items.map((item, idx) => (
          <div key={idx} className="invoice-item-row">
            <input
              name="description"
              placeholder="Description"
              value={item.description}
              onChange={e => handleItemChange(idx, e)}
              required
            />
            <input
              name="quantity"
              type="number"
              min="1"
              placeholder="Qty"
              value={item.quantity}
              onChange={e => handleItemChange(idx, e)}
              style={{ width: 60 }}
              required
            />
            <input
              name="price"
              type="number"
              min="0"
              placeholder="Price"
              value={item.price}
              onChange={e => handleItemChange(idx, e)}
              style={{ width: 80 }}
              required
            />
            <button type="button" className="secondary-btn" onClick={() => handleRemoveItem(idx)} disabled={form.items.length === 1}>Remove</button>
          </div>
        ))}
        <button type="button" className="secondary-btn" onClick={handleAddItem}>Add Item</button>
        <input
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
          required
        />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <button type="submit" className="primary-btn">{editingId ? 'Update' : 'Add'} Invoice</button>
        {editingId && <button type="button" className="secondary-btn" onClick={handleCancel}>Cancel</button>}
      </form>
      <ul className="entity-list">
        {invoices.map(inv => (
          <li key={inv._id} className="entity-list-item">
            <span>
              <strong>{inv.client?.name || inv.client}</strong> | {inv.items.length} items | Total: {inv.total} | Status: {inv.status}
            </span>
            <span>
              <button onClick={() => handleEdit(inv)} className="edit-btn">Edit</button>
              <button onClick={() => handleDelete(inv._id)} className="delete-btn">Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Invoices;
