class Handler {
  constructor({ organisations, loadtests, loadtestMetrics, Metrics }) {
    const organisationsTableName = "organisations";
    const loadtestsTableName = "loadtests";
    const loadtestMetricsTableName = "loadtest_metrics";

    if (
      !organisations ||
      organisations.getConfig().tableName != organisationsTableName
    ) {
      throw new Error(
        `Constructor expects '${organisationsTableName}' table passed. The passed table name does not match '${organisationsTableName}'.`
      );
    }

    if (!loadtests || loadtests.getConfig().tableName != loadtestsTableName) {
      throw new Error(
        `Constructor expects '${loadtestsTableName}' table passed. The passed table name does not match '${loadtestsTableName}'.`
      );
    }

    if (
      !loadtestMetrics ||
      loadtestMetrics.getConfig().tableName != loadtestMetricsTableName
    ) {
      throw new Error(
        `Constructor expects '${loadtestMetricsTableName}' table passed. The passed table name does not match '${loadtestMetricsTableName}'.`
      );
    }

    if (!Metrics) {
      throw new Error("Metrics not passed.");
    }

    this.organisations = organisations;
    this.loadtests = loadtests;
    this.loadtestMetrics = loadtestMetrics;
    this.Metrics = Metrics;
  }

  handle = async (request, response) => {
    try {
      const loadtestId = request.getPathParamAtIndex(0, "");
      const metricName = request.getPathParamAtIndex(1, "ResponseTime");
      if (request.httpMethod == "GET") {
        await this.get(request.user, loadtestId, metricName, response);
      } else if (request.httpMethod == "POST") {
        await this.post(
          request.user,
          loadtestId,
          metricName,
          request.body,
          response
        );
      } else {
        response(500, "Not supported.");
      }
    } catch (err) {
      console.log(err);
      response(500, err);
    }
  };

  get = async (user, loadtestId, metricName, response) => {
    try {
      const data = await this.getLoadtest(user, loadtestId);
      if (!data) {
        response(401, "Unauthorized");
      }

      try {
        const fromDB = await this.getFromDB(loadtestId, metricName);
        if (fromDB == null) {
          const fromCW = await this.getFromCW(data, metricName);
          console.log("returned from CW");
          response(200, fromCW);
        } else {
          console.log("returned from DB");
          response(200, { ...fromDB.MetricsData, UpdatedAt: fromDB.UpdatedAt });
        }
      } catch (exc) {
        console.log(exc);
        response(500, "Internal server error.");
      }
    } catch (errGetLoadtest) {
      console.log(errGetLoadtest);
      response(401, "Unauthorized");
    }
  };

  post = async (user, loadtestId, metricName, data, response) => {
    try {
      const orgData = await this.organisations.query({
        indexName: "UserOrganisations",
        hashKey: user.id,
      });
      const orgId = orgData.Items[0].OrganisationId;
      const loadtestData = await this.loadtests.get({
        hashKey: orgId,
        sortKey: loadtestId,
      });
      const loadtest = loadtestData.Item;
      if (loadtest && loadtest != null) {
        await this.loadtestMetrics.create({
          hashKey: loadtestId,
          sortKey: metricName,
          record: {
            Data: data,
          },
        });
        response(201, "Created");
      }
    } catch (err) {
      console.log(err);
      response(500, "Internal server error");
    }
  };

  getLoadtest = async (user, loadtestId) => {
    const orgData = await this.organisations.query({
      indexName: "UserOrganisations",
      hashKey: user.id,
    });
    if (orgData.Items.length == 0) {
      throw new Error("Organisation not found.");
    } else {
      const orgId = orgData.Items[0].OrganisationId;
      const loadtestData = await this.loadtests.get({
        hashKey: orgId,
        sortKey: loadtestId,
      });
      return "Item" in loadtestData ? loadtestData.Item : null;
    }
  };

  getFromDB = async (loadtestId, metricName) => {
    try {
      const loadtestMetricsData = await this.loadtestMetrics.get({
        hashKey: loadtestId,
        sortKey: metricName,
      });
      if (loadtestMetricsData && "Item" in loadtestMetricsData) {
        return loadtestMetricsData.Item;
      } else {
        return null;
      }
    } catch (exc) {
      console.log(exc);
      throw new Error(exc);
    }
  };

  getFromCW = async (loadtest, metricName) => {
    try {
      const params = this.Metrics.generateGetMetricsDataParamsForLoadtest(
        loadtest,
        metricName
      );
      const metricsData = await this.Metrics.getMetricsData(params);
      metricsData["Source"] = "CW";
      return metricsData;
    } catch (exc2) {
      console.log(exc2);
      throw new Error(exc2);
    }
  };
}

exports.Handler = Handler;
