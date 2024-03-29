const uuid = require("uuid");
const { Handler } = require("../handler");
const {
  mockTable,
  getPromiseWithReturnValue,
  getPromiseWithReject,
  mockMetrics,
} = require("./helpers");

const { Table } = require("@moggiez/moggies-db");
jest.mock("@moggiez/moggies-db");

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

describe("Handler.post", () => {
  beforeEach(() => {
    Table.mockClear();
  });

  it("returns 500 when organisations throws an error", async () => {
    organisations.query.mockImplementation(() =>
      getPromiseWithReject("This is my error")
    );

    const user = { id: uuid.v4() };
    const handler = new Handler(handlerArgs);
    await handler.post(user, uuid.v4(), uuid.v4(), {}, response);

    expect(organisations.query).toHaveBeenCalledWith({
      indexName: "UserOrganisations",
      hashKey: user.id,
    });
    expect(response).toHaveBeenCalledWith(500, "Internal server error");
  });

  it("returns 500 when loadtests throws an error", async () => {
    const loadtestId = uuid.v4();
    const orgsData = { Items: [{ OrganisationId: uuid.v4() }] };
    organisations.query.mockReturnValue(getPromiseWithReturnValue(orgsData));
    loadtests.get.mockImplementation(() =>
      getPromiseWithReject("This is my error")
    );

    const user = { id: uuid.v4() };
    const handler = new Handler(handlerArgs);
    await handler.post(user, loadtestId, uuid.v4(), {}, response);

    expect(loadtests.get).toHaveBeenCalledWith({
      hashKey: orgsData.Items[0].OrganisationId,
      sortKey: loadtestId,
    });
    expect(response).toHaveBeenCalledWith(500, "Internal server error");
  });

  it("calls create on organisations, loadtests and loadtestMetrics", async () => {
    const loadtestId = uuid.v4();
    const metricName = uuid.v4();
    const data = { test: uuid.v4() };
    const orgsData = { Items: [{ OrganisationId: uuid.v4() }] };
    const loadtestData = { Item: {} };
    organisations.query.mockReturnValue(getPromiseWithReturnValue(orgsData));
    loadtests.get.mockReturnValue(getPromiseWithReturnValue(loadtestData));

    const user = { id: uuid.v4() };
    const handler = new Handler(handlerArgs);
    await handler.post(user, loadtestId, metricName, data, response);

    expect(organisations.query).toHaveBeenCalledWith({
      indexName: "UserOrganisations",
      hashKey: user.id,
    });
    expect(loadtests.get).toHaveBeenCalledWith({
      hashKey: orgsData.Items[0].OrganisationId,
      sortKey: loadtestId,
    });
    expect(loadtestMetrics.create).toHaveBeenCalledWith({
      hashKey: loadtestId,
      sortKey: metricName,
      record: {
        Data: data,
      },
    });
    expect(response).toHaveBeenCalledWith(201, "Created");
  });
});
