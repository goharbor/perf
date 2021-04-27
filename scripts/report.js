import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { getEnv } from './config.js';

export function generateSummary(desc) {
    return (data) => {
        let result = {
            'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        }

        if (getEnv('HARBOR_REPORT', false) === false) {
            return result
        }

        let summary = {
            'description': desc,
            'avg': toHumanSeconds(data['metrics']['iteration_duration']['values']['avg']),
            'min': toHumanSeconds(data['metrics']['iteration_duration']['values']['min']),
            'med': toHumanSeconds(data['metrics']['iteration_duration']['values']['med']),
            'max': toHumanSeconds(data['metrics']['iteration_duration']['values']['max']),
            'p90': toHumanSeconds(data['metrics']['iteration_duration']['values']['p(90)']),
            'p95': toHumanSeconds(data['metrics']['iteration_duration']['values']['p(95)']),
            'successRate': toHumanRate(data['metrics']['success']['values']['rate'])
        }
        let filename = `./outputs/${desc}.summary.json`
        result[filename] = JSON.stringify(summary)
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