// test the performance for the list repositories API

import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchProjects, randomItem } from '../helpers.js'

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

    return {
        projectNames: projects.map(p => p.name),
    }
}

export default function ({ projectNames }) {
    const projectName = randomItem(projectNames)

    try {
        harbor.listRepositories(projectName)
    } catch (e) {
        console.log(e)
    }
}
