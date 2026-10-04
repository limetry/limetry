/**
 * Product, package, website, and schema compatibility for this release.
 */
export const COMPATIBILITY = {
  "product": "1.2.56",
  "compatibleProduct": ">=1.2.0 <1.3.0",
  "packages": {
    "@limetry/ci": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/cli": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/mcp": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/preflight": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/sdk": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/shopify": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/sql": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "@limetry/ui": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
  },
  "websites": {
    "oss": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
    "cloud": {
      "version": "1.2.56",
      "compatible": ">=1.2.0 <1.3.0",
    },
  },
  "schemas": {
    "openapi.evaluate": {
      "version": "1.0.0",
      "compatible": ">=1.0.0 <2.0.0",
    },
    "openapi.custom-gpt": {
      "version": "1.0.0",
      "compatible": ">=1.0.0 <2.0.0",
    },
    "json.evaluate": {
      "version": "1.0.0",
      "compatible": ">=1.0.0 <2.0.0",
    },
  },
} as const
