import { textSummary } from './k6-summary.js'
import { getEnvBool } from './config.js'

export function generateSummary(desc) {
  return (data) => {
    const result = {
      'stdout': '\n\n' + textSummary(data, { indent: ' ', enableColors: getEnvBool('K6_ENABLE_COLORS', 'true') }) + '\n\n',
    }

    if (getEnvBool('HARBOR_REPORT', 'false')) {
      const metric = 'iteration_duration{scenario:default}'

      const summary = {
        'timestamp': Date.now(),
        'description': desc,
        'avg': toHumanSeconds(data['metrics'][metric]['values']['avg']),
        'min': toHumanSeconds(data['metrics'][metric]['values']['min']),
        'med': toHumanSeconds(data['metrics'][metric]['values']['med']),
        'max': toHumanSeconds(data['metrics'][metric]['values']['max']),
        'p90': toHumanSeconds(data['metrics'][metric]['values']['p(90)']),
        'p95': toHumanSeconds(data['metrics'][metric]['values']['p(95)']),
        'successRate': toHumanRate(data['metrics']['success']['values']['rate']),
        'iterationsRate': `${data['metrics']['iterations']['values']['rate'].toFixed(2)}/s`
      }

      const filename = `./outputs/${desc}.summary.json`

      result[filename] = JSON.stringify(summary)
    }

    return result
  }
}

function toHumanSeconds(millseconds) {
  if (millseconds < 1000) {
    millseconds = Math.floor(millseconds * 100) / 100
    return `${millseconds}ms`
  }

  let seconds = Math.floor((millseconds / 1000) * 100) / 100
  return `${seconds}s`
}

function toHumanRate(rate) {
  let rat = Math.floor((rate * 100) * 100) / 100
  return `${rat}%`
}
