import React from 'react';
import jsPDF from 'jspdf';

function InvoicePreview({ data, client }) {
  if (!data) return null;

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Invoice', 14, 18);
    doc.setFontSize(12);
    doc.text(`Client: ${client?.name || ''} (${client?.email || ''})`, 14, 28);
    let y = 38;
    data.items.forEach(item => {
      doc.text(`${item.description}: ${item.quantity} x ₹${item.price}`, 14, y);
      y += 10;
    });
    doc.text(`Total: ₹${data.total}`, 14, y + 5);
    doc.text(`Status: ${data.status}`, 14, y + 15);
    doc.text(`Due Date: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : ''}`, 14, y + 25);
    doc.save('invoice-preview.pdf');
  };

  return (
    <div className="preview-container">
      <h2>Invoice Preview</h2>
      <p>
        <strong>Client:</strong> {client?.name} ({client?.email})
      </p>
      <ul>
        {data.items.map((item, idx) => (
          <li key={idx}>
            {item.description}: {item.quantity} x ₹{item.price}
          </li>
        ))}
      </ul>
      <p>
        <strong>Total:</strong> ₹{data.total}
      </p>
      <p>
        <strong>Status:</strong> {data.status}
      </p>
      <p>
        <strong>Due Date:</strong> {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : ''}
      </p>
      <button className="primary-btn" onClick={handleDownload}>Download PDF</button>
    </div>
  );
}

export default InvoicePreview;
