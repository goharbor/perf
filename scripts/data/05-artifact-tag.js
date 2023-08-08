// prepare artifact tags
import { SharedArray } from 'k6/data'
import { Rate } from 'k6/metrics'
import counter from 'k6/x/counter'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { getProjectName, getRepositoryName, getArtifactTag, getArtifactNewTag, retry } from '../helpers.js'

const settings = Settings()

const newTagsPerProject = settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository * (settings.ArtifactTagsCountPerArtifact - 1)

const totalIterations = settings.ProjectsCount * newTagsPerProject

let newTags = new SharedArray('newTags', function () {
    const arr = []

    for (let i = 0; i < settings.ProjectsCount; i++) {
        const chunk = []

        for (let j = 0; j < settings.RepositoriesCountPerProject; j++) {

            for (let k = 0; k < settings.ArtifactsCountPerRepository; k++) {

                for (let l = 0; l < settings.ArtifactTagsCountPerArtifact - 1; l++) {
                    chunk.push({
                        projectName: getProjectName(settings, i),
                        repositoryName: getRepositoryName(settings, j),
                        tag: getArtifactTag(settings, k),
                        newTag: getArtifactNewTag(settings, k, l)
                    })
                }
            }
        }

        arr.push(chunk)
    }

    const results = []
    for (let i = 0; i < newTagsPerProject; i++) {
        for (let j = 0; j < arr.length; j++) {
            results.push(arr[j][i])
        }
    }

    return results
});


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
    const i = counter.up() - 1

    const t = newTags[i]

    try {
        retry(() => harbor.createArtifactTag(t.projectName, t.repositoryName, t.tag, t.newTag))
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}
