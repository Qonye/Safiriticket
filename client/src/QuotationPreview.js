import React from 'react';
import jsPDF from 'jspdf';

function QuotationPreview({ data, client }) {
  if (!data) return null;

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Quotation', 14, 18);
    doc.setFontSize(12);
    doc.text(`Client: ${client?.name || ''} (${client?.email || ''})`, 14, 28);
    let y = 38;
    data.items.forEach(item => {
      doc.text(`${item.description}: ${item.quantity} x ₹${item.price}`, 14, y);
      y += 10;
    });
    doc.text(`Total: ₹{data.total}`, 14, y + 5);
    doc.text(`Status: ${data.status}`, 14, y + 15);
    doc.text(`Expires At: ${data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : ''}`, 14, y + 25);
    doc.save('quotation-preview.pdf');
  };

  return (
    <div className="card shadow-sm border-0 mb-3" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0">Quotation</h4>
      </div>
      <div className="card-body">
        {/* Quotation Details Section */}
        <div className="row mb-3">
          <div className="col-6">
            <div><strong>Quotation #:</strong> {data._id ? data._id.slice(-6).toUpperCase() : 'Draft'}</div>
            <div><strong>Date:</strong> {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div><strong>Status:</strong> {data.status}</div>
            <div><strong>Expires At:</strong> {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : ''}</div>
          </div>
          <div className="col-6 text-end">
            <div><strong>Client:</strong></div>
            <div>{client?.name}</div>
            <div>{client?.email}</div>
            {client?.company && <div>{client.company}</div>}
            {client?.address && <div>{client.address}</div>}
          </div>
        </div>
        {/* Items Table */}
        <table className="table table-sm table-bordered mb-3">
          <thead className="table-light">
            <tr>
              <th>Description</th>
              <th style={{ width: 60 }}>Qty</th>
              <th style={{ width: 90 }}>Price</th>
              <th style={{ width: 90 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>₹{item.price}</td>
                <td>₹{Number(item.quantity) * Number(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-end mb-2">
          <h5>Total: <span className="text-success">₹{data.total}</span></h5>
        </div>
        <button className="primary-btn" onClick={handleDownload}>Download PDF</button>
      </div>
    </div>
  );
}

export default QuotationPreview;
