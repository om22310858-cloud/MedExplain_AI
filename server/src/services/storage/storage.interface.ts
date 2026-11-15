import fs from 'fs';

export interface StorageResult {
  storageKey: string;
  fileSize: number;
  mimeType: string;
}

export interface IStorageService {
  saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<StorageResult>;

  getFileStream(storageKey: string): Promise<fs.ReadStream>;

  getFileBuffer(storageKey: string): Promise<Buffer>;

  deleteFile(storageKey: string): Promise<boolean>;

  fileExists(storageKey: string): Promise<boolean>;
}
