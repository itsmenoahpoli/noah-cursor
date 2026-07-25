export interface PackageRef {
  type?: string;
  id: string;
  version?: string;
}

/** Parse `type/id@version`, `id@version`, or `id`. */
export function parsePackageRef(input: string): PackageRef {
  const trimmed = input.trim();
  const atIdx = trimmed.lastIndexOf("@");
  let namePart = trimmed;
  let version: string | undefined;

  if (atIdx > 0) {
    namePart = trimmed.slice(0, atIdx);
    version = trimmed.slice(atIdx + 1) || undefined;
  }

  const slash = namePart.indexOf("/");
  if (slash > 0) {
    return {
      type: namePart.slice(0, slash),
      id: namePart.slice(slash + 1),
      version,
    };
  }

  return { id: namePart, version };
}

export function formatPackageRef(ref: PackageRef): string {
  const base = ref.type ? `${ref.type}/${ref.id}` : ref.id;
  return ref.version ? `${base}@${ref.version}` : base;
}

/** Loose compare: equal major.minor.patch strings, or prefix match for ranges like 2.3. */
export function versionMatches(installed: string, requested?: string): boolean {
  if (!requested || requested === "latest" || requested === "*") return true;
  if (installed === requested) return true;
  if (requested.endsWith(".x")) {
    const prefix = requested.slice(0, -2);
    return installed === prefix || installed.startsWith(`${prefix}.`);
  }
  // Allow @2.3 to match 2.3.1
  if (!requested.includes(".") || requested.split(".").length < 3) {
    return installed === requested || installed.startsWith(`${requested}.`);
  }
  return false;
}
