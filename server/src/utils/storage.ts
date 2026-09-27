import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/index.js';

let s3Client: S3Client | null = null;

if (config.storage.endpoint && config.storage.accessKey && config.storage.secretKey) {
  try {
    s3Client = new S3Client({
      endpoint: config.storage.endpoint,
      region: config.storage.region,
      credentials: {
        accessKeyId: config.storage.accessKey,
        secretAccessKey: config.storage.secretKey,
      },
      forcePathStyle: true,
    });
    console.log('[Storage] Initialized S3-compatible storage client.');
  } catch (err) {
    console.warn('[Storage] Failed to initialize S3 client, using local file storage fallback.', err);
    s3Client = null;
  }
}

export async function saveFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ filePath: string; storageType: 's3' | 'local' }> {
  if (s3Client) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: config.storage.bucket,
          Key: fileName,
          Body: fileBuffer,
          ContentType: mimeType,
        })
      );
      return { filePath: fileName, storageType: 's3' };
    } catch (err) {
      console.error('[Storage] S3 upload error, falling back to local file:', err);
    }
  }

  // Local storage fallback
  const localDest = path.join(config.uploadsDir, fileName);
  fs.writeFileSync(localDest, fileBuffer);
  return { filePath: fileName, storageType: 'local' };
}

export async function getFileStream(fileName: string): Promise<{
  stream?: NodeJS.ReadableStream;
  localPath?: string;
  isLocal: boolean;
}> {
  const localDest = path.join(config.uploadsDir, fileName);
  if (fs.existsSync(localDest)) {
    return { localPath: localDest, isLocal: true };
  }

  if (s3Client) {
    const s3Obj = await s3Client.send(
      new GetObjectCommand({
        Bucket: config.storage.bucket,
        Key: fileName,
      })
    );
    return { stream: s3Obj.Body as NodeJS.ReadableStream, isLocal: false };
  }

  throw new Error(`File ${fileName} not found in storage`);
}

export async function deleteFile(fileName: string): Promise<void> {
  const localDest = path.join(config.uploadsDir, fileName);
  if (fs.existsSync(localDest)) {
    try {
      fs.unlinkSync(localDest);
    } catch {
      // ignore
    }
  }

  if (s3Client) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.storage.bucket,
          Key: fileName,
        })
      );
    } catch {
      // ignore
    }
  }
}
