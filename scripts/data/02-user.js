// prepare users

import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'

const settings = Settings()

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus: Math.min(300, settings.UsersCount),
    iterations: settings.UsersCount,
    thresholds: {
        'iteration_duration{scenario:default}': [
            `max>=0`,
        ],
        'iteration_duration{group:::setup}': [`max>=0`],
    }
};

export function setup() {
    harbor.initialize(settings.Harbor)

    return {
        userPrefix: `user-${Date.now()}`
    }
}

export default function ({ userPrefix }) {
    const suffix = `${counter.up()}`.padStart(settings.UsersCount.toString().length, '0')

    try {
        harbor.createUser(`${userPrefix}-${suffix}`)
    } catch (e) {
        console.log(e)
    }
}