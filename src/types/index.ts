import { z } from "zod";
import { ASSET_TYPES, IDE_IDS, DEFAULT_IDE, type IdeId } from "../constants/index.js";
import {
  ASSET_ID_PATTERN,
  RELATIVE_ASSET_PATH_PATTERN,
} from "../utils/paths.js";

export type { IdeId };
export type AssetType = (typeof ASSET_TYPES)[number];

const AssetIdSchema = z
  .string()
  .min(1)
  .regex(
    ASSET_ID_PATTERN,
    "Asset id must use only letters, numbers, dots, underscores, and hyphens",
  );

const AssetRelativePathSchema = z
  .string()
  .regex(
    RELATIVE_ASSET_PATH_PATTERN,
    "Asset path must be a relative registry path without '..' or absolute segments",
  );

export const AssetEntrySchema = z.object({
  id: AssetIdSchema,
  version: z.string().default("1.0.0"),
  description: z.string().optional(),
  path: AssetRelativePathSchema.optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  downloads: z.number().optional(),
  rating: z.number().min(0).max(5).optional(),
  verified: z.boolean().optional(),
  dependsOn: z.array(z.string()).optional(),
  changelog: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AssetEntry = z.infer<typeof AssetEntrySchema>;

export const PresetEntrySchema = AssetEntrySchema.extend({
  includes: z
    .object({
      skills: z.array(z.string()).optional(),
      rules: z.array(z.string()).optional(),
      prompts: z.array(z.string()).optional(),
      mcp: z.array(z.string()).optional(),
    })
    .default({}),
});

export type PresetEntry = z.infer<typeof PresetEntrySchema>;

export const ManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  homepage: z.string().optional(),
  skills: z.array(AssetEntrySchema).default([]),
  rules: z.array(AssetEntrySchema).default([]),
  prompts: z.array(AssetEntrySchema).default([]),
  mcp: z.array(AssetEntrySchema).default([]),
  presets: z.array(PresetEntrySchema).default([]),
});

export type Manifest = z.infer<typeof ManifestSchema>;

export const InstalledAssetSchema = z.object({
  type: z.enum(ASSET_TYPES),
  id: AssetIdSchema,
  version: z.string().min(1),
  installedAt: z.string().optional(),
  path: z.string().optional(),
});

export type InstalledAsset = z.infer<typeof InstalledAssetSchema>;

export const NoahMetadataSchema = z.object({
  registry: z.string().min(1),
  ide: z.enum(IDE_IDS as unknown as [IdeId, ...IdeId[]]).default(DEFAULT_IDE),
  installed: z.array(InstalledAssetSchema).default([]),
  updatedAt: z.string().optional(),
});

export type NoahMetadata = z.infer<typeof NoahMetadataSchema>;

export const WorkspaceConfigSchema = z.object({
  $schema: z.string().optional(),
  packages: z.array(z.string()).default([]),
  ide: z.enum(IDE_IDS as unknown as [IdeId, ...IdeId[]]).optional(),
  registry: z.string().optional(),
  privateRegistry: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;

export const LockfileSchema = z.object({
  version: z.literal(1).default(1),
  packages: z.array(
    z.object({
      type: z.enum(ASSET_TYPES),
      id: z.string(),
      version: z.string(),
    }),
  ),
  ide: z.enum(IDE_IDS as unknown as [IdeId, ...IdeId[]]).optional(),
  updatedAt: z.string().optional(),
});

export type Lockfile = z.infer<typeof LockfileSchema>;

export const RecentEntrySchema = z.object({
  type: z.enum(ASSET_TYPES),
  id: z.string(),
  action: z.enum(["installed", "viewed", "updated"]),
  at: z.string(),
});

export type RecentEntry = z.infer<typeof RecentEntrySchema>;

export const FavoriteEntrySchema = z.object({
  type: z.enum(ASSET_TYPES),
  id: z.string(),
  addedAt: z.string(),
});

export type FavoriteEntry = z.infer<typeof FavoriteEntrySchema>;

export const UserStoreSchema = z.object({
  favorites: z.array(FavoriteEntrySchema).default([]),
  recent: z.array(RecentEntrySchema).default([]),
  settings: z
    .object({
      defaultIde: z.enum(IDE_IDS as unknown as [IdeId, ...IdeId[]]).optional(),
      privateRegistry: z.string().optional(),
      analytics: z.boolean().optional(),
      plugins: z.array(z.string()).optional(),
    })
    .default({}),
  auth: z
    .object({
      token: z.string().optional(),
      username: z.string().optional(),
      loggedInAt: z.string().optional(),
    })
    .optional(),
  undoStack: z
    .array(
      z.object({
        action: z.enum(["install", "uninstall"]),
        type: z.enum(ASSET_TYPES),
        id: z.string(),
        ide: z.enum(IDE_IDS as unknown as [IdeId, ...IdeId[]]),
        at: z.string(),
        snapshotPath: z.string().optional(),
      }),
    )
    .default([]),
  auditLog: z
    .array(
      z.object({
        at: z.string(),
        action: z.string(),
        detail: z.string().optional(),
      }),
    )
    .default([]),
});

export type UserStore = z.infer<typeof UserStoreSchema>;

export interface AddOptions {
  skill?: string;
  rule?: string;
  prompt?: string;
  mcp?: string;
  preset?: string;
  all?: boolean;
  force?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  verbose?: boolean;
  ide?: IdeId;
}

export interface GlobalOptions {
  verbose?: boolean;
  yes?: boolean;
}

export interface AssetRequest {
  type: AssetType;
  id: string;
  version?: string;
}

export interface InstallResult {
  type: AssetType;
  id: string;
  version: string;
  path: string;
  skipped?: boolean;
  reason?: string;
}

export interface DoctorCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface SearchResult {
  type: AssetType;
  id: string;
  version: string;
  description?: string;
  tags?: string[];
  author?: string;
  downloads?: number;
  rating?: number;
  verified?: boolean;
  dependsOn?: string[];
  changelog?: string;
  updatedAt?: string;
  score?: number;
}

export interface ProjectStack {
  frameworks: string[];
  languages: string[];
  tools: string[];
  packageManagers: string[];
}

export interface HealthScores {
  architecture: number;
  security: number;
  documentation: number;
  testing: number;
  overall: number;
}

export interface ProjectAnalysis {
  stack: ProjectStack;
  health: HealthScores;
  missing: string[];
  recommendations: SearchResult[];
}
