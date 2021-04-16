// test the performance for the list audit logs API

import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'

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

    const { total } = harbor.listAuditLogs({ page: 1, pageSize: 1 })

    console.log(`total audit logs: ${total}`)

    return {
        auditLogsCount: total
    }
}

export default function ({ auditLogsCount }) {
    const pageSize = 15
    const pages = Math.ceil(auditLogsCount / pageSize)
    const page = Math.floor(Math.random() * pages) + 1

    try {
        harbor.listAuditLogs({ page, pageSize })
    } catch (e) {
        console.log(e)
    }
}
