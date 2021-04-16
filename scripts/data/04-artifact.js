// prepare artifacts

import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'
import { ContentStore } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchProjects } from '../helpers.js'

const settings = Settings()

const totalIterations = settings.ProjectsCount * settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository

const store = new ContentStore('data')

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus:  Math.min(300, settings.ProjectsCount),
    iterations: totalIterations,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)

    const projects = fetchProjects(settings.ProjectsCount)

    const params = []
    for (const project of projects) {
        for (let i = 0; i < settings.RepositoriesCountPerProject; i++) {
            const s1 = `${i + 1}`.padStart(settings.RepositoriesCountPerProject.toString().length, '0')
            for (let j = 0; j < settings.ArtifactsCountPerRepository; j++) {
                const s2 = `${j + 1}`.padStart(settings.ArtifactsCountPerRepository.toString().length, '0')
                params.push({
                    projectName: project.name,
                    repositoryName: `repository-${s1}`,
                    tagName: `v${s2}`
                })
            }
        }
    }

    return {
        params,
    }
}

export default function ({ params }) {
    const i = counter.up() - 1

    const param = params[i]

    const ref = `${param.projectName}/${param.repositoryName}:${param.tagName}`

    const blobs = store.generateMany(settings.BlobSize, settings.BlobsCountPerArtifact)

    try {
        harbor.push({ ref, store, blobs })

        for (let i = 0; i < settings.ArtifactTagsCountPerArtifact-1; i++) {
            const s = `${i+1}`.padStart(settings.ArtifactTagsCountPerArtifact.toString().length, '0')

            harbor.createArtifactTag(param.projectName, param.repositoryName, param.tagName, `${param.tagName}-${s}`)
        }

    } catch (e) {
        console.log(e)
    }
}

export function teardown() {
    store.free()
}
