// prepare project members

import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchProjects, fetchUsers } from '../helpers.js'

const settings = Settings()

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus:  Math.min(300, settings.ProjectsCount * settings.ProjectMembersCountPerProject),
    iterations: settings.ProjectsCount * settings.ProjectMembersCountPerProject,
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
    const users = fetchUsers(settings.UsersCount)

    return {
        projectNames: projects.map(p => p.name),
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
    } catch (e) {
        console.log(e)
    }
}
