import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  findInstalled,
  listInstalledAssets,
  readMetadata,
  removeInstalledAsset,
  upsertInstalledAssets,
} from "../metadata/store.js";
import { createTestDir, removeTestDir } from "./helpers.js";

describe("metadata store", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => removeTestDir(dir)));
    tempDirs.length = 0;
  });

  async function tempCwd(): Promise<string> {
    const dir = await createTestDir("noah-meta");
    tempDirs.push(dir);
    return dir;
  }

  it("returns null when metadata is missing", async () => {
    const cwd = await tempCwd();
    expect(await readMetadata(cwd)).toBeNull();
  });

  it("writes and upserts installed assets", async () => {
    const cwd = await tempCwd();
    await upsertInstalledAssets(
      "https://github.com/owner/registry",
      [{ type: "skill", id: "test", version: "1.0.0", path: "skills/test" }],
      cwd,
    );

    const meta = await readMetadata(cwd);
    expect(meta?.registry).toBe("https://github.com/owner/registry");
    expect(meta?.installed).toHaveLength(1);
    expect(findInstalled(meta!, "skill", "test")?.version).toBe("1.0.0");

    await upsertInstalledAssets(
      "https://github.com/owner/registry",
      [{ type: "skill", id: "test", version: "2.0.0", path: "skills/test" }],
      cwd,
    );

    const updated = await readMetadata(cwd);
    expect(updated?.installed).toHaveLength(1);
    expect(updated?.installed[0]?.version).toBe("2.0.0");
  });

  it("removes installed assets", async () => {
    const cwd = await tempCwd();
    await upsertInstalledAssets(
      "https://github.com/owner/registry",
      [
        { type: "skill", id: "a", version: "1.0.0" },
        { type: "rule", id: "b", version: "1.0.0" },
      ],
      cwd,
    );

    await removeInstalledAsset("skill", "a", cwd);
    const meta = await readMetadata(cwd);
    expect(meta?.installed).toHaveLength(1);
    expect(meta?.installed[0]?.id).toBe("b");
  });

  it("lists on-disk skills even when missing from metadata", async () => {
    const cwd = await tempCwd();
    await fs.ensureDir(path.join(cwd, ".cursor", "skills", "publish-npm"));
    await fs.writeFile(
      path.join(cwd, ".cursor", "skills", "publish-npm", "SKILL.md"),
      "# publish-npm\n",
    );
    await upsertInstalledAssets(
      "https://github.com/itsmenoahpoli/noah-cursor",
      [{ type: "skill", id: "commit-push", version: "1.0.0", path: "skills/commit-push" }],
      cwd,
    );
    await fs.ensureDir(path.join(cwd, ".cursor", "skills", "commit-push"));
    await fs.writeFile(
      path.join(cwd, ".cursor", "skills", "commit-push", "SKILL.md"),
      "# commit-push\n",
    );

    const listed = await listInstalledAssets(cwd);
    expect(listed.installed.map((a) => a.id).sort()).toEqual([
      "commit-push",
      "publish-npm",
    ]);
    expect(listed.installed.find((a) => a.id === "commit-push")?.version).toBe("1.0.0");
    expect(listed.installed.find((a) => a.id === "publish-npm")?.version).toBe("local");
  });
});
