import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageService, StorageResult } from './storage.interface.js';
import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class LocalStorageAdapter implements IStorageService {
  private baseDir: string;

  constructor(baseDir: string = ENV.UPLOAD_DIR) {
    this.baseDir = path.resolve(baseDir);
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true, mode: 0o700 });
      logger.info(`Initialized private storage directory at: ${this.baseDir}`);
    }
  }

  private getSafeFilePath(storageKey: string): string {
    // Prevent directory traversal attacks by taking only the basename
    const cleanKey = path.basename(storageKey);
    return path.join(this.baseDir, cleanKey);
  }

  async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<StorageResult> {
    this.ensureDirectory();

    const ext = path.extname(originalFilename).toLowerCase();
    const randomHex = crypto.randomBytes(16).toString('hex');
    const storageKey = `${Date.now()}_${randomHex}${ext}`;
    const destinationPath = this.getSafeFilePath(storageKey);

    await fs.promises.writeFile(destinationPath, fileBuffer);

    return {
      storageKey,
      fileSize: fileBuffer.length,
      mimeType,
    };
  }

  async getFileStream(storageKey: string): Promise<fs.ReadStream> {
    const filePath = this.getSafeFilePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in storage: ${storageKey}`);
    }
    return fs.createReadStream(filePath);
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const filePath = this.getSafeFilePath(storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in storage: ${storageKey}`);
    }
    return fs.promises.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const filePath = this.getSafeFilePath(storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  async fileExists(storageKey: string): Promise<boolean> {
    const filePath = this.getSafeFilePath(storageKey);
    return fs.existsSync(filePath);
  }
}

// Default storage adapter instance
export const storageService: IStorageService = new LocalStorageAdapter();
