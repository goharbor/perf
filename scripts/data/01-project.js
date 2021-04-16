// prepare projects

import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'

const settings = Settings()

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus: Math.min(300, settings.ProjectsCount),
    iterations: settings.ProjectsCount,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)

    try {
        harbor.deleteProject('library')
    } catch (e) {
        console.log(e)
    }

    return {
        projectPrefix: `project-${Date.now()}`
    }
}

export default function ({ projectPrefix }) {
    const suffix = `${counter.up()}`.padStart(settings.ProjectsCount.toString().length, '0')

    try {
        harbor.createProject({ projectName: `${projectPrefix}-${suffix}` })
    } catch (e) {
        console.log(e)
    }
}
