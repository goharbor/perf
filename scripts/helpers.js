
import harbor from 'k6/x/harbor'

export function fetchAritfacts(projectName, repositoryName, count=-1) {
    let page = 1
    const pageSize = 100

    const results = []
    while (true) {
        const { artifacts } = harbor.listArtifacts(projectName, repositoryName, { page, pageSize })

        for (const artifact of artifacts) {
            results.push(artifact)
        }

        if (artifacts.length == 0 || artifacts.length < pageSize) {
            break
        }

        if (count > 0 && results.length >= count) {
            break
        }

        page++
    }

    if (count > 0) {
        return results.slice(0, count)
    }

    return results
}

export function fetchProjects(count=-1) {
    let page = 1
    const pageSize = 100

    const results = []
    while (true) {
        const { projects } = harbor.listProjects({ page, pageSize })

        for (const project of projects) {
            results.push(project)
        }

        if (projects.length == 0 || projects.length < pageSize) {
            break
        }

        if (count > 0 && results.length >= count) {
            break
        }

        page++
    }

    if (count > 0) {
        return results.slice(0, count)
    }

    return results
}

export function fetchRepositories(projectName, count=-1) {
    let page = 1
    const pageSize = 100

    const results = []
    while (true) {
        const { repositories } = harbor.listRepositories(projectName, { page, pageSize })

        for (const repository of repositories) {
            results.push(repository)
        }

        if (repositories.length == 0 || repositories.length < pageSize) {
            break
        }

        if (count > 0 && results.length >= count) {
            break
        }

        page++
    }

    if (count > 0) {
        return results.slice(0, count)
    }

    return results
}

export function fetchUsers(count=-1) {
    let page = 1
    const pageSize = 100

    const results = []
    while (true) {
        const { users } = harbor.listUsers({ page, pageSize })

        for (const user of users) {
            // skip admin
            if (user.username !== 'admin') {
                results.push(user)
            }
        }

        if (users.length == 0 || users.length < pageSize) {
            break
        }

        if (count > 0 && results.length >= count) {
            break
        }

        page++
    }

    if (count > 0) {
        return results.slice(0, count)
    }

    return results
}

export function randomIntBetween(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

export function numberToPadString(num, maxNum, padString='0') {
    return `${num}`.padStart(maxNum.toString().length, padString)
}

export function getProjectName(settings, i) {
    return `${settings.ProjectPrefix}-${numberToPadString(i + 1, settings.ProjectsCount)}`
}

export function getRepositoryName(settings, i) {
    return `repository-${numberToPadString(i + 1, settings.RepositoriesCountPerProject)}`
}

export function getArtifactTag(settings, i) {
    return `v${numberToPadString(i + 1, settings.ArtifactsCountPerRepository)}`
}

export function getArtifactNewTag(settings, tagIndex, newTagIndex) {
    return `${getArtifactTag(settings, tagIndex)}p${numberToPadString(newTagIndex+1, settings.ArtifactTagsCountPerArtifact)}`
}
