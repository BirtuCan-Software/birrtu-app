export interface CloudWorkspace {
  syncId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  originDeviceId: string;
  deleted?: boolean;
}

export interface WorkspaceCatalog {
  schemaVersion: 1;
  userId: string;
  deviceId: string;
  updatedAt: string;
  workspaces: CloudWorkspace[];
}

function newer(current: CloudWorkspace | undefined, candidate: CloudWorkspace) {
  if (!current) return candidate;
  const currentTime = Date.parse(current.updatedAt) || 0;
  const candidateTime = Date.parse(candidate.updatedAt) || 0;
  if (candidateTime !== currentTime) {
    return candidateTime > currentTime ? candidate : current;
  }
  return candidate.originDeviceId > current.originDeviceId
    ? candidate
    : current;
}

export function mergeWorkspaceCatalogs(
  catalogs: WorkspaceCatalog[],
  localWorkspaces: CloudWorkspace[],
) {
  const merged = new Map<string, CloudWorkspace>();
  for (const workspace of [
    ...catalogs.flatMap((catalog) => catalog.workspaces),
    ...localWorkspaces,
  ]) {
    merged.set(workspace.syncId, newer(merged.get(workspace.syncId), workspace));
  }
  return Array.from(merged.values());
}
