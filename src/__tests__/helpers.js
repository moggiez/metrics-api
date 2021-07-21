const uuid = require("uuid");
const { Table } = require("moggies-db");
const { Metrics } = require("moggies-metrics");
jest.mock("moggies-db");
jest.mock("moggies-metrics");

const mockAWSLib = () => {
  const mockGet = jest.fn();
  const mockQuery = jest.fn();
  const mockPut = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  const mockDocClient = class C {
    get = mockGet;
    query = mockQuery;
    put = mockPut;
    update = mockUpdate;
    mockDelete = mockDelete;
  };

  const mockAWS = {
    DynamoDB: {
      DocumentClient: mockDocClient,
    },
  };

  return { mockAWS, mockedFunctions: { get: mockGet } };
};

const lambdaRequestTemplate = {
  resource: "/{routeBase}/{proxy+}",
  path: "/{routeBase}/{path}",
  httpMethod: "{httpMetthod}",
  headers: {
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    Authorization:
      "eyJraWQiOiIrRnpZenpNblwva2d4b1QyNWdsaVNwbmtzc3lQTmZmcTQxTXRhQXc5am5SUT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJkZTMxNTBhYi1jZTFiLTQ5N2ItOTMzMy00MTQyMGNkZTkwOTEiLCJhdWQiOiIzcmNrbWQ3bTBicDJtbWFodTlpZWV2bGx1MCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjgyYTY0OWU4LWFlZDgtNDEzYy04YWY3LWE3NzhjMmQ5ZDdjMyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjIxMzU3OTM0LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9Od2VramFBTjEiLCJjb2duaXRvOnVzZXJuYW1lIjoiZGUzMTUwYWItY2UxYi00OTdiLTkzMzMtNDE0MjBjZGU5MDkxIiwiZXhwIjoxNjIxMzY3MTU3LCJpYXQiOjE2MjEzNjM1NTcsImVtYWlsIjoic3RhdnJldi5nZW9yZ2lAZ21haWwuY29tIn0.DcGBuGxG9zxdmUIR8t2tYCbLWxQ3uZsrK3jZkYMxmkNQ_uUJQMBJPC_FBbo08jhKrryDnrpd9yyfppgll0QQ37QXWdR-62dLUQM1qcWtulpWGDPdyGTj6t5AE4mcQneC0U2SLB_Ijz7AmPR2Ngxap4rwM6uMgHB105DEJXFurINLaYEoXBZnpExFllp15lo7g3vkQdiIz9QP92hgxDWDW3b81N6jEONPqKabCKLiFwXSrIHfADZjpt3fPgDmeHZ3A0vWd4fb0p3GV65PdUVssG0oDGdOeylKRSsoEvxNmzy3eRcp8mMR6iAPKaclgT6jTdaAt95RXzXkP9rnbaDMTA",
    "CloudFront-Forwarded-Proto": "https",
    "CloudFront-Is-Desktop-Viewer": "true",
    "CloudFront-Is-Mobile-Viewer": "false",
    "CloudFront-Is-SmartTV-Viewer": "false",
    "CloudFront-Is-Tablet-Viewer": "false",
    "CloudFront-Viewer-Country": "BG",
    Host: "api.moggies.io",
    "Postman-Token": "596e903f-c08a-43bc-95c7-f737cef66534",
    "User-Agent": "PostmanRuntime/7.28.0",
    Via: "1.1 a3fc5cd96d96dcf24c30f98236e9f2fc.cloudfront.net (CloudFront)",
    "X-Amz-Cf-Id": "j4rdBQbb1_H268uC7sz2McA54mpNfp58g1V7fOkU6TnnSaXQ0lcDow==",
    "X-Amzn-Trace-Id": "Root=1-60a40c95-1300d17d1038361e34dcd128",
    "X-Forwarded-For": "149.62.202.134, 52.46.56.137",
    "X-Forwarded-Port": "443",
    "X-Forwarded-Proto": "https",
  },
  multiValueHeaders: {
    Accept: ["*/*"],
    "Accept-Encoding": ["gzip, deflate, br"],
    Authorization: [
      "eyJraWQiOiIrRnpZenpNblwva2d4b1QyNWdsaVNwbmtzc3lQTmZmcTQxTXRhQXc5am5SUT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJkZTMxNTBhYi1jZTFiLTQ5N2ItOTMzMy00MTQyMGNkZTkwOTEiLCJhdWQiOiIzcmNrbWQ3bTBicDJtbWFodTlpZWV2bGx1MCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjgyYTY0OWU4LWFlZDgtNDEzYy04YWY3LWE3NzhjMmQ5ZDdjMyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjIxMzU3OTM0LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9Od2VramFBTjEiLCJjb2duaXRvOnVzZXJuYW1lIjoiZGUzMTUwYWItY2UxYi00OTdiLTkzMzMtNDE0MjBjZGU5MDkxIiwiZXhwIjoxNjIxMzY3MTU3LCJpYXQiOjE2MjEzNjM1NTcsImVtYWlsIjoic3RhdnJldi5nZW9yZ2lAZ21haWwuY29tIn0.DcGBuGxG9zxdmUIR8t2tYCbLWxQ3uZsrK3jZkYMxmkNQ_uUJQMBJPC_FBbo08jhKrryDnrpd9yyfppgll0QQ37QXWdR-62dLUQM1qcWtulpWGDPdyGTj6t5AE4mcQneC0U2SLB_Ijz7AmPR2Ngxap4rwM6uMgHB105DEJXFurINLaYEoXBZnpExFllp15lo7g3vkQdiIz9QP92hgxDWDW3b81N6jEONPqKabCKLiFwXSrIHfADZjpt3fPgDmeHZ3A0vWd4fb0p3GV65PdUVssG0oDGdOeylKRSsoEvxNmzy3eRcp8mMR6iAPKaclgT6jTdaAt95RXzXkP9rnbaDMTA",
    ],
    "CloudFront-Forwarded-Proto": ["https"],
    "CloudFront-Is-Desktop-Viewer": ["true"],
    "CloudFront-Is-Mobile-Viewer": ["false"],
    "CloudFront-Is-SmartTV-Viewer": ["false"],
    "CloudFront-Is-Tablet-Viewer": ["false"],
    "CloudFront-Viewer-Country": ["BG"],
    Host: ["api.moggies.io"],
    "Postman-Token": ["596e903f-c08a-43bc-95c7-f737cef66534"],
    "User-Agent": ["PostmanRuntime/7.28.0"],
    Via: ["1.1 a3fc5cd96d96dcf24c30f98236e9f2fc.cloudfront.net (CloudFront)"],
    "X-Amz-Cf-Id": ["j4rdBQbb1_H268uC7sz2McA54mpNfp58g1V7fOkU6TnnSaXQ0lcDow=="],
    "X-Amzn-Trace-Id": ["Root=1-60a40c95-1300d17d1038361e34dcd128"],
    "X-Forwarded-For": ["149.62.202.134, 52.46.56.137"],
    "X-Forwarded-Port": ["443"],
    "X-Forwarded-Proto": ["https"],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: {
    proxy: "default",
  },
  stageVariables: null,
  requestContext: {
    resourceId: "49wnou",
    authorizer: {
      claims: {
        sub: "de3150ab-ce1b-497b-9333-41420cde9091",
        aud: "3rckmd7m0bp2mmahu9ieevllu0",
        email_verified: "true",
        event_id: "82a649e8-aed8-413c-8af7-a778c2d9d7c3",
        token_use: "id",
        auth_time: "1621357934",
        iss: "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_NwekjaAN1",
        "cognito:username": "de3150ab-ce1b-497b-9333-41420cde9091",
        exp: "Tue May 18 19:45:57 UTC 2021",
        iat: "Tue May 18 18:45:57 UTC 2021",
        email: "stavrev.georgi@gmail.com",
      },
    },
    resourcePath: "/{routeBase}/{proxy+}",
    httpMethod: "GET",
    extendedRequestId: "fibnYHc5DoEF3VQ=",
    requestTime: "18/May/2021:18:51:01 +0000",
    path: "/{routeBase}/{path}",
    accountId: "989665778089",
    protocol: "HTTP/1.1",
    stage: "green",
    domainPrefix: "api",
    requestTimeEpoch: 1621363861513,
    requestId: "{requestId}",
    identity: {
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      sourceIp: "149.62.202.134",
      principalOrgId: null,
      accessKey: null,
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent: "Tests",
      user: null,
    },
    domainName: "api.moggies.io",
    apiId: "khwdib6xn4",
  },
  body: null,
  isBase64Encoded: false,
};

const buildLambdaRequest = (httpMethod, routeBase, path, payload) => {
  const result = { ...lambdaRequestTemplate };
  result.requestId = uuid.v4();
  result.httpMethod = httpMethod;
  result.requestContext.httpMethod = result.httpMethod;
  result.resource = `/${routeBase}/{proxy+}`;
  result.requestContext.resourcePath = result.resource;
  if (path) {
    result.pathParameters.proxy = path;
    result.path = `/${routeBase}/${path}`;
  } else {
    result.path = `/${routeBase}`;
    result.requestContext.path = result.path;
  }

  result.body = JSON.stringify(payload);

  return result;
};

const mockTable = (config) => {
  const mockConfig = config || {};
  const { mockAWS, _ } = mockAWSLib();

  const table = new Table({ config: mockConfig, AWS: mockAWS });
  table.getConfig.mockReturnValue(mockConfig);
  return table;
};

const mockMetrics = () => {
  const cw = {
    getMetricData: (params, callback) => callback(null, "Success"),
  };
  return new Metrics(cw);
};

const getPromiseWithReturnValue = (returnValue) => {
  return Promise.resolve(returnValue);
};

const getPromiseWithReject = (err) => {
  return Promise.reject(err);
};

exports.mockAWSLib = mockAWSLib;
exports.mockMetrics = mockMetrics;
exports.mockTable = mockTable;
exports.getPromiseWithReturnValue = getPromiseWithReturnValue;
exports.getPromiseWithReject = getPromiseWithReject;
exports.buildLambdaRequest = buildLambdaRequest;
