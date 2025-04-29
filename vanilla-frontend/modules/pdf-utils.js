// Utility to fetch and use HTML templates for PDF generation and create PDF in the browser

window.loadTemplate = async function(templateName) {
  const res = await fetch(`templates/${templateName}.html`);
  if (!res.ok) throw new Error(`Template not found: ${templateName}`);
  return await res.text();
};

// Simple HTML to PDF using html2pdf.js (must be included in index.html)
// https://github.com/eKoopmans/html2pdf.js
window.generatePDF = async function(html, options = {}) {
  // html2pdf must be loaded globally
  return html2pdf().from(html).set(options).outputPdf('blob');
};

window.previewPDF = async function(html, options = {}) {
  // Open PDF in a new tab
  html2pdf().from(html).set({
    margin: [0, 0, 0, 0],
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2, useCORS: true }, // ensure useCORS is set
    ...options
  }).outputPdf('bloburl').then(url => {
    window.open(url, '_blank');
  });
};

window.downloadPDF = async function(html, filename = 'document.pdf', options = {}) {
  html2pdf().from(html).set({
    margin: [0, 0, 0, 0],
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2, useCORS: true }, // ensure useCORS is set
    filename,
    ...options
  }).save();
};

// Helper to fill org details in a template (used by both quotations and invoices)
window.fillOrgDetails = function(html) {
  const org = window.currentOrgSettings || {};
  html = html.replace(/{{orgName}}/g, org.name || '');
  html = html.replace(/{{orgAddresses}}/g, (org.addresses || []).join(' | '));
  html = html.replace(/{{orgEmails}}/g, (org.emails || []).join(' | '));
  html = html.replace(/{{orgPhones}}/g, (org.phones || []).join(' | '));
  html = html.replace(/{{orgVat}}/g, org.vat || '');
  html = html.replace(/{{orgWebsite}}/g, org.website || '');
  html = html.replace(/{{logoUrl}}/g, org.logoUrl || 'https://res.cloudinary.com/dvmtxm1qe/image/upload/v1745862400/Safiri_Tickets_Primary_Logo_tg0i0k.png');
  return html;
};

// Helper to fill template placeholders for quotations
window.fillQuotationTemplate = function(template, quotation) {
  let html = template;
  html = html.replace(/{{number}}/g, quotation.number || '');
  html = html.replace(/{{clientName}}/g, quotation.client?.name || '');
  html = html.replace(/{{clientEmail}}/g, quotation.client?.email || '');
  html = html.replace(/{{status}}/g, quotation.status || '');
  html = html.replace(/{{expiresAt}}/g, quotation.expiresAt ? new Date(quotation.expiresAt).toLocaleDateString() : '');
  html = html.replace(/{{total}}/g, quotation.total || '');
  // Items (use $ for currency)
  const itemsHtml = (quotation.items || []).map(item =>
    `<tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>$${item.price || ''}</td>
      <td>$${item.quantity && item.price ? Number(item.quantity) * Number(item.price) : ''}</td>
    </tr>`
  ).join('');
  html = html.replace(/{{items}}/g, itemsHtml);
  // Fill org details and logo
  html = window.fillOrgDetails(html);
  return html;
};

// Helper to fill template placeholders for invoices
window.fillInvoiceTemplate = function(template, invoice) {
  let html = template;
  html = html.replace(/{{number}}/g, invoice.number || '');
  html = html.replace(/{{clientName}}/g, invoice.client?.name || '');
  html = html.replace(/{{clientEmail}}/g, invoice.client?.email || '');
  html = html.replace(/{{status}}/g, invoice.status || '');
  html = html.replace(/{{dueDate}}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '');
  html = html.replace(/{{paidAmount}}/g, invoice.paidAmount || 0);
  html = html.replace(/{{amountDue}}/g, Math.max((invoice.total || 0) - (invoice.paidAmount || 0), 0));
  html = html.replace(/{{total}}/g, invoice.total || '');
  // Items
  const itemsHtml = (invoice.items || []).map(item =>
    `<tr>
      <td>${item.description || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>$${item.price || ''}</td>
      <td>$${item.quantity && item.price ? Number(item.quantity) * Number(item.price) : ''}</td>
    </tr>`
  ).join('');
  html = html.replace(/{{items}}/g, itemsHtml);
  // Fill org details and logo
  html = window.fillOrgDetails(html);
  return html;
};

// Example usage in your frontend modules:
// const html = await loadTemplate('quotation'); // loads quotation.html
// const html = await loadTemplate('invoice');   // loads invoice.html
