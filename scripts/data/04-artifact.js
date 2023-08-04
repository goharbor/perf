// prepare artifacts
import { SharedArray } from 'k6/data'
import { Rate } from 'k6/metrics'
import counter from 'k6/x/counter'
import { Harbor, ContentStore } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectName, getRepositoryName, getArtifactTag, retry } from '../helpers.js'

const settings = Settings()

const totalIterations = settings.ProjectsCount * settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository

const store = new ContentStore('data')

const allBlobs = new SharedArray('allBlobs', function () {
    return store.generateMany(settings.BlobSize, totalIterations * settings.BlobsCountPerArtifact)
})

const refs = new SharedArray('refs', function () {
    const arr = []
    for (let i = 0; i < settings.ProjectsCount; i++) {
        const projectName = getProjectName(settings, i)

        const refs = []

        for (let j = 0; j < settings.RepositoriesCountPerProject; j++) {
            const repositoryName = getRepositoryName(settings, j)

            for (let k = 0; k < settings.ArtifactsCountPerRepository; k++) {
                refs.push(`${projectName}/${repositoryName}:${getArtifactTag(settings, k)}`)
            }
        }

        arr.push(refs)
    }

    const artifactsPerProject = settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository

    const results = []
    for (let i = 0; i < artifactsPerProject; i++) {
        for (let j = 0; j < arr.length; j++) {
            results.push(arr[j][i])
        }
    }

    return results
})

export let successRate = new Rate('success')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    teardownTimeout: '6h',
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
    const i = counter.up() - 1

    const ref = refs[i]

    const blobs = []
    for (let j = 0; j < settings.BlobsCountPerArtifact; j++) {
        blobs.push(allBlobs[i * settings.BlobsCountPerArtifact + j])
    }

    try {
        retry(() => harbor.push({ ref, store, blobs }))
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}

export function teardown() {
    store.free()
}
