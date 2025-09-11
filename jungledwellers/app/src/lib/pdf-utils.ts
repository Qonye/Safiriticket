// PDF Generation Utilities for Jungle Dwellers CRM
import { readFileSync } from 'fs';
import { join } from 'path';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

export interface InvoiceData {
  number: string;
  clientName: string;
  clientEmail?: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  createdBy: string;
  creationDate: string;
  paymentDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode: string;
    currency: string;
    additionalInfo: string;
  };
}

// Convert image to base64 data URL
export function imageToBase64(imagePath: string): string {
  try {
    const fullPath = join(process.cwd(), 'public', imagePath);
    const imageBuffer = readFileSync(fullPath);
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error loading image ${imagePath}:`, error);
    return '';
  }
}

// Currency symbol mapping
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'KES': 'KSh',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return symbols[currency] || '$';
}

// Format currency amount
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}

// Generate service tables HTML for invoice
export function generateServiceTablesHTML(items: InvoiceItem[], currency: string = 'USD'): string {
  if (!items || items.length === 0) {
    return '<p>No items to display</p>';
  }

  // Group items by category
  const groupedItems = items.reduce((groups: { [key: string]: InvoiceItem[] }, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  let html = '';

  // Generate table for each category
  Object.entries(groupedItems).forEach(([category, categoryItems]) => {
    const hasPricedItems = categoryItems.some(item => item.total > 0);
    
    html += `
      <div class="section" style="margin-bottom: 16px;">
        <h3 style="color: #2d5016; font-size: 1.2em; font-weight: 600; margin-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">
          ${category}
        </h3>
        <table class="items-table" style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 3px;">
          <thead>
            <tr style="background: #f3f5f7;">
              <th style="border: 1px solid #e6e9ef; padding: 12px; text-align: left; color: #2e2e2e; font-weight: 600; font-size: 0.95em;">Description</th>
              ${hasPricedItems ? '<th style="border: 1px solid #e6e9ef; padding: 12px; text-align: center; color: #2e2e2e; font-weight: 600; font-size: 0.95em;">Qty</th>' : ''}
              ${hasPricedItems ? '<th style="border: 1px solid #e6e9ef; padding: 12px; text-align: center; color: #2e2e2e; font-weight: 600; font-size: 0.95em;">Unit Price</th>' : ''}
              ${hasPricedItems ? '<th style="border: 1px solid #e6e9ef; padding: 12px; text-align: center; color: #2e2e2e; font-weight: 600; font-size: 0.95em;">Total</th>' : ''}
            </tr>
          </thead>
          <tbody>
    `;

    categoryItems.forEach((item, index) => {
      const isInformational = item.total === 0 && item.unitPrice === 0;
      const isSubItem = item.description.startsWith('  ');
      const isHeader = item.description.startsWith('---') && item.description.endsWith('---');
      
      html += `
        <tr style="${isSubItem ? 'background: #f8f9fa;' : isHeader ? 'background: #2d5016;' : ''}">
          <td style="border: 1px solid #e6e9ef; padding: ${isHeader ? '12px' : '10px 12px'}; text-align: ${isHeader ? 'center' : 'left'}; color: ${isHeader ? '#ffffff !important' : isSubItem ? '#4b5563' : '#1f2937'}; font-size: ${isHeader ? '1.2em' : '1.0em'}; font-weight: ${isHeader ? '600' : 'normal'}; ${isSubItem ? 'padding-left: 24px;' : ''}">
            ${item.description}
          </td>
          ${hasPricedItems ? `<td style="border: 1px solid #e6e9ef; padding: 10px 12px; text-align: center; color: ${isHeader ? '#ffffff !important' : '#2e2e2e'}; font-size: 0.95em; background: ${isHeader ? '#2d5016' : 'transparent'};">${isInformational ? '-' : item.quantity}</td>` : ''}
          ${hasPricedItems ? `<td style="border: 1px solid #e6e9ef; padding: 10px 12px; text-align: center; color: ${isHeader ? '#ffffff !important' : '#2e2e2e'}; font-size: 0.95em; background: ${isHeader ? '#2d5016' : 'transparent'};">${isInformational ? '-' : formatCurrency(item.unitPrice, currency)}</td>` : ''}
          ${hasPricedItems ? `<td style="border: 1px solid #e6e9ef; padding: 10px 12px; text-align: center; color: ${isHeader ? '#ffffff !important' : '#2e2e2e'}; font-size: 0.95em; font-weight: ${isInformational ? 'normal' : '600'}; background: ${isHeader ? '#2d5016' : 'transparent'};">${isInformational ? '-' : formatCurrency(item.total, currency)}</td>` : ''}
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  return html;
}

// Fill invoice template with data
export function fillInvoiceTemplate(template: string, invoice: InvoiceData): string {
  let html = template;
  
  // Convert images to base64 for PDF generation
  const logoBase64 = imageToBase64('JD - Logo 1.png');
  const watermarkBase64 = imageToBase64('LIon head.png');
  const footerBase64 = imageToBase64('bottom image.png');
  
  // Replace image sources with base64 data
  html = html.replace(/src="\.\.\/\.\.\/public\/JD - Logo 1\.png"/g, `src="${logoBase64}"`);
  html = html.replace(/src="\.\.\/\.\.\/public\/LIon head\.png"/g, `src="${watermarkBase64}"`);
  html = html.replace(/src="\.\.\/\.\.\/public\/bottom image\.png"/g, `src="${footerBase64}"`);
  
  // Replace basic placeholders
  html = html.replace(/{{number}}/g, invoice.number || '');
  html = html.replace(/{{clientName}}/g, invoice.clientName || '');
  html = html.replace(/{{clientEmail}}/g, invoice.clientEmail || '');
  html = html.replace(/{{dueDate}}/g, invoice.dueDate || '');
  html = html.replace(/{{createdBy}}/g, invoice.createdBy || 'System');
  html = html.replace(/{{creationDate}}/g, invoice.creationDate || new Date().toLocaleDateString());
  
  // Replace currency symbol
  const currencySymbol = getCurrencySymbol(invoice.currency);
  html = html.replace(/{{currencySymbol}}/g, currencySymbol);
  
  // Replace grand total
  html = html.replace(/{{grandTotal}}/g, formatCurrency(invoice.total, invoice.currency));
  
  // Replace payment details
  if (invoice.paymentDetails) {
    html = html.replace(/{{paymentAccountName}}/g, invoice.paymentDetails.accountName || 'JUNGLE DWELLERS LTD');
    html = html.replace(/{{paymentAccountNumber}}/g, invoice.paymentDetails.accountNumber || '0254001002');
    html = html.replace(/{{paymentBankName}}/g, invoice.paymentDetails.bankName || 'DIAMOND TRUST BANK');
    html = html.replace(/{{paymentSwiftCode}}/g, invoice.paymentDetails.swiftCode || 'DTKEKENA');
    html = html.replace(/{{paymentCurrency}}/g, invoice.paymentDetails.currency || invoice.currency);
    html = html.replace(/{{paymentAdditionalInfo}}/g, invoice.paymentDetails.additionalInfo || '(Please use your name or invoice number as payment reference)');
  }
  
  // Generate and replace service tables
  const serviceTablesHTML = generateServiceTablesHTML(invoice.items, invoice.currency);
  html = html.replace(/{{serviceTables}}/g, serviceTablesHTML);
  
  return html;
}

// Generate invoice data from booking
export function generateInvoiceDataFromBooking(booking: any, safari: any, client: any): InvoiceData {
  const invoiceNumber = `JD-INV-${Date.now().toString().slice(-6)}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
  
  // Create invoice items from safari data
  const items: InvoiceItem[] = [];

  // Create main safari description (simple and clean)
  let safariDescription = `${safari.title || safari.name || 'Safari Package'} - ${safari.duration} days safari package`;
  
  // Add destination if available
  if (safari.destination) {
    safariDescription += `\nDestination: ${safari.destination}`;
  }

  // Base safari package with enhanced description
  items.push({
    description: safariDescription,
    quantity: booking.pax,
    unitPrice: safari.basePrice,
    total: safari.basePrice * booking.pax,
    category: 'activities'
  });

  // Add inclusions as separate items under "other" category with special formatting
  if (safari.inclusions && safari.inclusions.length > 0) {
    // Add a header item for inclusions
    items.push({
      description: '--- INCLUSIONS ---',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: 'other'
    });
    
    safari.inclusions.forEach((inclusion: any) => {
      const desc = inclusion.description || inclusion;
      if (desc && desc.trim()) {
        items.push({
          description: `✓ ${desc}`,
          quantity: 1,
          unitPrice: 0,
          total: 0,
          category: 'other'
        });
      }
    });
  }

  // Add exclusions as separate items under "other" category with special formatting
  if (safari.exclusions && safari.exclusions.length > 0) {
    // Add a header item for exclusions
    items.push({
      description: '--- EXCLUSIONS ---',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: 'other'
    });
    
    safari.exclusions.forEach((exclusion: any) => {
      const desc = exclusion.description || exclusion;
      if (desc && desc.trim()) {
        items.push({
          description: `✗ ${desc}`,
          quantity: 1,
          unitPrice: 0,
          total: 0,
          category: 'other'
        });
      }
    });
  }

  // Add detailed itinerary as separate items under "other" category with special formatting
  if (safari.itinerary && safari.itinerary.length > 0) {
    // Add a header item for itinerary
    items.push({
      description: '--- ITINERARY ---',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: 'other'
    });
    
    safari.itinerary.forEach((day: any) => {
      if (day.title && day.description) {
        items.push({
          description: `Day ${day.day}: ${day.title}`,
          quantity: 1,
          unitPrice: 0,
          total: 0,
          category: 'other'
        });
        // Add day description as a sub-item
        if (day.description.trim()) {
          items.push({
            description: `  ${day.description}`,
            quantity: 1,
            unitPrice: 0,
            total: 0,
            category: 'other'
          });
        }
      }
    });
  }

  // Add accommodation items if available
  if (safari.accommodation && safari.accommodation.length > 0) {
    safari.accommodation.forEach((acc: any) => {
      if (acc.name && acc.price > 0) {
        items.push({
          description: `Accommodation: ${acc.name} (${acc.location})`,
          quantity: acc.nights || 1,
          unitPrice: acc.price,
          total: acc.price * (acc.nights || 1),
          category: 'Accommodation'
        });
      }
    });
  }

  // Add activities if available
  if (safari.activities && safari.activities.length > 0) {
    safari.activities.forEach((activity: any) => {
      if (activity.name && activity.price > 0) {
        items.push({
          description: `Activity: ${activity.name}`,
          quantity: booking.pax,
          unitPrice: activity.price,
          total: activity.price * booking.pax,
          category: 'Activities'
        });
      }
    });
  }

  // Add transportation if available
  if (safari.transportation && safari.transportation.length > 0) {
    safari.transportation.forEach((transport: any) => {
      if (transport.type && transport.price > 0) {
        items.push({
          description: `Transportation: ${transport.type}`,
          quantity: 1,
          unitPrice: transport.price,
          total: transport.price,
          category: 'Transportation'
        });
      }
    });
  }

  // Add meals if available
  if (safari.meals && safari.meals.length > 0) {
    safari.meals.forEach((meal: any) => {
      if (meal.type && meal.price > 0) {
        items.push({
          description: `Meal: ${meal.type}`,
          quantity: booking.pax,
          unitPrice: meal.price,
          total: meal.price * booking.pax,
          category: 'Meals'
        });
      }
    });
  }

  // Add park fees if available
  if (safari.parkFees && safari.parkFees.length > 0) {
    safari.parkFees.forEach((fee: any) => {
      if (fee.park && fee.price > 0) {
        items.push({
          description: `Park Fee: ${fee.park}`,
          quantity: booking.pax,
          unitPrice: fee.price,
          total: fee.price * booking.pax,
          category: 'Park Fees'
        });
      }
    });
  }

  // Add guides if available
  if (safari.guides && safari.guides.length > 0) {
    safari.guides.forEach((guide: any) => {
      if (guide.type && guide.price > 0) {
        items.push({
          description: `Guide: ${guide.type}`,
          quantity: 1,
          unitPrice: guide.price,
          total: guide.price,
          category: 'Guides'
        });
      }
    });
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // No tax for now
  const total = subtotal + tax;

  return {
    number: invoiceNumber,
    clientName: client.name,
    clientEmail: client.email,
    dueDate: dueDate.toLocaleDateString(),
    items,
    subtotal,
    tax,
    total,
    currency: safari.currency || 'USD',
    createdBy: 'System', // This will be replaced with actual user
    creationDate: new Date().toLocaleDateString(),
    paymentDetails: {
      accountName: 'JUNGLE DWELLERS LTD',
      accountNumber: '0254001002',
      bankName: 'DIAMOND TRUST BANK',
      swiftCode: 'DTKEKENA',
      currency: safari.currency || 'USD',
      additionalInfo: '(Please use your name or invoice number as payment reference)'
    }
  };
}
