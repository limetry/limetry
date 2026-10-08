import "./.sst/platform/config.d.ts"

export default $config({
  app(input) {
    return {
      name: "serverless",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        gcp: { package: "@pulumi/gcp", version: "10.1.0" },
        azure: { package: "@pulumi/azure", version: "6.40.0" },
      },
    }
  },
  async run() {},
})
