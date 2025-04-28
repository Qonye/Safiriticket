import React, { useState, useEffect } from 'react';

function QuotationPreview({ data, client }) {
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!data || !client) return;
    const fetchPdf = async () => {
      const response = await fetch('http://localhost:5000/api/preview/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          items: data.items,
          total: data.total,
          status: data.status,
          expiresAt: data.expiresAt
        })
      });
      const blob = await response.blob();
      setPdfUrl(window.URL.createObjectURL(blob));
    };
    fetchPdf();
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line
  }, [data, client]);

  const handleDownload = async () => {
    const response = await fetch('http://localhost:5000/api/preview/quotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client,
        items: data.items,
        total: data.total,
        status: data.status,
        expiresAt: data.expiresAt
      })
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotation-preview.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!data) return null;

  return (
    <div style={{ maxWidth: '100vw', margin: 0, background: '#f8f9fa', padding: 0, minHeight: '100vh' }}>
      {pdfUrl ? (
        <>
          <iframe
            src={pdfUrl}
            title="Quotation Preview"
            width="100%"
            height={window.innerHeight - 120}
            style={{
              border: 'none',
              background: '#fff',
              display: 'block',
              minHeight: 'calc(100vh - 120px)',
              maxHeight: 'calc(100vh - 120px)',
              margin: 0
            }}
          />
          <div style={{ textAlign: 'center', marginTop: 0, position: 'fixed', bottom: 24, left: 0, width: '100%' }}>
            <button className="primary-btn" onClick={handleDownload}>
              Download PDF
            </button>
          </div>
        </>
      ) : (
        <div>Loading preview...</div>
      )}
    </div>
  );
}

export default QuotationPreview;
