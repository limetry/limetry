import type { NetworkInterfaceInfo } from "node:os"

import { describe, expect, it } from "vitest"

import {
  expandListenUrls,
  isLoopbackHostname,
  lanIPv4Addresses,
  resolvePublicListenUrl,
} from "./listen-urls.js"

const fakeInterfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = {
  lo0: [
    {
      address: "127.0.0.1",
      netmask: "255.0.0.0",
      family: "IPv4",
      mac: "00:00:00:00:00:00",
      internal: true,
      cidr: "127.0.0.1/8",
    },
  ],
  en0: [
    {
      address: "192.168.1.12",
      netmask: "255.255.255.0",
      family: "IPv4",
      mac: "aa:bb:cc:dd:ee:ff",
      internal: false,
      cidr: "192.168.1.12/24",
    },
  ],
}

describe("listen URLs", () => {
  it("detects loopback hostnames", () => {
    expect(isLoopbackHostname("localhost")).toBe(true)
    expect(isLoopbackHostname("127.0.0.1")).toBe(true)
    expect(isLoopbackHostname("0.0.0.0")).toBe(true)
    expect(isLoopbackHostname("api.example.com")).toBe(false)
  })

  it("collects non-internal IPv4 addresses", () => {
    expect(lanIPv4Addresses(fakeInterfaces)).toEqual(["192.168.1.12"])
  })

  it("prints a single localhost URL without LAN synonyms", () => {
    expect(expandListenUrls("http://localhost:3810")).toEqual([
      "http://localhost:3810",
    ])
  })

  it("normalizes loopback synonyms to localhost", () => {
    expect(expandListenUrls("https://127.0.0.1:3830")).toEqual([
      "https://localhost:3830",
    ])
    expect(expandListenUrls("http://0.0.0.0:3810")).toEqual([
      "http://localhost:3810",
    ])
  })

  it("leaves public hosts unchanged", () => {
    expect(expandListenUrls("https://api.example.com/v1")).toEqual([
      "https://api.example.com/v1",
    ])
  })

  it("leaves invalid URLs unchanged", () => {
    expect(expandListenUrls("not a url")).toEqual(["not a url"])
  })

  it("resolves Vercel production and preview URLs", () => {
    expect(resolvePublicListenUrl("http://localhost:3810", {
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "api.example.com",
    })).toBe("https://api.example.com")
    expect(resolvePublicListenUrl("http://localhost:3810", {
      VERCEL_URL: "app-git-main.vercel.app",
    })).toBe("https://app-git-main.vercel.app")
    expect(resolvePublicListenUrl("http://localhost:3810", {})).toBe("http://localhost:3810")
  })
})
