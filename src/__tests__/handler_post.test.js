const uuid = require("uuid");
const { Handler } = require("../handler");
const {
  mockTable,
  getPromiseWithReturnValue,
  getPromiseWithReject,
  mockMetrics,
} = require("./helpers");

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

describe("Handler.post", () => {
  beforeEach(() => {
    Table.mockClear();
  });

  it("returns 500 when organisations throws an error", async () => {
    organisations.getBySecondaryIndex.mockImplementation(() =>
      getPromiseWithReject("This is my error")
    );

    const user = { id: uuid.v4() };
    const handler = new Handler(handlerArgs);
    await handler.post(user, uuid.v4(), uuid.v4(), {}, response);

    expect(organisations.getBySecondaryIndex).toHaveBeenCalledWith(
      "UserOrganisations",
      user.id
    );
    expect(response).toHaveBeenCalledWith(500, "Internal server error");
  });

  it("returns 500 when loadtests throws an error", async () => {
    const loadtestId = uuid.v4();
    const orgsData = { Items: [{ OrganisationId: uuid.v4() }] };
    organisations.getBySecondaryIndex.mockReturnValue(
      getPromiseWithReturnValue(orgsData)
    );
    loadtests.get.mockImplementation(() =>
      getPromiseWithReject("This is my error")
    );

    const user = { id: uuid.v4() };
    const handler = new Handler(handlerArgs);
    await handler.post(user, loadtestId, uuid.v4(), {}, response);

    expect(loadtests.get).toHaveBeenCalledWith(
      orgsData.Items[0].OrganisationId,
      loadtestId
    );
    expect(response).toHaveBeenCalledWith(500, "Internal server error");
  });

  it("calls create on organisations, loadtests and loadtestMetrics", async () => {
    const loadtestId = uuid.v4();
    const metricName = uuid.v4();
    const data = { test: uuid.v4() };
    const orgsData = { Items: [{ OrganisationId: uuid.v4() }] };
    const loadtestData = { Item: {} };
    organisations.getBySecondaryIndex.mockReturnValue(
      getPromiseWithReturnValue(orgsData)
    );
    loadtests.get.mockReturnValue(getPromiseWithReturnValue(loadtestData));

    const user = { id: uuid.v4() };
    const handler = new Handler(handlerArgs);
    await handler.post(user, loadtestId, metricName, data, response);

    expect(organisations.getBySecondaryIndex).toHaveBeenCalledWith(
      "UserOrganisations",
      user.id
    );
    expect(loadtests.get).toHaveBeenCalledWith(
      orgsData.Items[0].OrganisationId,
      loadtestId
    );
    expect(loadtestMetrics.create).toHaveBeenCalledWith(
      loadtestId,
      metricName,
      {
        Data: data,
      }
    );
    expect(response).toHaveBeenCalledWith(201, "Created");
  });
});
