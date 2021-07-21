const { Handler } = require("../handler");
const { mockTable, mockMetrics } = require("./helpers");

describe("Handler.constructor", () => {
  it("should validate organisations arg has correct value", () => {
    const organisations = mockTable({ tableName: "unknown" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();
    expect(
      () => new Handler({ organisations, loadtests, loadtestMetrics, Metrics })
    ).toThrow(
      "Constructor expects 'organisations' table passed. The passed table name does not match 'organisations'."
    );
    expect(
      () =>
        new Handler({
          organisations: undefined,
          loadtests,
          loadtestMetrics,
          Metrics,
        })
    ).toThrow(
      "Constructor expects 'organisations' table passed. The passed table name does not match 'organisations'."
    );
    expect(
      () =>
        new Handler({
          organisations: null,
          loadtests,
          loadtestMetrics,
          Metrics,
        })
    ).toThrow(
      "Constructor expects 'organisations' table passed. The passed table name does not match 'organisations'."
    );
  });

  it("should validate loadtests arg has correct value", () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "anotherValue" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();
    expect(
      () => new Handler({ organisations, loadtests, loadtestMetrics, Metrics })
    ).toThrow(
      "Constructor expects 'loadtests' table passed. The passed table name does not match 'loadtests'."
    );
    expect(
      () =>
        new Handler({
          organisations,
          loadtests: undefined,
          loadtestMetrics,
          Metrics,
        })
    ).toThrow(
      "Constructor expects 'loadtests' table passed. The passed table name does not match 'loadtests'."
    );
    expect(
      () =>
        new Handler({
          organisations,
          loadtests: null,
          loadtestMetrics,
          Metrics,
        })
    ).toThrow(
      "Constructor expects 'loadtests' table passed. The passed table name does not match 'loadtests'."
    );
  });

  it("should validate loadtestMetrics arg has correct value", () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "yetAnotherValue" });
    const Metrics = mockMetrics();
    expect(
      () => new Handler({ organisations, loadtests, loadtestMetrics, Metrics })
    ).toThrow(
      "Constructor expects 'loadtest_metrics' table passed. The passed table name does not match 'loadtest_metrics'."
    );
    expect(
      () =>
        new Handler({
          organisations,
          loadtests,
          loadtestMetrics: undefined,
          Metrics,
        })
    ).toThrow(
      "Constructor expects 'loadtest_metrics' table passed. The passed table name does not match 'loadtest_metrics'."
    );
    expect(
      () =>
        new Handler({
          organisations,
          loadtests,
          loadtestMetrics: null,
          Metrics,
        })
    ).toThrow(
      "Constructor expects 'loadtest_metrics' table passed. The passed table name does not match 'loadtest_metrics'."
    );
  });

  it("should validate Metrics arg has correct value", () => {
    const organisations = mockTable({ tableName: "organisations" });
    const loadtests = mockTable({ tableName: "loadtests" });
    const loadtestMetrics = mockTable({ tableName: "loadtest_metrics" });
    const Metrics = mockMetrics();
    expect(
      () =>
        new Handler({
          organisations,
          loadtests,
          loadtestMetrics,
          Metrics: undefined,
        })
    ).toThrow("Metrics not passed.");
    expect(
      () =>
        new Handler({
          organisations,
          loadtests,
          loadtestMetrics,
          Metrics: null,
        })
    ).toThrow("Metrics not passed.");
  });
});
