const uuid = require("uuid");
const { Handler } = require("../handler");
const {
  mockTable,
  mockMetrics,
  getPromiseWithReturnValue,
  getPromiseWithReject,
} = require("./helpers");

const { Table } = require("@moggiez/moggies-db");
jest.mock("@moggiez/moggies-db");

const response = jest.fn();

describe("Handler.get", () => {
  beforeEach(() => {
    Table.mockClear();
  });

  it("returns 401 when organisation not found", async () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();

    // Arrange
    organisations.query.mockReturnValue(
      getPromiseWithReturnValue({ Items: [] })
    );
    const handler = new Handler({
      organisations,
      loadtests,
      loadtestMetrics,
      Metrics,
    });

    const metricName = "ResponseTime";
    const loadtestId = uuid.v4();
    const user = { id: uuid.v4() };
    await handler.get(user, loadtestId, metricName, response);

    expect(organisations.query).toHaveBeenCalledWith({
      indexName: "UserOrganisations",
      hashKey: user.id,
    });
    expect(response).toHaveBeenCalledWith(401, "Unauthorized");
  });

  it("returns 401 when loadtest not found", async () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();

    // Arrange
    const orgId = uuid.v4();
    const user = { id: uuid.v4() };
    organisations.query.mockReturnValue(
      getPromiseWithReturnValue({
        Items: [{ OrganisationId: orgId, UserId: user.id }],
      })
    );
    loadtests.get.mockReturnValue(getPromiseWithReturnValue({ Item: null }));
    const handler = new Handler({
      organisations,
      loadtests,
      loadtestMetrics,
      Metrics,
    });

    const metricName = "ResponseTime";
    const loadtestId = uuid.v4();
    await handler.get(user, loadtestId, metricName, response);

    expect(loadtests.get).toHaveBeenCalledWith({
      hashKey: orgId,
      sortKey: loadtestId,
    });
    expect(response).toHaveBeenCalledWith(401, "Unauthorized");
  });

  it("returns metrics from DB when present in DB", async () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();

    // Arrange
    const orgId = uuid.v4();
    const user = { id: uuid.v4() };
    const loadtestId = uuid.v4();
    const metricsDataItem = {
      MetricsData: { someField: uuid.v4() },
      UpdatedAt: uuid.v4(),
    };
    organisations.query.mockReturnValue(
      getPromiseWithReturnValue({
        Items: [{ OrganisationId: orgId, UserId: user.id }],
      })
    );
    loadtests.get.mockReturnValue(
      getPromiseWithReturnValue({ Item: { LoadtestId: loadtestId } })
    );
    loadtestMetrics.get.mockReturnValue(
      getPromiseWithReturnValue({ Item: metricsDataItem })
    );
    const handler = new Handler({
      organisations,
      loadtests,
      loadtestMetrics,
      Metrics,
    });

    const metricName = "ResponseTime";
    await handler.get(user, loadtestId, metricName, response);

    expect(loadtestMetrics.get).toHaveBeenCalledWith({
      hashKey: loadtestId,
      sortKey: metricName,
    });
    expect(response).toHaveBeenCalledWith(200, {
      ...metricsDataItem.MetricsData,
      UpdatedAt: metricsDataItem.UpdatedAt,
    });
  });

  it("returns metrics from CloudWatch when not present in DB", async () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();

    // Arrange
    const orgId = uuid.v4();
    const user = { id: uuid.v4() };
    const loadtestId = uuid.v4();
    const loadtestItem = { LoadtestId: loadtestId };
    const mockParams = { params: "yes" };
    const metricsDataItem = {
      MetricsData: { someField: uuid.v4() },
    };
    organisations.query.mockReturnValue(
      getPromiseWithReturnValue({
        Items: [{ OrganisationId: orgId, UserId: user.id }],
      })
    );
    loadtests.get.mockReturnValue(
      getPromiseWithReturnValue({ Item: loadtestItem })
    );
    loadtestMetrics.get.mockReturnValue(getPromiseWithReturnValue(null));
    Metrics.generateGetMetricsDataParamsForLoadtest.mockReturnValue(mockParams);
    Metrics.getMetricsData.mockReturnValue(
      getPromiseWithReturnValue(metricsDataItem)
    );
    const handler = new Handler({
      organisations,
      loadtests,
      loadtestMetrics,
      Metrics,
    });

    const metricName = "ResponseTime";
    await handler.get(user, loadtestId, metricName, response);

    expect(loadtestMetrics.get).toHaveBeenCalledWith({
      hashKey: loadtestId,
      sortKey: metricName,
    });
    expect(
      Metrics.generateGetMetricsDataParamsForLoadtest
    ).toHaveBeenCalledWith(loadtestItem, metricName);
    expect(Metrics.getMetricsData).toHaveBeenCalledWith(mockParams);
    expect(response).toHaveBeenCalledWith(200, metricsDataItem);
  });

  it("returns 500 when exception thrown", async () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();

    // Arrange
    const orgId = uuid.v4();
    const user = { id: uuid.v4() };
    const loadtestId = uuid.v4();
    const loadtestItem = { LoadtestId: loadtestId };
    organisations.query.mockReturnValue(
      getPromiseWithReturnValue({
        Items: [{ OrganisationId: orgId, UserId: user.id }],
      })
    );
    loadtests.get.mockReturnValue(
      getPromiseWithReturnValue({ Item: loadtestItem })
    );
    loadtestMetrics.get.mockImplementation(() => getPromiseWithReject());
    const handler = new Handler({
      organisations,
      loadtests,
      loadtestMetrics,
      Metrics,
    });

    const metricName = "ResponseTime";
    await handler.get(user, loadtestId, metricName, response);
    expect(response).toHaveBeenCalledWith(500, "Internal server error.");

    loadtestMetrics.get.mockReturnValue(getPromiseWithReturnValue(null));
    Metrics.generateGetMetricsDataParamsForLoadtest.mockImplementation(() =>
      getPromiseWithReject()
    );
    await handler.get(user, loadtestId, metricName, response);
    expect(response).toHaveBeenCalledWith(500, "Internal server error.");
  });
});
