Epictnr Metrics 🪣
======

Collect metrics from many NodeJS instances

### How to use

##### Init example:

```js
const acmeMetrics = require('@epictnr/metrics')
const logger = require('../logger')

const metricsConfig = {
  logger: logger,
  port: 8080,
  aggregateHosts: [
    'acme-service-sync-spending-worker',
    'acme-service-webhooks'
  ],
  aggregateTimeout: 2000, //ms
  collectDefaultMetricsInterval: 5000 // ms
}

const metrics = acmeMetrics(metricsConfig)
```

##### Api worker:

```js
const metrics = require('../app/metrics')

app.use('/', metrics.getMasterRouter())

metrics.startMaster('api')

process.on('SIGINT', () => {
  metrics.stop()
})
```

##### Other workers:

```js
const metrics = require('../app/metrics')

metrics.start('webhooks')

process.on('SIGINT', () => {
  metrics.stop()
})
```

##### OpenApi schema:

```bash
paths:
  /metrics:
    get:
      summary: Get application metrics
      responses:
        '200':
          description: Application metrics OpenMetrics\Prometheus format
          content:
            text/plain:
              example:
                # HELP api_process_cpu_user_seconds_total Total user CPU time spent in seconds.
                # TYPE api_process_cpu_user_seconds_total counter
                api_process_cpu_user_seconds_total 0.6500000000000001 1551965298565
```

### How to publish::

```bash
npm pub
```
