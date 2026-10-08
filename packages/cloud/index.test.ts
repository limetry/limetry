import * as pulumi from "@pulumi/pulumi"
import { beforeAll, describe, expect, it } from "vitest"

/** Captured Pulumi resource inputs used by the workload contract tests. */
type MockResource = {
  inputs: Record<string, unknown>
  name: string
  type: string
}

/** Resources registered by the Pulumi mock runtime. */
const resources: MockResource[] = []

/** Dynamically imported Pulumi stack exports under test. */
let cloudStack: typeof import("./index")

/**
 * Resolves a Pulumi Output through the public apply API for unit tests.
 *
 * @param output - Output whose underlying value should be awaited.
 * @returns A promise that settles when the Output value is known.
 */
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      output.apply((value) => {
        resolve(value)
        return value
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Finds a captured resource by Pulumi type and logical name.
 *
 * @param type - Pulumi resource type.
 * @param name - Pulumi logical resource name.
 * @returns Captured resource inputs.
 */
function findResource(type: string, name: string): MockResource {
  /** Resource matching the requested Pulumi type and logical name. */
  const resource = resources.find((candidate) => candidate.type === type && candidate.name === name)
  expect(
    resource,
    resources.map((candidate) => `${candidate.type}:${candidate.name}`).join(", "),
  ).toBeDefined()
  return resource as MockResource
}

/**
 * Narrows a captured Pulumi input to an object record.
 *
 * @param value - Captured Pulumi input.
 * @returns Object record for assertions.
 */
function readRecord(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object")
  expect(value).not.toBeNull()
  return value as Record<string, unknown>
}

/** Verifies the shared Kubernetes workload contract. */
describe("cloud Pulumi stack", () => {
  beforeAll(async () => {
    pulumi.runtime.setMocks({
      newResource: (args) => {
        resources.push({
          inputs: args.inputs,
          name: args.name,
          type: args.type,
        })
        return {
          id: `${args.type}::${args.name}`,
          state: args.inputs,
        }
      },
      call: (args) => args.inputs,
    })
    cloudStack = await import("./index")
    await Promise.all([
      promiseOf(cloudStack.apiEndpoint),
      promiseOf(cloudStack.apiNamespace),
      promiseOf(cloudStack.apiServiceName),
    ])
  })

  /** Verifies the default Neon workload contract. */
  it("builds the default Neon deployment contract", () => {
    expect(cloudStack.persistence).toBe("postgres")
    expect(cloudStack.apiDomain).toBeUndefined()
    expect(cloudStack.apiDomainZone).toBe("limetry.org")

    /** Captured API Deployment resource. */
    const deployment = findResource("kubernetes:apps/v1:Deployment", "limetry-api")

    /** Deployment specification passed to Kubernetes. */
    const deploymentSpec = readRecord(deployment.inputs.spec)
    expect(deploymentSpec.replicas).toBe(2)

    /** Pod template used by the API Deployment. */
    const template = readRecord(deploymentSpec.template)

    /** Pod specification used by the API Deployment. */
    const podSpec = readRecord(template.spec)

    /** API container definitions in the pod specification. */
    const containers = podSpec.containers as Array<Record<string, unknown>>
    expect(containers).toHaveLength(1)
    expect(containers[0]?.image).toMatch(/^limetry-server:pulumi-/)
    expect(containers[0]?.ports).toEqual([{ name: "http", containerPort: 3810 }])
    expect(containers[0]?.volumeMounts).toBeUndefined()
    expect(podSpec.volumes).toBeUndefined()

    /** Captured API Service resource. */
    const service = findResource("kubernetes:core/v1:Service", "limetry-api")

    /** Service specification passed to Kubernetes. */
    const serviceSpec = readRecord(service.inputs.spec)
    expect(serviceSpec.type).toBe("LoadBalancer")

    expect(resources.some((resource) => resource.type === "neon:index/project:Project")).toBe(true)
    const neonProject = findResource("neon:index/project:Project", "limetry-neon-project")
    expect(neonProject.inputs.regionId).toBe("aws-us-east-1")
    expect(readRecord(neonProject.inputs.branch)).toMatchObject({
      databaseName: "limetry",
      name: "main",
      roleName: "limetry",
    })
    expect(resources.some((resource) => resource.name === "limetry-bearerToken")).toBe(true)
    expect(resources.some((resource) => resource.name === "limetry-jwtSecret")).toBe(true)
    expect(resources.some((resource) => resource.name === "limetry-decisionHmacSecret")).toBe(true)
  })

  /** Verifies generated credentials are wired into the runtime Secret. */
  it("wires generated secrets into the runtime Secret", async () => {
    /** Captured runtime Secret resource. */
    const runtimeSecret = findResource("kubernetes:core/v1:Secret", "limetry-runtime")

    /** Secret key/value payload passed to Kubernetes. */
    const stringData = readRecord(runtimeSecret.inputs.stringData)

    expect(stringData.value).toBeTypeOf("object")
    expect(await pulumi.isSecret(cloudStack.bearerToken)).toBe(true)
  })
})
