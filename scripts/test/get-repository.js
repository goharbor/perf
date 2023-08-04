// test the performance for the get repo API
import { Rate } from 'k6/metrics'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { randomItem } from '../helpers.js'
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
    // find a repo
    const { projects } = harbor.listProjects({ page: 1, pageSize: 10 })
    for (let i = 0; i < projects.length; i++) {
        const projectName = projects[i].name
        const { repositories } = harbor.listRepositories(projectName)
        if (repositories.length > 0) {
            const repositoryName = randomItem(repositories).name.replace(`${projectName}/`, '')
            return {
                projectName,
                repositoryName
            }
        }
    }

    return {}
}

export default function ({ projectName, repositoryName }) {
    try {
        harbor.getRepository(projectName, repositoryName)
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}

export function handleSummary(data) {
    return generateSummary('get-repository')(data)
}