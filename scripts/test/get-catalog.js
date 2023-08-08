// test the performance for v2 catalog API
import { SharedArray } from 'k6/data'
import { Rate } from 'k6/metrics'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectName, getRepositoryName, randomItem, randomIntBetween } from '../helpers.js'
import { generateSummary } from '../report.js'

const settings = Settings()

const repositories = new SharedArray('repositories', function () {
    const results = []

    for (let i = 0; i < settings.ProjectsCount; i++) {
        for (let j = 0; j < settings.RepositoriesCountPerProject; j++) {
            results.push(`${getProjectName(settings, i)}/${getRepositoryName(settings, j)}`)
        }
    }

    return results
});

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

export default function () {
    const n = randomIntBetween(1, repositories.length)
    const last = randomItem(repositories)

    try {
        harbor.getCatalog({ n, last })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}

export function handleSummary(data) {
    return generateSummary('get-catalog')(data)
}