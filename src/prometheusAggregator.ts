import fetch from 'node-fetch'
import { Logger } from 'winston'

export interface Config {
  url: string
  debug?: boolean
}

export class PrometheusAggregator {
  private url: string
  private logger: Logger | null
  private debug?: boolean

  constructor (config: Config, logger?: Logger) {
    this.url = config.url
    this.debug = config.debug
    this.logger = logger || null
  }

  private log (message: string) {
    this.debug && this.logger && this.logger.info(`[prometheus-aggregator] ${message}`)
  }

  async sendMetrics (registry: string): Promise<void> {
    this.log(`send request ${this.url}, \n body: ${registry}`)

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        timeout: 10 * 1000,
        body: registry,
      })

      if (!response.ok) {
        throw Error(`prometheus-aggregator bad response status: ${response.status}`)
      }
    } catch (err) {
      throw Error(`Send metrics error: ${err.message}`)
    }
  }
}
