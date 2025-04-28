import React, { useEffect, useState } from 'react';

function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', address: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  function fetchClients() {
    fetch('http://localhost:5000/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(() => setClients([]));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      fetch(`http://localhost:5000/api/clients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }).then(() => {
        setEditingId(null);
        setForm({ name: '', email: '', company: '', phone: '', address: '' });
        fetchClients();
      });
    } else {
      fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }).then(() => {
        setForm({ name: '', email: '', company: '', phone: '', address: '' });
        fetchClients();
      });
    }
  }

  function handleEdit(client) {
    setEditingId(client._id);
    setForm({
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
      address: client.address || ''
    });
  }

  function handleDelete(id) {
    if (window.confirm('Delete this client?')) {
      fetch(`http://localhost:5000/api/clients/${id}`, { method: 'DELETE' })
        .then(() => fetchClients());
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm({ name: '', email: '', company: '', phone: '', address: '' });
  }

  return (
    <div className="entity-container">
      <h2 className="entity-title">Clients</h2>
      <form className="entity-form" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="company" placeholder="Company" value={form.company} onChange={handleChange} />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
        <button type="submit" className="primary-btn">{editingId ? 'Update' : 'Add'} Client</button>
        {editingId && <button type="button" className="secondary-btn" onClick={handleCancel}>Cancel</button>}
      </form>
      <ul className="entity-list">
        {clients.map(client => (
          <li key={client._id} className="entity-list-item">
            <span>
              <strong>{client.name}</strong> ({client.email})
            </span>
            <span>
              <button onClick={() => handleEdit(client)} className="edit-btn">Edit</button>
              <button onClick={() => handleDelete(client._id)} className="delete-btn">Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Clients;
