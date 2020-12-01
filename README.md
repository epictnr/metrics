epictnr metrics
======

Сбор метрик в формате prometheus с несольких node инстансов

### Для публикации пакета:

```bash
npm pub
```


### Init example:

```js
const acmeMetrics = require('@epictnr/metrics')
const logger = require('../logger')

const metricsConfig = {
  logger: logger,
  port: 8080,
  aggregateHosts: [
    'acme-service-sync-spendings-worker',
    'acme-service-webhooks'
  ],
  aggregateTimeout: 2000, //ms
  collectDefaultMetricsInterval: 5000 // ms
}

const metrics = acmeMetrics(metricsConfig)
```

### Api worker:

```js
const metrics = require('../app/metrics')

app.use('/', metrics.getMasterRouter())

metrics.startMaster('api')

process.on('SIGINT', () => {
  metrics.stop()
})
```

### Other workers:

```js
const metrics = require('../app/metrics')

metrics.start('webhooks')

process.on('SIGINT', () => {
  metrics.stop()
})
```

### Raml schema:

```bash
/metrics:
  get:
    description: Get application metrics
    body:
      text/plain:
        example: |
          # HELP api_process_cpu_user_seconds_total Total user CPU time spent in seconds.
          # TYPE api_process_cpu_user_seconds_total counter
          api_process_cpu_user_seconds_total 0.6500000000000001 1551965298565
    responses:
      200:
```
