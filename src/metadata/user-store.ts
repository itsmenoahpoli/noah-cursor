import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { USER_DIR_NAME } from "../constants/index.js";
import {
  UserStoreSchema,
  type AssetType,
  type FavoriteEntry,
  type RecentEntry,
  type UserStore,
} from "../types/index.js";

const MAX_RECENT = 50;
const MAX_UNDO = 20;
const MAX_AUDIT = 200;

export function getUserDir(): string {
  if (process.env.NOAH_HOME) {
    return path.resolve(process.env.NOAH_HOME);
  }
  return path.join(os.homedir(), USER_DIR_NAME);
}

export function getUserStorePath(): string {
  return path.join(getUserDir(), "store.json");
}

export async function readUserStore(): Promise<UserStore> {
  const storePath = getUserStorePath();
  if (!(await fs.pathExists(storePath))) {
    return UserStoreSchema.parse({});
  }
  try {
    const raw = await fs.readJson(storePath);
    return UserStoreSchema.parse(raw);
  } catch {
    return UserStoreSchema.parse({});
  }
}

export async function writeUserStore(store: UserStore): Promise<void> {
  const storePath = getUserStorePath();
  await fs.ensureDir(path.dirname(storePath));
  const parsed = UserStoreSchema.parse(store);
  await fs.writeJson(storePath, parsed, { spaces: 2 });
}

export async function addRecent(
  type: AssetType,
  id: string,
  action: RecentEntry["action"],
): Promise<void> {
  const store = await readUserStore();
  const entry: RecentEntry = { type, id, action, at: new Date().toISOString() };
  store.recent = [entry, ...store.recent.filter((r) => !(r.type === type && r.id === id))].slice(
    0,
    MAX_RECENT,
  );
  await writeUserStore(store);
}

export async function listRecent(): Promise<RecentEntry[]> {
  const store = await readUserStore();
  return store.recent;
}

export async function addFavorite(type: AssetType, id: string): Promise<FavoriteEntry> {
  const store = await readUserStore();
  const existing = store.favorites.find((f) => f.type === type && f.id === id);
  if (existing) return existing;
  const entry: FavoriteEntry = { type, id, addedAt: new Date().toISOString() };
  store.favorites.push(entry);
  await writeUserStore(store);
  return entry;
}

export async function removeFavorite(type: AssetType, id: string): Promise<boolean> {
  const store = await readUserStore();
  const before = store.favorites.length;
  store.favorites = store.favorites.filter((f) => !(f.type === type && f.id === id));
  if (store.favorites.length === before) return false;
  await writeUserStore(store);
  return true;
}

export async function listFavorites(): Promise<FavoriteEntry[]> {
  const store = await readUserStore();
  return store.favorites;
}

export async function pushUndo(entry: UserStore["undoStack"][number]): Promise<void> {
  const store = await readUserStore();
  store.undoStack = [entry, ...store.undoStack].slice(0, MAX_UNDO);
  await writeUserStore(store);
}

export async function popUndo(): Promise<UserStore["undoStack"][number] | null> {
  const store = await readUserStore();
  const entry = store.undoStack.shift() ?? null;
  if (entry) await writeUserStore(store);
  return entry;
}

export async function appendAudit(action: string, detail?: string): Promise<void> {
  const store = await readUserStore();
  store.auditLog = [
    { at: new Date().toISOString(), action, detail },
    ...store.auditLog,
  ].slice(0, MAX_AUDIT);
  await writeUserStore(store);
}

export async function getSettings(): Promise<UserStore["settings"]> {
  return (await readUserStore()).settings;
}

export async function updateSettings(
  patch: Partial<UserStore["settings"]>,
): Promise<UserStore["settings"]> {
  const store = await readUserStore();
  store.settings = { ...store.settings, ...patch };
  await writeUserStore(store);
  return store.settings;
}
