/**
 * OSS limetry single-stack releasekit config.
 * Dual-stack maintainer releases run from limetry-workspace (parent).
 */
export default {
  versionStyle: {
    padPatch: false,
    prerelease: "beta",
  },
  stamp: [
    { type: "packageJson", path: "package.json" },
    {
      type: "tsConst",
      path: "packages/sdk/src/app-version.ts",
      exportName: "APP_VERSION",
    },
  ],
  channels: {
    prod: { branch: ["main", "master"], prerelease: false },
    dev: { prerelease: true },
  },
  qualityGate:
    "yarn sync-version && yarn workspace @limetry/sdk typecheck && yarn workspace @limetry/preflight typecheck && yarn workspace @limetry/server typecheck && yarn workspace @limetry/web typecheck && yarn docs:check",
  deploy: [
    {
      id: "vercel-watch",
      command: "yarn watch:vercel",
      when: { flag: "vercel", channel: "prod" },
    },
  ],
  git: {
    commitTemplate: "chore: released {version}",
    tagTemplate: "v{version}",
    rollbackOnDeployFailure: true,
  },
}
