/**
 * Canonical Pulumi / AWS resource naming and tagging for the OSS stack.
 *
 * Names follow `${project}-${resource}-${stack}`. Tags always include
 * `Project`, `Stack`, and `ManagedBy: pulumi`, with an optional `Component`.
 */

import * as pulumi from "@pulumi/pulumi"

/**
 * Pulumi project name (`limetry-oss` / `limetry-cloud` from Pulumi.yaml).
 *
 * @returns Current Pulumi project name.
 */
export function getProject(): string {
  return pulumi.getProject()
}

/**
 * Current Pulumi stack name (`dev`, `prod`, …).
 *
 * @returns Current stack name.
 */
export function getStackName(): string {
  return pulumi.getStack()
}

/**
 * Formats `${project}-${resource}-${stack}` (e.g. limetry-cloud-api-logs-dev).
 *
 * @param project - Pulumi project name.
 * @param resource - Logical resource segment (trimmed of leading/trailing hyphens).
 * @param stack - Pulumi stack name.
 * @returns Canonical resource name string.
 * @throws When `resource` is empty after trimming.
 */
export function formatResourceName(project: string, resource: string, stack: string): string {
  const normalized = resource.trim().replace(/^-+|-+$/g, "")
  if (!normalized) {
    throw new Error("resource name segment must be non-empty")
  }
  return `${project}-${normalized}-${stack}`
}

/**
 * Canonical AWS / Pulumi resource name for this stack.
 *
 * @param resource - Logical resource segment (for example `api` or `web-cdn`).
 * @returns `${project}-${resource}-${stack}`.
 */
export function getName(resource: string): string {
  return formatResourceName(getProject(), resource, getStackName())
}

/**
 * Deployment id `${project}-${stack}` for unique ids outside SSM paths.
 *
 * @returns Deployment-scoped id used by legacy DNS resource aliases.
 */
export function getDeploymentId(): string {
  return `${getProject()}-${getStackName()}`
}

/**
 * SSM Parameter Store prefix: `/limetry/${project}/${stack}`.
 *
 * @returns Absolute SSM path prefix for stack secrets.
 */
export function getSsmParameterPrefix(): string {
  return `/limetry/${getProject()}/${getStackName()}`
}

/**
 * Standard resource tags. Pass `component` for the Component tag; use
 * `extraTags` only for truly special cases.
 *
 * @param component - Optional Component tag value (for example `api` or `web`).
 * @param extraTags - Additional tag key/value pairs merged last.
 * @returns Tag map suitable for AWS resource `tags`.
 */
export function getTags(
  component?: string,
  extraTags: Record<string, string> = {},
): Record<string, string> {
  const loadTestRunId = new pulumi.Config().get("loadTestRunId")

  return {
    Project: getProject(),
    Stack: getStackName(),
    ManagedBy: "pulumi",
    ...(loadTestRunId
      ? {
        LoadTestRole: "target",
        RunId: loadTestRunId,
      }
      : {}),
    ...(component ? { Component: component } : {}),
    ...extraTags,
  }
}

/**
 * AWS Budgets TagKeyValue filters scoped to this project + stack.
 *
 * @returns Cost filter entries matching `user:Project$…` and `user:Stack$…`.
 */
export function projectBudgetCostFilters(): Array<{ name: string, values: string[] }> {
  return [
    {
      name: "TagKeyValue",
      values: [`user:Project$${getProject()}`],
    },
    {
      name: "TagKeyValue",
      values: [`user:Stack$${getStackName()}`],
    },
  ]
}

/**
 * Cost Anomaly Detection MonitorSpecification JSON for a CUSTOM tag monitor.
 * AWS allows only one DIMENSIONAL SERVICE monitor per account; stacks share that
 * quota, so we use CUSTOM monitors scoped to the Project cost allocation tag.
 */
export function projectAnomalyMonitorSpecification(
  project: string = getProject(),
): string {
  return JSON.stringify({
    Tags: {
      Key: "Project",
      Values: [project],
    },
  })
}
