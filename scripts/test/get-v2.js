// test the performance for v2 API
import { Rate } from 'k6/metrics'
import http from 'k6/http'
import { generateSummary } from '../report.js'

import { Settings } from '../config.js'

const settings = Settings()

export let successRate = new Rate('success')

export let options = {
    insecureSkipTLSVerify: true,
    setupTimeout: '6h',
    duration: '24h',
    vus: 500,
    iterations: 1000,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export default function () {
    try {
        const url = `${settings.Harbor.scheme}://${settings.Harbor.host}/v2/`
        const resp = http.get(url)
        if (resp.status === 200 || resp.status === 401) {
            successRate.add(true)
        } else {
            console.error(`unexpected http status code: ${resp.status}, body: ${resp.body}`)
            successRate.add(false)
        }
    } catch (e) {
        successRate.add(false)
        console.error(e)
    }
}

export function handleSummary(data) {
    return generateSummary('get-v2')(data)
}