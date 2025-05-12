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

window.newPdfEngine = {
  generateInvoice: async function(invoiceData, action = 'preview', options = {}) {
    console.log('[newPdfEngine] Generating invoice with data:', JSON.parse(JSON.stringify(invoiceData))); // Log the full invoiceData
    if (!invoiceData) {
      console.error('Invoice data is required for PDF generation.');
      alert('Error: Invoice data is missing. Cannot generate PDF.');
      return;
    }

    // Verify that necessary functions from pdf-utils.js are available
    if (typeof window.loadTemplate !== 'function') {
      console.error('window.loadTemplate is not available. Ensure pdf-utils.js is loaded correctly before new-pdf-engine.js.');
      alert('Error: PDF utility function (loadTemplate) missing.');
      return;
    }
    if (typeof window.fillInvoiceTemplate !== 'function') {
      console.error('window.fillInvoiceTemplate is not available. Ensure pdf-utils.js is loaded and defines this function globally.');
      alert('Error: PDF utility function (fillInvoiceTemplate) missing. This is crucial for correct invoice content.');
      return;
    }
    if (typeof window.previewPDF !== 'function' || typeof window.downloadPDF !== 'function') {
      console.error('window.previewPDF or window.downloadPDF is not available. Ensure pdf-utils.js is loaded correctly.');
      alert('Error: PDF utility function (previewPDF/downloadPDF) missing.');
      return;
    }

    try {
      // 1. Load the HTML template
      const templateHtml = await window.loadTemplate('invoice');
      console.log('[newPdfEngine] Loaded template HTML:', templateHtml);

      // Log the items specifically before filling the template
      console.log('[newPdfEngine] invoiceData.items before fillInvoiceTemplate:', JSON.parse(JSON.stringify(invoiceData.items || [])));

      // 2. Fill the template with invoice data
      // This uses window.fillInvoiceTemplate from pdf-utils.js, which correctly
      // handles serviceTables by calling window.renderInvoiceServiceTables and also fills org details.
      const populatedHtml = window.fillInvoiceTemplate(templateHtml, invoiceData);
      console.log('[newPdfEngine] Populated HTML for PDF:', populatedHtml);

      // 3. Define PDF options
      // These options are passed to previewPDF/downloadPDF from pdf-utils.js,
      // which might have their own defaults and merge these.
      const pdfOptions = {
        margin: [10, 10, 10, 10], // 10mm on all sides
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        html2canvas: { scale: 2, useCORS: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        // filename can be set here if preferred, but downloadPDF also takes it.
      };

      // 4. Generate and output the PDF based on the action
      if (action === 'preview') {
        console.log('[newPdfEngine] Action: Preview');
        await window.previewPDF(populatedHtml, pdfOptions);
      } else if (action === 'download') {
        const filename = `invoice-${invoiceData.number || invoiceData._id || 'details'}.pdf`;
        console.log(`[newPdfEngine] Action: Download, filename: ${filename}`);
        await window.downloadPDF(populatedHtml, filename, pdfOptions);
      } else {
        console.warn(`Unsupported PDF action: ${action}. Defaulting to preview.`);
        await window.previewPDF(populatedHtml, pdfOptions); // Default to preview for unknown actions
      }

    } catch (error) {
      console.error('Error generating invoice PDF via newPdfEngine:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  },

  generateQuotation: async function(quotationData, action = 'preview', options = {}) {
    console.log('[newPdfEngine] Generating quotation with data:', JSON.parse(JSON.stringify(quotationData)));
    try {
      let html = await window.loadTemplate('quotation'); // Assuming you have a quotation.html
      console.log('[newPdfEngine] Loaded template HTML:', html.substring(0, 200) + '...');

      // Log the items specifically before filling the template for quotations if it also uses a similar item structure
      console.log('[newPdfEngine] quotationData.items before fillQuotationTemplate:', JSON.parse(JSON.stringify(quotationData.items || [])));

      html = window.fillQuotationTemplate(html, quotationData);
      console.log('[newPdfEngine] Populated HTML for PDF:', html.substring(0, 200) + '...');
      
      if (action === 'preview') {
        console.log('[newPdfEngine] Action: Preview');
        await window.previewPDF(html, options);
      } else if (action === 'download') {
        const filename = `quotation-${quotationData.number || quotationData._id || 'details'}.pdf`;
        console.log(`[newPdfEngine] Action: Download, filename: ${filename}`);
        await window.downloadPDF(html, filename, options);
      } else {
        console.warn(`Unsupported PDF action: ${action}. Defaulting to preview.`);
        await window.previewPDF(html, options); // Default to preview for unknown actions
      }

    } catch (error) {
      console.error('Error generating quotation PDF via newPdfEngine:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  }
};
