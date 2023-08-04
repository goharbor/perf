// prepare project members
import { Rate } from 'k6/metrics'
import counter from 'k6/x/counter'
import { Harbor } from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchUsers, getProjectNames } from '../helpers.js'

const settings = Settings()

const totalIterations = settings.ProjectsCount * settings.ProjectMembersCountPerProject

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

export function setup() {
    const users = fetchUsers(harbor, `username=~${settings.UserPrefix}-`, settings.UsersCount)

    return {
        projectNames: getProjectNames(settings),
        userIDs: users.map(u => u.userID),
    }
}

export default function ({ projectNames, userIDs }) {
    const i = counter.up() - 1

    const projectIndex = i % projectNames.length
    const projectRepeat = Math.ceil(i / projectNames.length)

    const projectName = projectNames[projectIndex]
    const userID = userIDs[(projectIndex + projectRepeat) % userIDs.length]

    try {
        harbor.createProjectMember(projectName, userID)
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.error(e.message)
    }
}
