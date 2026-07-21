import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Path to the project-root registry used in tests */
export const REGISTRY_PATH = path.resolve(__dirname, "../..");

const TEST_TMP_ROOT = path.resolve(__dirname, "../../.test-tmp");

export async function createTestDir(prefix: string): Promise<string> {
  await fs.ensureDir(TEST_TMP_ROOT);
  return fs.mkdtemp(path.join(TEST_TMP_ROOT, `${prefix}-`));
}

export async function removeTestDir(dir: string): Promise<void> {
  await fs.remove(dir);
}
