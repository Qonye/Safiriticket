import React, { useEffect, useState } from 'react';
import QuotationPreview from './QuotationPreview';

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    status: 'Pending',
    expiresAt: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchQuotations();
    fetch('http://localhost:5000/api/clients')
      .then(res => res.json())
      .then(data => setClients(data));
  }, []);

  function fetchQuotations() {
    fetch('http://localhost:5000/api/quotations')
      .then(res => res.json())
      .then(data => setQuotations(data))
      .catch(() => setQuotations([]));
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
    const payload = { ...form, total, expiresAt: form.expiresAt || undefined };
    if (editingId) {
      fetch(`http://localhost:5000/api/quotations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        setEditingId(null);
        setForm({
          client: '',
          items: [{ description: '', quantity: 1, price: 0 }],
          status: 'Pending',
          expiresAt: ''
        });
        fetchQuotations();
      });
    } else {
      fetch('http://localhost:5000/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        setForm({
          client: '',
          items: [{ description: '', quantity: 1, price: 0 }],
          status: 'Pending',
          expiresAt: ''
        });
        fetchQuotations();
      });
    }
  }

  function handleEdit(quotation) {
    setEditingId(quotation._id);
    setForm({
      client: quotation.client?._id || quotation.client,
      items: quotation.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price
      })),
      status: quotation.status,
      expiresAt: quotation.expiresAt ? quotation.expiresAt.substring(0, 10) : ''
    });
  }

  const handleDelete = id => {
    if (window.confirm('Delete this quotation?')) {
      fetch(`http://localhost:5000/api/quotations/${id}`, { method: 'DELETE' })
        .then(() => fetchQuotations());
    }
  };

  const handlePreview = () => setShowPreview(true);
  const handleClosePreview = () => setShowPreview(false);

  function handleCancel() {
    setEditingId(null);
    setForm({
      client: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      status: 'Pending',
      expiresAt: ''
    });
  }

  return (
    <div className="container my-4">
      <h2>Quotations</h2>
      <div className="entity-container">
        <h5 className="entity-title">{editingId ? 'Edit Quotation' : 'Create Quotation'}</h5>
        <form className="entity-form" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
            <select
              name="client"
              value={form.client}
              onChange={handleChange}
              className="form-select"
              required
              style={{ minWidth: 180 }}
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
            <input
              name="expiresAt"
              type="date"
              value={form.expiresAt}
              onChange={handleChange}
              className="form-control"
              required
              style={{ minWidth: 150 }}
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-select"
              style={{ minWidth: 120 }}
            >
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div className="mb-3" style={{ width: '100%' }}>
            <label className="form-label">Items</label>
            {form.items.map((item, idx) => (
              <div className="quotation-item-row" key={idx}>
                <input
                  name="description"
                  placeholder="Description"
                  value={item.description}
                  onChange={e => handleItemChange(idx, e)}
                  className="form-control"
                  required
                  style={{ flex: 2 }}
                />
                <input
                  name="quantity"
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, e)}
                  className="form-control"
                  required
                  style={{ width: 80 }}
                />
                <input
                  name="price"
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={e => handleItemChange(idx, e)}
                  className="form-control"
                  required
                  style={{ width: 100 }}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={form.items.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="secondary-btn mt-1" onClick={handleAddItem}>
              Add Item
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" className="primary-btn">
              {editingId ? 'Update' : 'Add'} Quotation
            </button>
            <button type="button" className="secondary-btn" onClick={handlePreview}>
              Preview
            </button>
            {editingId && (
              <button type="button" className="btn btn-link" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {showPreview && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: 'rgba(0,0,0,0.25)' }}
          onClick={handleClosePreview}
        >
          <div
            className="modal-dialog"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Quotation Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  style={{ filter: 'invert(40%) sepia(100%) saturate(500%) hue-rotate(340deg)' }} // red X
                  onClick={handleClosePreview}
                ></button>
              </div>
              <div className="modal-body">
                <QuotationPreview
                  data={{ ...form, total: calculateTotal(form.items) }}
                  client={clients.find(c => c._id === form.client)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <h5 className="mt-4">All Quotations</h5>
      <div className="table-responsive">
        <table className="table table-striped table-bordered align-middle shadow-sm" style={{ minWidth: 800, marginTop: 24 }}>
          <thead className="table-primary">
            <tr>
              <th style={{ padding: '16px 12px' }}>Client</th>
              <th style={{ padding: '16px 12px' }}>Status</th>
              <th style={{ padding: '16px 12px' }}>Expires At</th>
              <th style={{ padding: '16px 12px' }}>Total</th>
              <th style={{ minWidth: 220, padding: '16px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q._id}>
                <td style={{ padding: '14px 12px', verticalAlign: 'middle' }}><strong>{q.client?.name || q.client}</strong></td>
                <td style={{ padding: '14px 12px', verticalAlign: 'middle' }}>
                  <span className={
                    q.status === 'Pending' ? 'badge bg-warning text-dark' :
                    q.status === 'Accepted' ? 'badge bg-success' :
                    q.status === 'Declined' ? 'badge bg-danger' :
                    q.status === 'Expired' ? 'badge bg-secondary' : 'badge bg-light text-dark'
                  }>
                    {q.status}
                  </span>
                </td>
                <td style={{ padding: '14px 12px', verticalAlign: 'middle' }}>{q.expiresAt ? q.expiresAt.substring(0, 10) : ''}</td>
                <td style={{ padding: '14px 12px', verticalAlign: 'middle' }}><span className="text-success">₹{q.total}</span></td>
                <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                  <div className="btn-group" role="group" aria-label="Actions">
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#0d6efd', color: '#fff', minWidth: 70, marginRight: 6 }}
                      title="Edit"
                      onClick={() => handleEdit(q)}
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#dc3545', color: '#fff', minWidth: 80, marginRight: 6 }}
                      title="Delete"
                      onClick={() => handleDelete(q._id)}
                    >
                      <i className="bi bi-trash"></i> Delete
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#6c757d', color: '#fff', minWidth: 90 }}
                      title="Preview"
                      onClick={() => {
                        setForm({
                          client: q.client?._id || q.client,
                          items: q.items,
                          status: q.status,
                          expiresAt: q.expiresAt ? q.expiresAt.substring(0, 10) : ''
                        });
                        setShowPreview(true);
                      }}
                    >
                      <i className="bi bi-eye"></i> Preview
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Quotations;
