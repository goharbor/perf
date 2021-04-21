// test the performance for the search users API
import { Rate } from 'k6/metrics'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchUsers, randomItem } from '../helpers.js'

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

    const users = fetchUsers(settings.UsersCount)

    return {
        usernames: users.map(u => u.username)
    }
}

export default function ({ usernames }) {
    const username = randomItem(usernames)

    try {
        harbor.searchUsers({ username })
        successRate.add(true)
    } catch (e) {
        successRate.add(false)
        console.log(e)
    }
}
