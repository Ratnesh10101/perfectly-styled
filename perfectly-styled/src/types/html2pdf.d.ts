
// src/types/html2pdf.d.ts
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      [key: string]: any; // Allow other html2canvas options
    };
    jsPDF?: {
      unit?: 'pt' | 'mm' | 'cm' | 'in';
      format?: string | number[]; // e.g., 'a4', 'letter', [width, height]
      orientation?: 'portrait' | 'p' | 'landscape' | 'l';
      [key: string]: any; // Allow other jsPDF options
    };
    pagebreak?: {
      mode?: string | Array<'avoid-all' | 'css' | 'legacy' | 'whiteline' | 'smooth'>; // Made mode more specific
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
    enableLinks?: boolean;
    [key: string]: any; // Allow other top-level options
  }

  interface Html2PdfWorker {
    from: (element: HTMLElement | string) => Html2PdfWorker;
    set: (options: Html2PdfOptions) => Html2PdfWorker;
    save: (filename?: string) => Promise<void>;
    toPdf: () => Html2PdfWorker; // Returns itself for chaining
    get: (type: 'pdf' | 'canvas' | 'img' | 'blob') => Promise<any>; // 'any' can be refined if specific types are known
    then: (onFulfilled: () => void, onRejected?: (err: any) => void) => Promise<void>;
    catch: (onRejected: (err: any) => void) => Promise<void>;
    // Add other methods if needed based on library's API
  }

  function html2pdf(element?: HTMLElement | string, options?: Html2PdfOptions): Html2PdfWorker;

  export default html2pdf;
}
