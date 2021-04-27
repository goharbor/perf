import { textSummary } from './k6-summary.js'
import { getEnvBool } from './config.js'

export function generateSummary(desc) {
  return (data) => {
    const result = {
      'stdout': '\n\n' + textSummary(data, { indent: ' ', enableColors: getEnvBool('K6_ENABLE_COLORS', 'true') }) + '\n\n',
    }

    if (getEnvBool('HARBOR_REPORT', 'false')) {
      const summary = {
        'description': desc,
        'avg': toHumanSeconds(data['metrics']['iteration_duration']['values']['avg']),
        'min': toHumanSeconds(data['metrics']['iteration_duration']['values']['min']),
        'med': toHumanSeconds(data['metrics']['iteration_duration']['values']['med']),
        'max': toHumanSeconds(data['metrics']['iteration_duration']['values']['max']),
        'p90': toHumanSeconds(data['metrics']['iteration_duration']['values']['p(90)']),
        'p95': toHumanSeconds(data['metrics']['iteration_duration']['values']['p(95)']),
        'successRate': toHumanRate(data['metrics']['success']['values']['rate'])
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
