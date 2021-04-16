// prepare audit logs

import counter from 'k6/x/counter'
import harbor from 'k6/x/harbor'

import { Settings } from '../config.js'
import { fetchProjects, randomItem } from '../helpers.js'

const settings = Settings()

const totalIterations = settings.AuditLogsCount - settings.ProjectsCount -
    settings.ProjectsCount * settings.RepositoriesCountPerProject * settings.ArtifactsCountPerRepository * settings.ArtifactTagsCountPerArtifact

export let options = {
    setupTimeout: '6h',
    duration: '24h',
    vus:  Math.min(300, totalIterations),
    iterations: totalIterations,
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

    const params = []
    for (const project of projects) {
        const projectName = project.name

        const { repositories } = harbor.listRepositories(projectName)
        if (repositories.length > 0) {
            const repository = randomItem(repositories)

            const repositoryName = repository.name.replace(`${projectName}/`, '')

            const { artifacts } = harbor.listArtifacts(project.name, repositoryName)
            if (artifacts.length > 0) {
                const artifact = randomItem(artifacts)

                params.push({
                    projectName,
                    repositoryName,
                    digest: artifact.digest,
                })
            }
        }

    }

    return {
        params
    }
}

export default function ({ params }) {
    const i = counter.up() - 1

    const param = params[i % params.length]

    const ref = `${param.projectName}/${param.repositoryName}@${param.digest}`

    harbor.getManifest(ref)
}
