const uuid = require("uuid");
const { Handler } = require("../handler");
const { buildLambdaRequest, mockTable, mockMetrics } = require("./helpers");
const helpers = require("moggies-lambda-helpers");
const auth = require("moggies-auth");

const { Table } = require("moggies-db");
jest.mock("moggies-db");

const response = jest.fn();
const organisations = mockTable({ tableName: "organisations" });
const loadtests = mockTable({ tableName: "loadtests" });
const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
const Metrics = mockMetrics();
const handlerArgs = {
  organisations,
  loadtests,
  loadtestMetrics,
  Metrics,
};

describe("Handler.handle", () => {
  beforeEach(() => {
    Table.mockClear();
  });

  it("calls this.get when httpMethod is GET", () => {
    const loadtestId = uuid.v4();
    const metricName = uuid.v4();
    const event = buildLambdaRequest(
      "GET",
      "/metrics",
      `${loadtestId}/${metricName}`,
      {
        TestField: 1,
      }
    );
    const user = auth.getUserFromEvent(event);
    const request = helpers.getRequestFromEvent(event);
    request.user = user;

    const handler = new Handler(handlerArgs);
    handler.get = jest.fn();

    handler.handle(request, response);

    expect(handler.get).toHaveBeenCalledWith(
      user,
      loadtestId,
      metricName,
      response
    );
  });

  it("calls this.get when httpMethod is GET and no metric name provided in path", () => {
    const loadtestId = uuid.v4();
    const event = buildLambdaRequest("GET", "/metrics", `${loadtestId}`, {
      TestField: 1,
    });
    const user = auth.getUserFromEvent(event);
    const request = helpers.getRequestFromEvent(event);
    request.user = user;

    const handler = new Handler(handlerArgs);
    handler.get = jest.fn();

    handler.handle(request, response);

    expect(handler.get).toHaveBeenCalledWith(
      user,
      loadtestId,
      "ResponseTime",
      response
    );
  });

  it("calls this.post when httpMethod is POST", () => {
    const loadtestId = uuid.v4();
    const metricName = uuid.v4();
    const payload = {
      TestField: 1,
    };
    const event = buildLambdaRequest(
      "POST",
      "/metrics",
      `${loadtestId}/${metricName}`,
      payload
    );
    const user = auth.getUserFromEvent(event);
    const request = helpers.getRequestFromEvent(event);
    request.user = user;

    const handler = new Handler(handlerArgs);
    handler.post = jest.fn();

    handler.handle(request, response);

    expect(handler.post).toHaveBeenCalledWith(
      user,
      loadtestId,
      metricName,
      { ...payload },
      response
    );
  });

  it("calls this.post when httpMethod is POST and no metric name provided in route", () => {
    const loadtestId = uuid.v4();
    const payload = {
      TestField: 1,
    };
    const event = buildLambdaRequest(
      "POST",
      "/metrics",
      `${loadtestId}`,
      payload
    );
    const user = auth.getUserFromEvent(event);
    const request = helpers.getRequestFromEvent(event);
    request.user = user;

    const handler = new Handler(handlerArgs);
    handler.post = jest.fn();

    handler.handle(request, response);

    expect(handler.post).toHaveBeenCalledWith(
      user,
      loadtestId,
      "ResponseTime",
      { ...payload },
      response
    );
  });
});
