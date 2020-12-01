import onFinished from 'on-finished'
import { Metrics } from './metrics'
import { Histogram, Counter } from 'prom-client'
import { Response, Request } from 'express'

export interface RequestMetricsParams {
  name: string
}

export function createRequestMetrics (metrics: Metrics) {
  let duration: Histogram
  let errors: Counter

  return (action: Function, params: RequestMetricsParams) => {
    const observeRequestTime = () => {
      const methodName = params.name

      if (!duration) {
        const metricsName = `${metrics.getPrefix()}req_duration_ms`

        duration = metrics.createHistogram({
          name: metricsName,
          help: `Duration of HTTP requests in ms`,
          labelNames: ['route_name'],
          buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500, 700, 900, 1200], // buckets for response time from 0.1ms to 1200ms
        })
      }

      const startTime = Date.now()

      return () => {
        const endTime = Date.now()
        const responseTimeInMs = endTime - startTime

        duration.observe({ 'route_name': methodName }, responseTimeInMs)
      }
    }

    const countErrorResponse = () => {
      return (throwError: any, response: Response) => {
        const methodName = params.name

        if (!errors) {
          const metricsName = `${metrics.getPrefix()}req_errors`

          errors = metrics.createCounter({
            name: metricsName,
            help: `Error count of HTTP requests`,
            labelNames: ['route_name'],
          })
        }

        if (response.statusCode === 500) {
          errors.inc({ 'route_name': methodName })
        }
      }
    }

    return async (request: Request, response: Response) => {
      onFinished(response, observeRequestTime())
      onFinished(response, countErrorResponse())

      await action(request, response)
    }
  }
}
