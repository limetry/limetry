import * as pulumi from "@pulumi/pulumi"
import { beforeAll, describe, expect, it } from "vitest"

type MockResource = {
  inputs: Record<string, unknown>
  name: string
  type: string
}

const resources: MockResource[] = []
let cloudStack: typeof import("./index")

function findResource(type: string, name: string): MockResource {
  const resource = resources.find((candidate) => candidate.type === type && candidate.name === name)
  expect(
    resource,
    resources.map((candidate) => `${candidate.type}:${candidate.name}`).join(", "),
  ).toBeDefined()
  return resource as MockResource
}

function readRecord(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object")
  expect(value).not.toBeNull()
  return value as Record<string, unknown>
}

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
      cloudStack.apiEndpoint.promise(),
      cloudStack.apiNamespace.promise(),
      cloudStack.apiServiceName.promise(),
    ])
  })

  it("builds the default SQLite deployment contract", () => {
    expect(cloudStack.persistence).toBe("sqlite")
    expect(cloudStack.apiDomain).toBeUndefined()
    expect(cloudStack.apiDomainZone).toBe("limetry.org")

    const deployment = findResource("kubernetes:apps/v1:Deployment", "limetry-api")
    const deploymentSpec = readRecord(deployment.inputs.spec)
    expect(deploymentSpec.replicas).toBe(1)

    const template = readRecord(deploymentSpec.template)
    const podSpec = readRecord(template.spec)
    const containers = podSpec.containers as Array<Record<string, unknown>>
    expect(containers).toHaveLength(1)
    expect(containers[0]?.image).toMatch(/^limetry-server:pulumi-/)
    expect(containers[0]?.ports).toEqual([{ name: "http", containerPort: 3810 }])
    expect(containers[0]?.volumeMounts).toEqual([{ name: "sqlite", mountPath: "/data" }])
    expect(podSpec.volumes).toBeDefined()

    const service = findResource("kubernetes:core/v1:Service", "limetry-api")
    const serviceSpec = readRecord(service.inputs.spec)
    expect(serviceSpec.type).toBe("LoadBalancer")

    expect(resources.some((resource) => resource.name === "limetry-sqlite")).toBe(true)
    expect(resources.some((resource) => resource.name === "limetry-bearerToken")).toBe(true)
    expect(resources.some((resource) => resource.name === "limetry-jwtSecret")).toBe(true)
    expect(resources.some((resource) => resource.name === "limetry-decisionHmacSecret")).toBe(true)
  })

  it("wires generated secrets into the runtime Secret", async () => {
    const runtimeSecret = findResource("kubernetes:core/v1:Secret", "limetry-runtime")
    const stringData = readRecord(runtimeSecret.inputs.stringData)

    expect(stringData.value).toBeTypeOf("object")
    expect(await cloudStack.bearerToken.isSecret).toBe(true)
  })
})
