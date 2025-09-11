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
    dpi?: number;
    useCORS: boolean;
    letterRendering: boolean;
    allowTaint: boolean;
    backgroundColor: string;
    width?: number;
    height?: number;
    scrollX?: number;
    scrollY?: number;
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

// Simplified PDF options to avoid hanging
const DEFAULT_PDF_OPTIONS: PDFOptions = {
  margin: [10, 10, 10, 10],
  image: { 
    type: 'jpeg', 
    quality: 0.8 
  },
  html2canvas: { 
    scale: 2,
    useCORS: true,
    letterRendering: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  },
  jsPDF: { 
    format: 'a4', 
    unit: 'mm', 
    orientation: 'portrait',
    compress: false,
    precision: 16
  }
};

// Load html2pdf.js dynamically if not already loaded
export async function loadHtml2Pdf(): Promise<void> {
  console.log('Loading html2pdf.js...');
  if (typeof window !== 'undefined' && !window.html2pdf) {
    console.log('html2pdf not found on window, importing...');
    try {
      // Dynamically import html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      console.log('html2pdf module imported:', html2pdfModule);
      window.html2pdf = html2pdfModule.default || html2pdfModule;
      console.log('html2pdf assigned to window:', window.html2pdf);
    } catch (error) {
      console.error('Error importing html2pdf.js:', error);
      throw error;
    }
  } else {
    console.log('html2pdf already available on window');
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
  tempDiv.style.width = '210mm'; // A4 width in mm for better scaling
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
  console.log('Starting PDF download...');
  
  try {
    await loadHtml2Pdf();
    console.log('html2pdf loaded successfully');
    
    if (!window.html2pdf) {
      throw new Error('html2pdf.js failed to load');
    }

    // Create temporary div for rendering
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width in mm for better scaling
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    console.log('Temporary div created and added to DOM');

    try {
      const mergedOptions = { 
        ...DEFAULT_PDF_OPTIONS, 
        ...options,
        filename 
      };
      
      console.log('Starting PDF generation with options:', mergedOptions);
      
      // Add timeout to prevent hanging
      const pdfPromise = window.html2pdf()
        .from(tempDiv.innerHTML)
        .set(mergedOptions)
        .save();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF generation timed out after 30 seconds')), 30000);
      });
      
      await Promise.race([pdfPromise, timeoutPromise]);
      console.log('PDF generation completed');
    } finally {
      document.body.removeChild(tempDiv);
      console.log('Temporary div removed from DOM');
    }
  } catch (error: unknown) {
    console.error('Error in downloadPDF:', error);
    console.log('Attempting fallback PDF generation...');
    
    // Fallback: Try with minimal options
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);
      
      try {
        const minimalOptions = {
          margin: 10,
          filename: filename,
          jsPDF: { format: 'a4', unit: 'mm', orientation: 'portrait' }
        };
        
        console.log('Trying minimal PDF generation...');
        await window.html2pdf()
          .from(tempDiv)
          .set(minimalOptions)
          .save();
        console.log('Fallback PDF generation succeeded');
      } finally {
        document.body.removeChild(tempDiv);
      }
    } catch (fallbackError: unknown) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
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
  tempDiv.style.width = '210mm'; // A4 width in mm for better scaling
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
