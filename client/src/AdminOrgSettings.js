import React, { useEffect, useState } from 'react';

function AdminOrgSettings() {
  const [form, setForm] = useState({
    name: '',
    addresses: [''],
    emails: [''],
    phones: [''],
    vat: '',
    website: '',
    logoUrl: ''
  });
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load org settings from backend and localStorage on mount
  useEffect(() => {
    const local = localStorage.getItem('orgSettings');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setForm({
          ...parsed,
          addresses: parsed.addresses && parsed.addresses.length ? parsed.addresses : [''],
          emails: parsed.emails && parsed.emails.length ? parsed.emails : [''],
          phones: parsed.phones && parsed.phones.length ? parsed.phones : ['']
        });
        setShowPreview(!!parsed && !!parsed.name);
      } catch {}
    }
    fetch('http://localhost:5000/api/orgsettings')
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setForm({
            ...data,
            addresses: data.addresses && data.addresses.length ? data.addresses : [''],
            emails: data.emails && data.emails.length ? data.emails : [''],
            phones: data.phones && data.phones.length ? data.phones : ['']
          });
          setShowPreview(true);
          localStorage.setItem('orgSettings', JSON.stringify(data));
        }
      });
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleArrayChange(field, idx, value) {
    const arr = [...form[field]];
    arr[idx] = value;
    setForm({ ...form, [field]: arr });
  }

  function handleAddField(field) {
    setForm({ ...form, [field]: [...form[field], ''] });
  }

  function handleRemoveField(field, idx) {
    const arr = form[field].filter((_, i) => i !== idx);
    setForm({ ...form, [field]: arr.length ? arr : [''] });
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch('http://localhost:5000/api/orgsettings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(() => {
      setSaved(true);
      setShowPreview(true);
      localStorage.setItem('orgSettings', JSON.stringify(form));
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleEdit() {
    setShowPreview(false);
  }

  return (
    <div className="entity-container" style={{ maxWidth: 600 }}>
      <h3 className="entity-title">Organization Settings</h3>
      {!showPreview ? (
        <form className="entity-form" onSubmit={handleSubmit}>
          <input name="name" placeholder="Company Name" value={form.name} onChange={handleChange} required />

          <label style={{ width: '100%', marginTop: 10 }}>Addresses</label>
          {form.addresses.map((address, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                value={address}
                onChange={e => handleArrayChange('addresses', idx, e.target.value)}
                placeholder="Address"
                style={{ flex: 1 }}
                required
              />
              <button type="button" className="secondary-btn" onClick={() => handleRemoveField('addresses', idx)} disabled={form.addresses.length === 1}>-</button>
              {idx === form.addresses.length - 1 && (
                <button type="button" className="secondary-btn" onClick={() => handleAddField('addresses')}>+</button>
              )}
            </div>
          ))}

          <label style={{ width: '100%', marginTop: 10 }}>Emails</label>
          {form.emails.map((email, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                value={email}
                onChange={e => handleArrayChange('emails', idx, e.target.value)}
                placeholder="Email"
                style={{ flex: 1 }}
                required
              />
              <button type="button" className="secondary-btn" onClick={() => handleRemoveField('emails', idx)} disabled={form.emails.length === 1}>-</button>
              {idx === form.emails.length - 1 && (
                <button type="button" className="secondary-btn" onClick={() => handleAddField('emails')}>+</button>
              )}
            </div>
          ))}

          <label style={{ width: '100%', marginTop: 10 }}>Phones</label>
          {form.phones.map((phone, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                value={phone}
                onChange={e => handleArrayChange('phones', idx, e.target.value)}
                placeholder="Phone"
                style={{ flex: 1 }}
                required
              />
              <button type="button" className="secondary-btn" onClick={() => handleRemoveField('phones', idx)} disabled={form.phones.length === 1}>-</button>
              {idx === form.phones.length - 1 && (
                <button type="button" className="secondary-btn" onClick={() => handleAddField('phones')}>+</button>
              )}
            </div>
          ))}

          <input name="vat" placeholder="VAT No." value={form.vat} onChange={handleChange} />
          <input name="website" placeholder="Website" value={form.website} onChange={handleChange} />
          <input name="logoUrl" placeholder="Logo URL" value={form.logoUrl} onChange={handleChange} />
          <button type="submit" className="primary-btn">Save</button>
          {saved && <span style={{ color: 'green', marginLeft: 12 }}>Saved!</span>}
        </form>
      ) : (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>{form.name}</h4>
          {form.logoUrl && (
            <div style={{ marginBottom: 12 }}>
              <img src={form.logoUrl} alt="Logo Preview" style={{ maxHeight: 60 }} />
            </div>
          )}
          <div>
            <strong>Addresses:</strong>
            <ul>
              {form.addresses.map((address, idx) => (
                <li key={idx}>{address}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Emails:</strong>
            <ul>
              {form.emails.map((email, idx) => (
                <li key={idx}>{email}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Phones:</strong>
            <ul>
              {form.phones.map((phone, idx) => (
                <li key={idx}>{phone}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>VAT No:</strong> {form.vat}
          </div>
          <div>
            <strong>Website:</strong> {form.website}
          </div>
          <button className="primary-btn" style={{ marginTop: 18 }} onClick={handleEdit}>
            Edit Org Settings
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminOrgSettings;
