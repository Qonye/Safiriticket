// c:\projects\Safiriticket\vanilla-frontend\modules\new-pdf-engine.js

/**
 * New PDF Generation Engine
 * This module orchestrates the generation of PDFs, ensuring correct template
 * filling and leveraging existing utilities from pdf-utils.js.
 *
 * Make sure to include this file in index.html:
 * <script src="modules/new-pdf-engine.js"></script>
 * And ensure it's loaded after pdf-utils.js and before invoices.js or any module that uses it.
 */

// Ensure html2pdf is globally available (as it's used by pdf-utils.js)
if (typeof html2pdf === 'undefined') {
  console.error('html2pdf.js is not loaded. Make sure it is included in your HTML before pdf-utils.js and new-pdf-engine.js.');
  // Alerting the user as this is a critical dependency for PDF generation.
  alert('Critical Error: html2pdf.js library is missing. PDF functionality will be broken.');
}

// Helper function to infer item type (moved from pdf-utils.js)
function _inferType(item) {
  if (item.type) return item.type; // Primary source of type
  if (item.serviceType) return item.serviceType;

  // Heuristics based on fields or description if item.type is missing
  if (item.airline || /flight/i.test(item.description)) return 'flight';
  if (item.hotelName || /hotel/i.test(item.description)) return 'hotel';
  if ((item.from && item.to) || /transfer/i.test(item.description)) return 'transfer';
  return 'Other';
}

// Helper function to render service tables (moved and adapted from pdf-utils.js)
function _renderInvoiceServiceTables(items = [], clientName = '') {
  console.log('[_renderInvoiceServiceTables] ENTERED. Processing items count:', items.length);

  if (!items || !items.length) {
    console.log('[_renderInvoiceServiceTables] No items received or items array is empty, returning empty string.');
    return '';
  }

  const grouped = {};
  items.forEach(item => {
    const type = _inferType(item); // Use local _inferType
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(item);
  });
  
  console.log('[_renderInvoiceServiceTables] Grouped items:', JSON.parse(JSON.stringify(grouped)));

  let htmlContent = '';
  let grandTotal = 0;

  // Flight Table
  if (grouped.flight && grouped.flight.length > 0) {
    let total = 0;
    htmlContent += `
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

      const flightDate = item.flightDate || '';
      const airline = item.airline || '';
      const from = item.from || '';
      const to = item.to || '';
      const route = `${from}${from && to ? ' - ' : ''}${to}`; // Added space for better readability

      htmlContent += `
        <tr>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.description || clientName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${flightDate ? new Date(flightDate).toLocaleDateString() : 'N/A'}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${airline}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${route}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${amount.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${fee.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${totalRow.toLocaleString()}</td>
        </tr>
      `;
    });
    htmlContent += `
        </tbody>
        <tfoot><tr><td colspan="6" style="text-align:right;font-weight:bold;color:#be292c;">Flight Subtotal:</td><td style="font-weight:bold;color:#be292c;">$${total.toLocaleString()}</td></tr></tfoot>
      </table>
    `;
  } else {
    console.log('[_renderInvoiceServiceTables] No flight items to render or grouped.flight is empty.');
  }

  // Hotel Table
  if (grouped.hotel && grouped.hotel.length > 0) {
    let total = 0;
    htmlContent += `
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
      const amount = Number(item.price) || 0; // Assuming price is per night
      const fee = Number(item.serviceFee) || 0;
      let nights = item.quantity || 1; // Use quantity for nights if available
      let stayDates = '';
      const checkin = item.checkin;
      const checkout = item.checkout;
      const hotelName = item.hotelName || '';

      if (checkin && checkout) {
        const d1 = new Date(checkin);
        const d2 = new Date(checkout);
        const calculatedNights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
        if (!item.quantity) nights = calculatedNights; // If quantity not provided, calculate it
        stayDates = `${d1.toLocaleDateString()} – ${d2.toLocaleDateString()}`;
      } else if (item.stayDates) { // Fallback if checkin/checkout not present
        stayDates = item.stayDates;
      }
      
      const totalRow = (amount * nights) + fee;
      total += totalRow;
      grandTotal += totalRow;
      htmlContent += `
        <tr>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.description || clientName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${stayDates}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${hotelName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${amount.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${nights}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${fee.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${totalRow.toLocaleString()}</td>
        </tr>
      `;
    });
    htmlContent += `
        </tbody>
        <tfoot><tr><td colspan="6" style="text-align:right;font-weight:bold;color:#be292c;">Hotel Subtotal:</td><td style="font-weight:bold;color:#be292c;">$${total.toLocaleString()}</td></tr></tfoot>
      </table>
    `;
  } else {
    console.log('[_renderInvoiceServiceTables] No hotel items to render or grouped.hotel is empty.');
  }

  // Transfer Table
  if (grouped.transfer && grouped.transfer.length > 0) {
    let total = 0;
    htmlContent += `
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
      const from = item.from || '';
      const to = item.to || '';

      htmlContent += `
        <tr>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${item.description || clientName}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${from}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">${to}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${amount.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${fee.toLocaleString()}</td>
          <td style="font-family: Montserrat, sans-serif; font-size: 1.05em;">$${totalRow.toLocaleString()}</td>
        </tr>
      `;
    });
    htmlContent += `
        </tbody>
        <tfoot><tr><td colspan="5" style="text-align:right;font-weight:bold;color:#be292c;">Transfer Subtotal:</td><td style="font-weight:bold;color:#be292c;">$${total.toLocaleString()}</td></tr></tfoot>
      </table>
    `;
  } else {
    console.log('[_renderInvoiceServiceTables] No transfer items to render or grouped.transfer is empty.');
  }
  
  if (grandTotal > 0) {
    // Adjusted font-size to match table cells (0.95em).
    htmlContent += `<div style="text-align:right; font-weight:bold; margin-top:16px; font-family: Montserrat, sans-serif; font-size: 1.05em; padding-right: 20px;">🧾 Grand Total: $${grandTotal.toLocaleString()}</div>`;
  }

  console.log('[_renderInvoiceServiceTables] Final HTML generated (first 300 chars):', htmlContent.substring(0, 300) + (htmlContent.length > 300 ? '...' : ''));
  return htmlContent;
}

// Helper function to fill template placeholders (moved and adapted from pdf-utils.js)
function _fillInvoiceTemplate(template, invoice) {
  let html = template;
  console.log('[_fillInvoiceTemplate] Attempting to render service tables. invoice.items count:', (invoice.items || []).length);

  html = html.replace(/{{number}}/g, invoice.number || '');
  html = html.replace(/{{clientName}}/g, invoice.client?.name || '');
  // Ensure clientEmail is also handled if present in the template or data
  html = html.replace(/{{clientEmail}}/g, invoice.client?.email || ''); 
  html = html.replace(/{{dueDate}}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '');

  const serviceTablesHtml = _renderInvoiceServiceTables(invoice.items || [], invoice.client?.name || ''); // Call local _renderInvoiceServiceTables
  
  console.log('[_fillInvoiceTemplate] HTML returned by _renderInvoiceServiceTables (first 300 chars):', serviceTablesHtml.substring(0, 300) + (serviceTablesHtml.length > 300 ? '...' : ''));
  if (serviceTablesHtml.trim() === '') {
    console.warn('[_fillInvoiceTemplate] _renderInvoiceServiceTables returned an EMPTY string.');
  }

  console.log('[_fillInvoiceTemplate] HTML before replacing {{serviceTables}} (contains placeholder?):', html.includes('{{serviceTables}}'));
  html = html.replace(/{{serviceTables}}/g, serviceTablesHtml);
  console.log('[_fillInvoiceTemplate] HTML after attempting to replace {{serviceTables}} (contains placeholder?):', html.includes('{{serviceTables}}'));
  
  return html;
}

window.newPdfEngine = {
  generateInvoice: async function(invoiceData, action = 'preview', options = {}) {
    console.log('[newPdfEngine] Generating invoice. Action:', action); // Basic entry log
    try {
      let html = await window.loadTemplate('invoice');
      console.log('[newPdfEngine] Loaded template HTML (first 50 chars):', typeof html === 'string' ? html.substring(0, 50) + '...' : 'HTML is not a string or is null/undefined');
      
      console.log('[newPdfEngine] invoiceData.items count before fillInvoiceTemplate:', (invoiceData && invoiceData.items ? invoiceData.items.length : 'N/A'));
      
      console.log('[newPdfEngine] typeof window.fillInvoiceTemplate before call:', typeof window.fillInvoiceTemplate);
      if (typeof window.fillInvoiceTemplate === 'function') {
        console.log('[newPdfEngine] Source of window.fillInvoiceTemplate (first 300 chars):\n', window.fillInvoiceTemplate.toString().substring(0, 300));
      } else {
        console.error('[newPdfEngine] ERROR: window.fillInvoiceTemplate is NOT a function! Check if pdf-utils.js is loaded correctly and defines it.');
        return; // Stop further execution
      }

      console.log('[newPdfEngine] CALLING window.fillInvoiceTemplate now...');
      html = _fillInvoiceTemplate(html, invoiceData); // This is the call
      console.log('[newPdfEngine] RETURNED from window.fillInvoiceTemplate. HTML (first 50 chars):', typeof html === 'string' ? html.substring(0, 50) + '...' : 'HTML is not a string or is null/undefined after call');
      
      const filename = `invoice-${invoiceData.number || 'details'}.pdf`;
      console.log(`[newPdfEngine] Action: ${action.charAt(0).toUpperCase() + action.slice(1)}, filename: ${filename}`);

      if (action === 'preview') {
        await window.previewPDF(html, options); // Corrected: populatedHtml to html
      } else if (action === 'download') {
        await window.downloadPDF(html, filename, options); // Corrected: populatedHtml to html
      }

    } catch (error) {
      console.error('[newPdfEngine] Error in generateInvoice:', error.message, error.stack);
    }
  },

  generateQuotation: async function(quotationData, action = 'preview', options = {}) {
    console.log('[newPdfEngine] Generating quotation. Action:', action);
    try {
      let html = await window.loadTemplate('quotation'); // Assuming you have a quotation.html
      console.log('[newPdfEngine] Loaded template HTML (first 50 chars):', typeof html === 'string' ? html.substring(0, 50) + '...' : 'HTML is not a string or is null/undefined');
      
      console.log('[newPdfEngine] quotationData.items count before fillQuotationTemplate:', (quotationData && quotationData.items ? quotationData.items.length : 'N/A'));

      console.log('[newPdfEngine] typeof window.fillQuotationTemplate before call:', typeof window.fillQuotationTemplate);
      if (typeof window.fillQuotationTemplate === 'function') {
        console.log('[newPdfEngine] Source of window.fillQuotationTemplate (first 300 chars):\n', window.fillQuotationTemplate.toString().substring(0, 300));
      } else {
        console.error('[newPdfEngine] ERROR: window.fillQuotationTemplate is NOT a function!');
        return;
      }
      
      console.log('[newPdfEngine] CALLING window.fillQuotationTemplate now...');
      html = window.fillQuotationTemplate(html, quotationData);
      console.log('[newPdfEngine] RETURNED from window.fillQuotationTemplate. HTML (first 50 chars):', typeof html === 'string' ? html.substring(0, 50) + '...' : 'HTML is not a string or is null/undefined after call');
      
      const filename = `quotation-${quotationData.number || 'details'}.pdf`;
      console.log(`[newPdfEngine] Action: ${action.charAt(0).toUpperCase() + action.slice(1)}, filename: ${filename}`);

      if (action === 'preview') {
        await window.previewPDF(html, options); // Corrected: populatedHtml to html
      } else if (action === 'download') {
        await window.downloadPDF(html, filename, options); // Corrected: populatedHtml to html
      }

    } catch (error) {
      console.error('[newPdfEngine] Error in generateQuotation:', error.message, error.stack);
    }
  }
};
