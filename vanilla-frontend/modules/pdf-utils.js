// Utility to fetch and use HTML templates for PDF generation

// Remove 'export' and use global assignment for browser compatibility
window.loadTemplate = async function(templateName) {
  const res = await fetch(`templates/${templateName}.html`);
  if (!res.ok) throw new Error(`Template not found: ${templateName}`);
  return await res.text();
}

// Example usage in your frontend modules:
// const html = await loadTemplate('quotation'); // loads quotation.html
// const html = await loadTemplate('invoice');   // loads invoice.html
