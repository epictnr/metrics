import {
  register,
  collectDefaultMetrics,
  Counter,
  CounterConfiguration,
  Gauge,
  GaugeConfiguration,
  Histogram,
  HistogramConfiguration,
} from 'prom-client'
import fetch from 'node-fetch'
import express, { Request, Response, Router } from 'express'
import expressRouter from 'express-promise-router'
import { Logger } from 'winston'
import {
  createRequestMetrics,
  MeasurableCallbackRequestHandler,
} from './requestMetrics'
import { PrometheusAggregator } from './prometheusAggregator'

export type ErrorCodeList = Array<number>

export interface Config {
  port: number
  collectDefaultMetricsInterval: number
  aggregateHosts: Array<string>
  aggregateTimeout: number
  serviceName: string
  prometheusAggregatorUrl?: string
  pushMetricsInterval?: number
  errorResponseCode?: ErrorCodeList|number
  debug?: boolean
}

export class Metrics {
  private port: number
  private collectDefaultMetricsInterval: number
  private aggregateHosts: Array<string>
  private aggregateTimeout: number
  private prefix: string
  private serviceName: string
  private logger: Logger
  private prometheusAggregator?: PrometheusAggregator
  private pushMetricsInterval: number = 5000
  private errorResponseCode: ErrorCodeList = [500]
  private interval?: NodeJS.Timer

  constructor (config: Config, logger: Logger) {
    this.port = config.port
    this.collectDefaultMetricsInterval = config.collectDefaultMetricsInterval
    this.aggregateHosts = config.aggregateHosts
    this.aggregateTimeout = config.aggregateTimeout
    this.serviceName = config.serviceName
    this.logger = logger

    if (config.pushMetricsInterval) {
      this.pushMetricsInterval = config.pushMetricsInterval
    }

    if (config.errorResponseCode) {
      this.errorResponseCode = config.errorResponseCode instanceof Array
        ? config.errorResponseCode
        : [config.errorResponseCode]
    }

    if (config.prometheusAggregatorUrl) {
      this.prometheusAggregator = new PrometheusAggregator({
        url: config.prometheusAggregatorUrl,
        debug: config.debug,
      })
    }

    this.prefix = ''
  }

  private preparePrefixName (unitName: string): string {
    return unitName.split('-').join('_')
  }

  start (unitName: string): void {
    this.prefix = this.preparePrefixName(`${this.serviceName}_${unitName}__`)

    const port = this.port
    const collectInterval = this.collectDefaultMetricsInterval

    const app = express()

    app.get('/metrics', (request: Request, response: Response) => {
      response.set('Content-Type', register.contentType)
      response.end(register.metrics())
    })

    app.listen(port)

    collectDefaultMetrics({ timeout: collectInterval, prefix: this.prefix })
  }

  startMaster (unitName: string): void {
    this.prefix = this.preparePrefixName(`${this.serviceName}_${unitName}__`)

    const collectInterval = this.collectDefaultMetricsInterval

    this.logger.info(`[Metrics] Starting the master collection of metrics ${unitName}, the metrics are available on /metrics`)

    collectDefaultMetrics({ timeout: collectInterval, prefix: this.prefix })
  }

  getPrefix (): string {
    return this.prefix
  }

  getMasterRouter (): Router {
    const router = expressRouter()

    router.get('/metrics', async (request: Request, response: Response) => {
      const metrics = [register.metrics()]

      const port = this.port
      const aggregateHosts = this.aggregateHosts
      const aggregateTimeout = this.aggregateTimeout

      await Promise.all(aggregateHosts.map(async (host: string) => {
        try {
          const response = await fetch(`http://${host}:${port}/metrics`,
            {
              method: 'get',
              timeout: aggregateTimeout,
            },
          )
          const responseMetrics = await response.text()

          metrics.push(responseMetrics)
        } catch (error) {
          this.logger.error(`[Metrics] Collection metrics error ${error.stack}`)
        }

        return host
      }))

      response.set('Content-Type', register.contentType)
      response.end(metrics.join('\n'))
    })

    return router
  }

  createCounter (configuration: CounterConfiguration): Counter {
    return new Counter(configuration)
  }

  createGauge (configuration: GaugeConfiguration): Gauge {
    return new Gauge(configuration)
  }

  createHistogram (configuration: HistogramConfiguration): Histogram {
    return new Histogram(configuration)
  }

  createRequestMetrics (): MeasurableCallbackRequestHandler {
    return createRequestMetrics(this)
  }

  isResponseCodeError (code: number): boolean {
    return this.errorResponseCode.includes(code)
  }

  stop (): void {
    this.interval && clearInterval(this.interval)
  }

  pushMetrics (): void {
    this.interval = setInterval(() => {
      this.prometheusAggregator && this.prometheusAggregator.sendMetrics(register.metrics())
    }, this.pushMetricsInterval)
  }
}
