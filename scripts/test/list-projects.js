// test the performance for the list projects API
import { Rate } from 'k6/metrics'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { generateSummary } from '../report.js'

const settings = Settings()

export let successRate = new Rate('success')

export let options = {
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

const harbor = new Harbor(settings.Harbor)

export function setup() {
    const { total } = harbor.listProjects({ page: 1, pageSize: 1 })

    console.log(`total projects: ${total}`)

    return {
        projectsCount: total
    }
}

export default function ({ projectsCount }) {
    const pageSize = 15
    const pages = Math.ceil(projectsCount / pageSize)
    const page = Math.floor(Math.random() * pages) + 1

    try {
        harbor.listProjects({ page, pageSize })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}

export function handleSummary(data) {
    return generateSummary('list-projects')(data)
}