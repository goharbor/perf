// test the performance for the list users API
import { Rate } from 'k6/metrics'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'

const settings = Settings()

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '24h',
    teardownTimeout: '1h',
    noUsageReport: true,
    vus: 500,
    iterations: 1000,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)

    const { total } = harbor.listUsers({ page: 1, pageSize: 1 })

    console.log(`total users: ${total}`)

    return {
        usersCount: total
    }
}

export default function ({ usersCount }) {
    const pageSize = 15
    const pages = Math.ceil(usersCount / pageSize)
    const page = Math.floor(Math.random() * pages) + 1

    try {
        harbor.listUsers({ page, pageSize })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}
