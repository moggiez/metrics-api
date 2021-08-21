"use strict";

const AWS = require("aws-sdk");
const db = require("@moggiez/moggies-db");

const helpers = require("@moggiez/moggies-lambda-helpers");
const auth = require("@moggiez/moggies-auth");
const metricsHelpers = require("@moggiez/moggies-metrics");
const { InternalHandler } = require("./internalHandler");
const { Handler } = require("./handler");

const organisationsTableConfig = {
  tableName: "organisations",
  hashKey: "OrganisationId",
  sortKey: "UserId",
  indexes: {
    UserOrganisations: {
      hashKey: "UserId",
      sortKey: "OrganisationId",
    },
  },
};

const loadtestsTableConfig = {
  tableName: "loadtests",
  hashKey: "OrganisationId",
  sortKey: "LoadtestId",
  indexes: {
    PlaybookLoadtestIndex: {
      hashKey: "PlaybookId",
      sortKey: "LoadtestId",
    },
    UsersLoadtestsIndex: {
      hashKey: "UserId",
      sortKey: "LoadtestId",
    },
    CreatedAtHourIndex: {
      hashKey: "CreatedAtHour",
      sortKey: "MetricsSavedDate",
    },
  },
};

const loadtestMetricsTableConfig = {
  tableName: "loadtest_metrics",
  hashKey: "LoadtestId",
  sortKey: "MetricName",
};

const DEBUG = false;

exports.handler = async function (event, context, callback) {
  const organisations = new db.Table({
    config: organisationsTableConfig,
    AWS: AWS,
  });
  const loadtests = new db.Table({
    config: loadtestsTableConfig,
    AWS: AWS,
  });
  const loadtestMetrics = new db.Table({
    config: loadtestMetricsTableConfig,
    AWS: AWS,
  });

  if ("isInternal" in event && event.isInternal) {
    if (DEBUG) {
      return event;
    }

    const internalHandler = new InternalHandler({ loadtestMetrics });
    return await internalHandler.handle(event);
  }

  const response = helpers.getResponseFn(callback);

  if (DEBUG) {
    response(200, event);
  }

  const user = auth.getUserFromEvent(event);
  const request = helpers.getRequestFromEvent(event);
  request.user = user;
  const CloudWatch = new AWS.CloudWatch({ apiVersion: "2010-08-01" });
  const Metrics = new metricsHelpers.Metrics(CloudWatch);
  const handler = new Handler({
    organisations,
    loadtests,
    loadtestMetrics,
    Metrics,
  });
  await handler.handle(request, response);
};
