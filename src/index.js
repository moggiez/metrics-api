"use strict";

const AWS = require("aws-sdk");
const db = require("moggies-db");

const helpers = require("moggies-lambda-helpers");
const auth = require("moggies-auth");
const metricsHelpers = require("moggies-metrics");
const config = require("./config");
const { Handler } = require("./handler");

exports.handler = function (event, context, callback) {
  const response = helpers.getResponseFn(callback);

  if (config.DEBUG) {
    response(200, event);
  }

  const user = auth.getUserFromEvent(event);
  const request = helpers.getRequestFromEvent(event);
  request.user = user;

  const organisations = new db.Table({
    config: db.tableConfigs.organisations,
    AWS: AWS,
  });
  const loadtests = new db.Table({
    config: db.tableConfigs.loadtests,
    AWS: AWS,
  });
  const loadtestMetrics = new db.Table({
    config: db.tableConfigs.loadtest_metrics,
    AWS: AWS,
  });
  const CloudWatch = new AWS.CloudWatch({ apiVersion: "2010-08-01" });
  const Metrics = new metricsHelpers.Metrics(CloudWatch);
  const handler = new Handler({
    organisations,
    loadtests,
    loadtestMetrics,
    Metrics,
  });
  handler.handle(request, response);
};
