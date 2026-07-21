import { z } from "zod";
import { ASSET_TYPES } from "../constants/index.js";

export type AssetType = (typeof ASSET_TYPES)[number];

export const AssetEntrySchema = z.object({
  id: z.string().min(1),
  version: z.string().default("1.0.0"),
  description: z.string().optional(),
  path: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
  id: z.string().min(1),
  version: z.string().min(1),
  installedAt: z.string().optional(),
  path: z.string().optional(),
});

export type InstalledAsset = z.infer<typeof InstalledAssetSchema>;

export const NoahMetadataSchema = z.object({
  registry: z.string().min(1),
  installed: z.array(InstalledAssetSchema).default([]),
  updatedAt: z.string().optional(),
});

export type NoahMetadata = z.infer<typeof NoahMetadataSchema>;

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
}

export interface GlobalOptions {
  verbose?: boolean;
  yes?: boolean;
}

export interface AssetRequest {
  type: AssetType;
  id: string;
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
}
