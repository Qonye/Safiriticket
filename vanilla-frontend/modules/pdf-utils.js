console.log('[pdf-utils.js] Script start parsing.');

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
  // Ensure all images are loaded before generating PDF
  const tempDiv = document.createElement('div');
  // Position off-screen instead of display:none
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '800px'; // Give it a defined width, similar to A4 paper width for rendering
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  // Removed logo src replacement logic
  // Removed waiting for all images to load (Promise.all block)

  // Use safe margins to avoid truncation
  // Pass tempDiv.innerHTML instead of tempDiv
  html2pdf().from(tempDiv.innerHTML).set({
    margin: [10, 10, 10, 10], // 10mm on all sides
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2, useCORS: true },
    ...options
  }).outputPdf('bloburl').then(url => {
    window.open(url, '_blank');
    tempDiv.remove();
  });
};

window.downloadPDF = async function(html, filename = 'document.pdf', options = {}) {
  // Ensure all images are loaded before generating PDF
  const tempDiv = document.createElement('div');
  // Position off-screen instead of display:none
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '800px'; // Give it a defined width
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  // Removed logo src replacement logic
  // Removed waiting for all images to load (Promise.all block)

  // Pass tempDiv.innerHTML instead of tempDiv
  html2pdf().from(tempDiv.innerHTML).set({
    margin: [10, 10, 10, 10],
    jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { scale: 2, useCORS: true },
    filename,
    ...options
  }).save().then(() => tempDiv.remove());
};

/*
// window.fillInvoiceTemplate and window.renderInvoiceServiceTables
// have been moved to new-pdf-engine.js to consolidate logic.
// Keeping them here might lead to conflicts if this script is still loaded
// and the browser picks up these older versions.

// Helper to fill template placeholders for invoices, including service tables
// window.fillInvoiceTemplate = function(template, invoice) { ... MOVED ... };

// Helper to group items by type and render service-specific tables for invoices
// window.renderInvoiceServiceTables = function(items = [], clientName = '') { ... MOVED ... };
*/

// Helper to fill template placeholders for quotations
window.fillQuotationTemplate = function(template, quotation) {
  let html = template;
  html = html.replace(/{{number}}/g, quotation.number || '');
  html = html.replace(/{{clientName}}/g, quotation.client?.name || '');
  html = html.replace(/{{clientEmail}}/g, quotation.client?.email || '');
  html = html.replace(/{{status}}/g, quotation.status || '');
  html = html.replace(/{{expiresAt}}/g, quotation.expiresAt ? new Date(quotation.expiresAt).toLocaleDateString() : '');
  html = html.replace(/{{total}}/g, quotation.total || '');

  // Items (show description, price, service fee, and subtotal in correct columns)
  const itemsHtml = (quotation.items || []).map(item => {
    let desc = item.description || '';
    if (item.hotelName) desc += ` | Hotel: ${item.hotelName}`;
    if (item.checkin) desc += ` | Check-in: ${item.checkin}`;
    if (item.checkout) desc += ` | Check-out: ${item.checkout}`;
    if (item.airline) desc += ` | Airline: ${item.airline}`;
    if (item.from) desc += ` | From: ${item.from}`;
    if (item.to) desc += ` | To: ${item.to}`;
    if (item.flightDate) desc += ` | Flight Date: ${item.flightDate}`;
    if (item.class) desc += ` | Class: ${item.class}`;
    // Add more fields as needed

    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    const serviceFee = Number(item.serviceFee) || 0;
    const subtotal = (qty * price) + serviceFee;

    return `<tr>
      <td>${desc}</td>
      <td>${qty}</td>
      <td>$${price.toFixed(2)}</td>
      <td>$${serviceFee.toFixed(2)}</td>
      <td>$${subtotal.toFixed(2)}</td>
    </tr>`;
  }).join('');
  html = html.replace(/{{items}}/g, itemsHtml);

  return html;
};

console.log('[pdf-utils.js] Script end parsing. window.fillInvoiceTemplate defined:', typeof window.fillInvoiceTemplate, 'window.renderInvoiceServiceTables defined:', typeof window.renderInvoiceServiceTables);
