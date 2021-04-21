// test the performance for the list artifacts API
import { Rate } from 'k6/metrics'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchProjects, fetchRepositories, randomItem } from '../helpers.js'

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

    const projects = fetchProjects(settings.ProjectsCount)

    const inputs = []
    for (const project of projects) {
        const projectName = project.name

        try {
            const repositories = fetchRepositories(projectName)

            inputs.push({
                projectName,
                repositoryNames: repositories.map(r => r.name.replace(`${projectName}/`, ''))
            })
        } catch (e) {
        }
    }

    return {
        inputs
    }
}

export default function ({ inputs }) {
    const input = randomItem(inputs)

    const repositoryName = randomItem(input.repositoryNames)

    const params = {
        withImmutableStatus: true,
        withLabel: true,
        withScanOverview: true,
        withSignature: true,
    }

    try {
        harbor.listArtifacts(input.projectName, repositoryName, params)
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}
