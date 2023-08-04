// prepare audit logs
import { SharedArray } from 'k6/data'
import { Rate } from 'k6/metrics'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectName, getRepositoryName, getArtifactTag, randomItem, retry } from '../helpers.js'

const settings = Settings()

const existsAuditLogsCount = settings.ProjectsCount +
    settings.ProjectsCount * settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository * settings.ArtifactTagsCountPerArtifact

const totalIterations = Math.max(1, settings.AuditLogsCount - existsAuditLogsCount)

let artifacts = new SharedArray('artifacts', function () {
    const results = []

    for (let i = 0; i < settings.ProjectsCount; i++) {

        for (let j = 0; j < settings.RepositoriesCountPerProject; j++) {

            for (let k = 0; k < settings.ArtifactsCountPerRepository; k++) {

                results.push({
                    projectName: getProjectName(settings, i),
                    repositoryName: getRepositoryName(settings, j),
                    tag: getArtifactTag(settings, k),
                })
            }
        }
    }

    return results
})

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus: Math.min(settings.VUS, totalIterations),
    iterations: totalIterations,
    thresholds: {
        'success': ['rate>=1'],
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

const harbor = new Harbor(settings.Harbor)

export default function () {
    const artifact = randomItem(artifacts)

    const ref = `${artifact.projectName}/${artifact.repositoryName}:${artifact.tag}`

    try {
        retry(() => harbor.getManifest(ref))
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}
