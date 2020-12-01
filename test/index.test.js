const metrics = require('../src')

describe('metrics', () => {
  test('init return object instance of Metrics', () => {
    const metricsTest = metrics()

    expect(metricsTest.constructor.name).toEqual('Metrics')
  })

  test('config not passed by reference', () => {
    const config = {}

    const metricsTest = metrics(config)

    expect(Object.is(config, metricsTest.config)).toBeFalsy()
  })

  test('config have default values', () => {
    const expectedConfig = {
      port: 8080,
      collectDefaultMetricsInterval: 5000,
      aggregateHosts: [],
      aggregateTimeout: 2000
    }

    const metricsTest = metrics()

    expect(metricsTest.config).toEqual(expectedConfig)
  })

  test('not passed logger corrected mocked', () => {
    const metricsTest = metrics()

    expect(metricsTest.logger.hasOwnProperty('info')).toBeTruthy()
    expect(metricsTest.logger.hasOwnProperty('error')).toBeTruthy()
  })
})
