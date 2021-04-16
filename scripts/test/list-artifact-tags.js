// test the performance for the list artifact tags API

import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchProjects, fetchRepositories, fetchAritfacts , randomItem } from '../helpers.js'

const settings = Settings()

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

    const projects = fetchProjects(settings.ProjectsCount)

    const inputs = []
    for (const project of projects) {
        const projectName = project.name

        try {
            const repositories = fetchRepositories(projectName)

            for (const repository of repositories) {
                const repositoryName = repository.name.replace(`${projectName}/`, '')

                const artifacts = fetchAritfacts(projectName, repositoryName)

                inputs.push({
                    projectName,
                    repositoryName,
                    artifactDigests: artifacts.map(a => a.digest),
                })
            }

        } catch (e) {
            console.log(e)
        }
    }

    return {
        inputs
    }
}

export default function ({ inputs }) {
    const input = randomItem(inputs)

    const digest = randomItem(input.artifactDigests)

    const params = {
        withSignature: true,
        withImmutableStatus: true,
    }

    try {
        harbor.listArtifactTags(input.projectName, input.repositoryName, digest, params)
    } catch (e) {
        console.log(e)
    }
}