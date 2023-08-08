// test the performance for the list artifact tags API
import { SharedArray } from 'k6/data'
import { Rate } from 'k6/metrics'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectName, getRepositoryName, getArtifactTag, randomItem } from '../helpers.js'
import { generateSummary } from '../report.js'

const settings = Settings()

const artifacts = new SharedArray('artifacts', function () {
    const results = []

    for (let i = 0; i < settings.ProjectsCount; i++) {
        for (let j = 0; j < settings.RepositoriesCountPerProject; j++) {
            for (let k = 0; k < settings.ArtifactsCountPerRepository; k++) {
                results.push({
                    projectName: getProjectName(settings, i),
                    repositoryName: getRepositoryName(settings, j),
                    reference: getArtifactTag(settings, k),
                })
            }
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
    const a = randomItem(artifacts)

    const params = {
        withSignature: true,
        withImmutableStatus: true,
    }

    try {
        harbor.listArtifactTags(a.projectName, a.repositoryName, a.reference, params)
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}

export function handleSummary(data) {
    return generateSummary('list-artifact-tags')(data)
}