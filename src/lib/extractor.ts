// src/lib/extractor.ts
import fs from 'fs/promises';
import { VMCounter } from '@/types';
import { extractTextFromURL } from './url-extractor';

export async function extractText(
  source: string,
  sourceType: 'pdf' | 'url',
  vmCounter: VMCounter
): Promise<string | null> {
  if (sourceType === 'url') {
    return extractTextFromURL(source, vmCounter);
  } else {
    return extractTextFromPDF(source, vmCounter);
  }
}

async function extractTextFromPDF(filePath: string, vmCounter: VMCounter): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFParser = require('pdf2json');
    
    const pdfParser = new PDFParser(null, 1);
    
    return new Promise<string | null>((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('❌ PDF parsing error:', errData.parserError);
        vmCounter.increment('text_extraction_error');
        resolve(null);
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let text = '';
          
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            text = pdfData.Pages
              .map((page: any) => {
                if (!page.Texts || !Array.isArray(page.Texts)) return '';
                
                return page.Texts
                  .map((textItem: any) => {
                    if (!textItem.R || !Array.isArray(textItem.R)) return '';
                    
                    return textItem.R
                      .map((r: any) => {
                        try {
                          return decodeURIComponent(r.T || '');
                        } catch {
                          return r.T || '';
                        }
                      })
                      .join(' ');
                  })
                  .join(' ');
              })
              .join('\n\n');
          }
          
          if (!text || text.trim().length === 0) {
            console.warn('⚠️ No text extracted from PDF');
            vmCounter.increment('text_extraction_error');
            resolve(null);
          } else {
            vmCounter.increment('text_extracted_pdf');
            console.log('✅ PDF text extracted successfully');
            resolve(text);
          }
        } catch (err) {
          console.error('❌ Error processing PDF data:', err);
          vmCounter.increment('text_extraction_error');
          resolve(null);
        }
      });

      pdfParser.loadPDF(filePath);
    });
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    vmCounter.increment('text_extraction_error');
    return null;
  }
}
