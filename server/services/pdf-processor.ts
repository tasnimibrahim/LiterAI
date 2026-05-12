import pdf from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface ProcessedPDF {
  id: string;
  filename: string;
  content: string;
  metadata: {
    numpages: number;
    info: any;
  };
}

export async function processPdfBuffer(buffer: Buffer, filename: string): Promise<ProcessedPDF> {
  try {
    const data = await pdf(buffer);
    
    return {
      id: uuidv4(),
      filename,
      content: data.text,
      metadata: {
        numpages: data.numpages,
        info: data.info,
      }
    };
  } catch (error) {
    console.error(`[PDF Processing Error] Failed to process ${filename}:`, error);
    throw new Error(`Failed to extract text from PDF: ${filename}`);
  }
}

export async function savePdfLocally(buffer: Buffer, filename: string): Promise<string> {
  const uploadsDir = path.join(os.tmpdir(), "literai_uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filepath = path.join(uploadsDir, safeFilename);
  
  await fs.writeFile(filepath, buffer);
  return filepath;
}
