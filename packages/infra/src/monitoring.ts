/**
 * CloudWatch health alarms, Project-scoped AWS Budget, and optional Cost Anomaly Detection.
 */

import * as aws from "@pulumi/aws"
import type * as pulumi from "@pulumi/pulumi"

import type { BudgetThresholds } from "./budget-config.js"
import {
  getName,
  getTags,
  projectAnomalyMonitorSpecification,
  projectBudgetCostFilters,
} from "./tags.js"

/**
 * Inputs for {@link createMonitoring}.
 */
export type MonitoringInputs = {
  /**
   * Monthly USD budget limit.
   */
  budgetAmount: string
  /**
   * ACTUAL / FORECASTED notification percentages.
   */
  budgetThresholds: BudgetThresholds
  /**
   * When true with `enableCostMonitoring`, create Cost Anomaly Detection.
   */
  enableCostAnomalyDetection: boolean
  /**
   * Gate for optional cost anomaly resources.
   */
  enableCostMonitoring: boolean
  /**
   * CloudWatch metric namespace for health instability counts.
   */
  healthMetricNamespace: string
  /**
   * API Lambda function name for the Errors alarm dimension.
   */
  lambdaFunctionName: pulumi.Input<string>
  /**
   * API Lambda log group scanned for DEGRADED health events.
   */
  logGroupName: pulumi.Input<string>
  /**
   * Subscriber email for budget (and optional anomaly) notifications.
   */
  notificationEmail: string
}

/**
 * Outputs from {@link createMonitoring}.
 */
export type MonitoringOutputs = {
  /**
   * AWS Budgets resource id.
   */
  budgetId: pulumi.Output<string>
  /**
   * ARN of the DEGRADED health instability alarm.
   */
  stabilityAlarmArn: pulumi.Output<string>
}

/**
 * Health metric filter + instability alarm, Project-scoped AWS Budget,
 * and optional Cost Anomaly Detection (label-lens pattern).
 *
 * @param inputs - Lambda identifiers, budget thresholds, and feature flags.
 * @returns Budget id and stability alarm ARN.
 */
export function createMonitoring(inputs: MonitoringInputs): MonitoringOutputs {
  const tags = getTags("monitoring")

  const healthMetricFilter = new aws.cloudwatch.LogMetricFilter(
    getName("health-instability-filter"),
    {
      name: getName("health-instability-filter"),
      logGroupName: inputs.logGroupName,
      pattern: '{ $.status = "DEGRADED" }',
      metricTransformation: {
        name: "InstabilityCount",
        namespace: inputs.healthMetricNamespace,
        value: "1",
      },
    },
  )

  const stabilityAlarm = new aws.cloudwatch.MetricAlarm(
    getName("instability-alarm"),
    {
      name: getName("instability-alarm"),
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: healthMetricFilter.metricTransformation.name,
      namespace: healthMetricFilter.metricTransformation.namespace,
      period: 60,
      statistic: "Sum",
      threshold: 0,
      alarmDescription:
        "Triggers when the API logs a DEGRADED health status (unstable dependency state).",
      actionsEnabled: true,
      treatMissingData: "notBreaching",
      tags,
    },
  )

  const lambdaErrorsAlarm = new aws.cloudwatch.MetricAlarm(
    getName("lambda-errors-alarm"),
    {
      name: getName("lambda-errors-alarm"),
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: 60,
      statistic: "Sum",
      threshold: 0,
      dimensions: {
        FunctionName: inputs.lambdaFunctionName,
      },
      alarmDescription: "Triggers when the API Lambda reports any Errors in a 60s window.",
      actionsEnabled: true,
      treatMissingData: "notBreaching",
      tags,
    },
  )

  const budget = new aws.budgets.Budget(getName("stack-budget"), {
    name: getName("stack-budget"),
    budgetType: "COST",
    limitAmount: inputs.budgetAmount,
    limitUnit: "USD",
    timeUnit: "MONTHLY",
    costFilters: projectBudgetCostFilters(),
    notifications: [
      {
        comparisonOperator: "GREATER_THAN",
        notificationType: "ACTUAL",
        threshold: inputs.budgetThresholds.actualWarningPercent,
        thresholdType: "PERCENTAGE",
        subscriberEmailAddresses: [inputs.notificationEmail],
      },
      {
        comparisonOperator: "GREATER_THAN",
        notificationType: "ACTUAL",
        threshold: inputs.budgetThresholds.actualCriticalPercent,
        thresholdType: "PERCENTAGE",
        subscriberEmailAddresses: [inputs.notificationEmail],
      },
      {
        comparisonOperator: "GREATER_THAN",
        notificationType: "FORECASTED",
        threshold: inputs.budgetThresholds.forecastedPercent,
        thresholdType: "PERCENTAGE",
        subscriberEmailAddresses: [inputs.notificationEmail],
      },
    ],
  })

  if (inputs.enableCostMonitoring && inputs.enableCostAnomalyDetection) {
    /**
     * Cost Explorer is a global/us-east-1 API. Pinning keeps monitors from being
     * replaced whenever the stack default region changes (e.g. us-east-1 → us-west-2).
     */
    const costExplorer = new aws.Provider(getName("cost-explorer"), {
      region: "us-east-1",
    })

    const anomalyMonitor = new aws.costexplorer.AnomalyMonitor(
      getName("anomaly-monitor"),
      {
        name: getName("anomaly-monitor"),
        monitorType: "CUSTOM",
        monitorSpecification: projectAnomalyMonitorSpecification(),
      },
      { provider: costExplorer },
    )

    new aws.costexplorer.AnomalySubscription(getName("anomaly-subscription"), {
      name: getName("anomaly-subscription"),
      monitorArnLists: [anomalyMonitor.arn],
      subscribers: [
        {
          address: inputs.notificationEmail,
          type: "EMAIL",
        },
      ],
      thresholdExpression: {
        dimension: {
          key: "ANOMALY_TOTAL_IMPACT_ABSOLUTE",
          matchOptions: ["GREATER_THAN_OR_EQUAL"],
          values: ["10.0"],
        },
      },
      frequency: "DAILY",
    }, { provider: costExplorer })
  }

  void lambdaErrorsAlarm

  return {
    budgetId: budget.id,
    stabilityAlarmArn: stabilityAlarm.arn,
  }
}
