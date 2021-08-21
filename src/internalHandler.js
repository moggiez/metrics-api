"use strict";

class InternalHandler {
  constructor({ loadtestMetrics }) {
    const loadtestMetricsTableName = "loadtest_metrics";

    if (
      !loadtestMetrics ||
      loadtestMetrics.getConfig().tableName != loadtestMetricsTableName
    ) {
      throw new Error(
        `Constructor expects '${loadtestMetricsTableName}' table passed. The passed table name does not match '${loadtestMetricsTableName}'.`
      );
    }

    this.loadtestMetrics = loadtestMetrics;
  }

  handle = async (event) => {
    if (event.action === "updateMetricsData") {
      const data = await this.loadtestMetrics.get({
        hashKey: event.parameters.loadtestId,
        sortKey: event.parameters.metricName,
      });

      if ("Item" in data) {
        const loadtestMetric = data.Item;
        return await this.loadtestMetrics.update({
          hashKey: loadtestMetric.LoadtestId,
          sortKey: loadtestMetric.MetricName,
          updatedFields: {
            MetricsData: event.parameters.metricsData,
          },
        });
      } else {
        return await this.loadtestMetrics.create({
          hashKey: event.parameters.loadtestId,
          sortKey: event.parameters.metricName,
          record: {
            MetricsData: event.parameters.metricsData,
          },
        });
      }
    } else {
      throw Error("Not supported action.");
    }
  };
}

exports.InternalHandler = InternalHandler;
