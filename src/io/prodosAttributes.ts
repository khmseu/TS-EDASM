import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface ProDOSAttributes {
  fileType?: number;
  auxType?: number;
  createdAt?: string;
  modifiedAt?: string;
  [key: string]: unknown;
}

function attributesPath(targetPath: string): string {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  return path.join(dir, `.${base}`);
}

export async function writeProDOSAttributes(
  targetPath: string,
  attributes: ProDOSAttributes
): Promise<void> {
  const dotPath = attributesPath(targetPath);
  const json = JSON.stringify(attributes, null, 2);
  await fs.writeFile(dotPath, json, 'utf8');
}

export async function readProDOSAttributes(targetPath: string): Promise<ProDOSAttributes | null> {
  const dotPath = attributesPath(targetPath);

  try {
    const contents = await fs.readFile(dotPath, 'utf8');
    return JSON.parse(contents) as ProDOSAttributes;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
