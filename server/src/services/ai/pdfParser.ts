import pdfParse from 'pdf-parse';
import { logger } from '../../utils/logger.js';

export interface ParsedPdfResult {
  text: string;
  numPages: number;
  info?: Record<string, unknown>;
}

export const extractTextFromPdf = async (
  buffer: Buffer
): Promise<ParsedPdfResult> => {
  try {
    // Slice exact buffer bounds into a clean Uint8Array to avoid pdf.js reading unaligned shared ArrayBuffer pools
    const uint8Data = new Uint8Array(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );
    const data = await pdfParse(uint8Data as any);
    const cleanedText = (data.text || '').trim();

    return {
      text: cleanedText,
      numPages: data.numpages || 1,
      info: data.info,
    };
  } catch (error: any) {
    logger.error('Failed to parse PDF document', error);
    if (error.name === 'PasswordException' || error.message?.includes('password')) {
      throw new Error('This PDF is password-protected. Please upload an unprotected copy.');
    }
    throw new Error('Failed to extract text from the PDF file. The file may be corrupt or scanned.');
  }
};
