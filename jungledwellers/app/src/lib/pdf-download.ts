// PDF Download Utilities for Jungle Dwellers CRM
// Client-side PDF generation using html2pdf.js

declare global {
  interface Window {
    html2pdf: any;
  }
}

// Import html2pdf type
import type html2pdf from 'html2pdf.js';

export interface PDFOptions {
  margin?: number[];
  filename?: string;
  image?: {
    type: string;
    quality: number;
  };
  html2canvas?: {
    scale: number;
    useCORS: boolean;
    letterRendering: boolean;
    allowTaint: boolean;
    backgroundColor: string;
  };
  jsPDF?: {
    format: string;
    unit: string;
    orientation: string;
    compress: boolean;
    precision: number;
  };
  pagebreak?: {
    mode: string[];
    before?: string;
    after?: string;
    avoid?: string;
  };
}

// Default PDF options optimized for invoices
const DEFAULT_PDF_OPTIONS: PDFOptions = {
  margin: [5, 5, 5, 5],
  image: { 
    type: 'jpeg', 
    quality: 0.98 
  },
  jsPDF: { 
    format: 'a4', 
    unit: 'mm', 
    orientation: 'portrait', 
    compress: true,
    precision: 16
  },
  pagebreak: { 
    mode: ['avoid-all', 'css', 'legacy'],
    before: '.page-break-before',
    after: '.page-break-after',
    avoid: '.avoid-break'
  },
  html2canvas: { 
    scale: 3, 
    useCORS: true, 
    letterRendering: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  }
};

// Load html2pdf.js dynamically if not already loaded
export async function loadHtml2Pdf(): Promise<void> {
  if (typeof window !== 'undefined' && !window.html2pdf) {
    // Dynamically import html2pdf.js
    const html2pdfModule = await import('html2pdf.js');
    window.html2pdf = html2pdfModule.default || html2pdfModule;
  }
}

// Generate PDF preview (opens in new window)
export async function previewPDF(html: string, options: Partial<PDFOptions> = {}): Promise<void> {
  await loadHtml2Pdf();
  
  if (!window.html2pdf) {
    throw new Error('html2pdf.js failed to load');
  }

  // Create temporary div for rendering
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // A4 width at 96 DPI
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
    
    const pdfBlob = await window.html2pdf()
      .from(tempDiv.innerHTML)
      .set(mergedOptions)
      .outputPdf('bloburl');

    // Open PDF in new window
    window.open(pdfBlob, '_blank');
  } finally {
    document.body.removeChild(tempDiv);
  }
}

// Download PDF file
export async function downloadPDF(
  html: string, 
  filename: string = 'document.pdf', 
  options: Partial<PDFOptions> = {}
): Promise<void> {
  await loadHtml2Pdf();
  
  if (!window.html2pdf) {
    throw new Error('html2pdf.js failed to load');
  }

  // Create temporary div for rendering
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // A4 width at 96 DPI
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    const mergedOptions = { 
      ...DEFAULT_PDF_OPTIONS, 
      ...options,
      filename 
    };
    
    await window.html2pdf()
      .from(tempDiv.innerHTML)
      .set(mergedOptions)
      .save();
  } finally {
    document.body.removeChild(tempDiv);
  }
}

// Generate PDF blob for further processing
export async function generatePDFBlob(
  html: string, 
  options: Partial<PDFOptions> = {}
): Promise<Blob> {
  await loadHtml2Pdf();
  
  if (!window.html2pdf) {
    throw new Error('html2pdf.js failed to load');
  }

  // Create temporary div for rendering
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // A4 width at 96 DPI
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
    
    return await window.html2pdf()
      .from(tempDiv.innerHTML)
      .set(mergedOptions)
      .outputPdf('blob');
  } finally {
    document.body.removeChild(tempDiv);
  }
}
