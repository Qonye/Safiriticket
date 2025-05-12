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

// Helper to group items by type and render service-specific tables for invoices
window.renderInvoiceServiceTables = function(items = [], clientName = '') {
  console.log('[renderInvoiceServiceTables] Received items:', JSON.parse(JSON.stringify(items)));
  console.log('[renderInvoiceServiceTables] Received clientName:', clientName);

  if (!items.length) {
    console.log('[renderInvoiceServiceTables] No items to render, returning empty string.');
    return '';
  }

  // Try to infer type if not present (fallback to description keywords)
  function inferType(item) {
    if (item.type) return item.type;
    if (item.serviceType) return item.serviceType;
    // Heuristics based on fields or description
    if (item.airline || /flight/i.test(item.description)) return 'flight';
    if (item.hotelName || /hotel/i.test(item.description)) return 'hotel';
    if ((item.from && item.to) || /transfer/i.test(item.description)) return 'transfer';
    return 'Other';
  }

  // Group items by type
  const grouped = {};
  items.forEach(item => {
    const type = inferType(item);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(item);
  });

  console.log('[renderInvoiceServiceTables] Grouped items:', JSON.parse(JSON.stringify(grouped)));

  let html = '';
  let grandTotal = 0;

  // Flights Table
  if (grouped.flight) {
    let total = 0;
    html += `
      <h3 style="margin-top:32px;margin-bottom:8px;">✈️ Flight</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Travel Dates</th>
            <th>Airline</th>
            <th>Route</th>
            <th>Amount</th>
            <th>Service Fee</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    grouped.flight.forEach(item => {
      const amount = Number(item.price) || 0;
      const fee = Number(item.serviceFee) || 0;
      const totalRow = amount + fee;
      total += totalRow;
      grandTotal += totalRow;
      html += `
        <tr>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${clientName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.flightDate || ''}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.airline || ''}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.from || ''}${item.from && item.to ? '-' : ''}${item.to || ''}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${amount.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${fee.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${totalRow.toLocaleString()}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <div style="text-align:right;font-weight:bold;margin-bottom:16px;font-family: Montserrat, sans-serif; font-size: 1.05em;">Total Flights: $${total.toLocaleString()}</div>
      <hr>
    `;
  }

  // Hotels Table
  if (grouped.hotel) {
    let total = 0;
    html += `
      <h3 style="margin-top:32px;margin-bottom:8px;">🏨 Hotel</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Stay Dates</th>
            <th>Hotel</th>
            <th>Amount per Night</th>
            <th>No. of Days</th>
            <th>Service Fee</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    grouped.hotel.forEach(item => {
      const amount = Number(item.price) || 0;
      const fee = Number(item.serviceFee) || 0;
      let nights = 1;
      let stayDates = '';
      if (item.checkin && item.checkout) {
        const d1 = new Date(item.checkin);
        const d2 = new Date(item.checkout);
        nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
        stayDates = `${item.checkin} – ${item.checkout}`;
      }
      const totalRow = (amount * nights) + fee;
      total += totalRow;
      grandTotal += totalRow;
      html += `
        <tr>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${clientName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${stayDates}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.hotelName || ''}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${amount.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${nights}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${fee.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${totalRow.toLocaleString()}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <div style="text-align:right;font-weight:bold;margin-bottom:16px;font-family: Montserrat, sans-serif; font-size: 1.05em;">Total Hotels: $${total.toLocaleString()}</div>
      <hr>
    `;
  }

  // Transfers Table
  if (grouped.transfer) {
    let total = 0;
    html += `
      <h3 style="margin-top:32px;margin-bottom:8px;">🚐 Transfers</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>From</th>
            <th>To</th>
            <th>Amount</th>
            <th>Service Fee</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    grouped.transfer.forEach(item => {
      const amount = Number(item.price) || 0;
      const fee = Number(item.serviceFee) || 0;
      const totalRow = amount + fee;
      total += totalRow;
      grandTotal += totalRow;
      html += `
        <tr>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${clientName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.from || ''}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.to || ''}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${amount.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${fee.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${totalRow.toLocaleString()}</td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <div style="text-align:right;font-weight:bold;margin-bottom:16px;font-family: Montserrat, sans-serif; font-size: 1.05em;">Total Transfers: $${total.toLocaleString()}</div>
      <hr>
    `;
  }

  // Grand Total
  html += `<div style="text-align:right;font-size:1.1em;font-weight:bold;margin-top:24px;font-family: Montserrat, sans-serif; font-size: 1.1em;">🧾 Grand Total: $${grandTotal.toLocaleString()}</div>`;

  console.log('[renderInvoiceServiceTables] Generated HTML for tables (first 200 chars):', html.substring(0, 200) + '...');
  return html;
};

// Helper to fill template placeholders for invoices, including service tables
window.fillInvoiceTemplate = function(template, invoice) {
  let html = template;
  html = html.replace(/{{number}}/g, invoice.number || '');
  html = html.replace(/{{clientName}}/g, invoice.client?.name || '');
  html = html.replace(/{{dueDate}}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '');

  // Service-specific tables only (no generic table)
  html = html.replace(/{{serviceTables}}/g, window.renderInvoiceServiceTables(invoice.items || [], invoice.client?.name || ''));

  return html;
};

// Example usage in your frontend modules:
// const html = await loadTemplate('quotation'); // loads quotation.html
// const html = await loadTemplate('invoice');   // loads invoice.html
