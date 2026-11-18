// pnpm hook (runs on install; its checksum is recorded in pnpm-lock.yaml).
// better-auth declares optional peers for its CLI/test helpers (drizzle-kit, vitest). The workspace has them as
// devDependencies, so pnpm resolved them into better-auth's production graph and `pnpm --filter server deploy --prod`
// shipped vitest/vite/drizzle-kit/esbuild (~80 MB, plus picomatch from their tree) in the Docker image. The app only
// uses better-auth at runtime (server: drizzle adapter; web: better-auth/react), so these peers are dropped.
const UNUSED_OPTIONAL_PEERS = {
  'better-auth': ['drizzle-kit', 'vitest'],
};

function readPackage(pkg) {
  for (const peer of UNUSED_OPTIONAL_PEERS[pkg.name] ?? []) {
    if (pkg.peerDependencies) delete pkg.peerDependencies[peer];
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta[peer];
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
