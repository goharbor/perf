// test the performance for pushing artifacts to same project
import { Rate } from 'k6/metrics'
import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'
import { ContentStore } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectNames, randomItem } from '../helpers.js'
import { generateSummary } from '../report.js'

const settings = Settings()

const store = new ContentStore('data')

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    teardownTimeout: '6h',
    vus: 500,
    iterations: 1000,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
        'iteration_duration{group:::teardown}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)

    const blobsArr = []
    for (let i = 0; i < options.iterations; i++) {
        blobsArr.push(store.generateMany(settings.BlobSize, settings.BlobsCountPerArtifact))
    }

    return {
        blobsArr,
        projectName: randomItem(getProjectNames(settings)),
        repositoryName: `repository-${Date.now()}`
    }
}

export default function ({ blobsArr, projectName, repositoryName }) {
    const i = counter.up() - 1

    const ref = `${projectName}/${repositoryName}:tag-${i}`

    try {
        harbor.push({ ref, store, blobs: blobsArr[i] })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}

export function teardown({ projectName, repositoryName }) {
    store.free()

    harbor.deleteRepository(projectName, repositoryName)
}

export function handleSummary(data) {
    return generateSummary('push-artifacts-to-same-projects')(data)
}
