// Type declarations for html2pdf.js
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type: string;
      quality: number;
    };
    html2canvas?: {
      scale?: number;
      dpi?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      allowTaint?: boolean;
      backgroundColor?: string;
      width?: number;
      height?: number;
      scrollX?: number;
      scrollY?: number;
    };
    jsPDF?: {
      format?: string;
      unit?: string;
      orientation?: string;
      compress?: boolean;
      precision?: number;
    };
    pagebreak?: {
      mode?: string[];
      before?: string;
      after?: string;
      avoid?: string;
    };
  }

  interface Html2Pdf {
    from(element: string | HTMLElement): Html2Pdf;
    set(options: Html2PdfOptions): Html2Pdf;
    outputPdf(type?: 'blob' | 'bloburl' | 'dataurlstring' | 'dataurlnewwindow'): Promise<any>;
    save(): Promise<void>;
  }

  function html2pdf(): Html2Pdf;
  export = html2pdf;
}
