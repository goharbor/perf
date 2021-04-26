export function Settings() {
    const settings = {
        Harbor: getHarborSettings(),
    }

    const userDataSettings = getUserDataSettings()
    for (const key in userDataSettings) {
        if (Object.hasOwnProperty.call(userDataSettings, key)) {
            settings[key] = userDataSettings[key]
        }
    }

    settings['ProjectPrefix'] = getEnv('PROJECT_PREFIX', 'project')

    return settings
}

const missing = Object()

export function getEnv(env, def = missing) {
    const value = __ENV[env] ? __ENV[env] : def
    if (value === missing) {
        throw (`${env} envirument is required`)
    }

    return value
}

export function getEnvInt(env, def = missing) {
    return parseInt(getEnv(env, def), 10)
}

function getHarborSettings() {
    return {
        scheme: getEnv('HARBOR_SCHEME', 'https'),
        host: getEnv('HARBOR_HOST'),
        username: getEnv('HARBOR_USERNAME', 'admin'),
        password: getEnv('HARBOR_PASSWORD', 'Harbor12345'),
        insecure: true,
    }
}

function getUserDataSettings() {
    const userDataSize = getEnv("HARBOR_SIZE", "small")

    return {
        ci: {
            VUS: getEnvInt('HARBOR_VUS', '100'),
            ProjectsCount: 10,
            RepositoriesCountPerProject: 10,
            ArtifactsCountPerRepository: 5,
            ArtifactTagsCountPerArtifact: 5,
            UsersCount: 10,
            ProjectMembersCountPerProject: 5,
            AuditLogsCount: 5000,
            BlobSize: '1 KiB',
            BlobsCountPerArtifact: 1
        },
        small: {
            VUS: getEnvInt('HARBOR_VUS', '300'),
            ProjectsCount: 100,
            RepositoriesCountPerProject: 100,
            ArtifactsCountPerRepository: 10,
            ArtifactTagsCountPerArtifact: 5,
            UsersCount: 100,
            ProjectMembersCountPerProject: 10,
            AuditLogsCount: 100000,
            BlobSize: getEnv('BLOB_SIZE', '1 KiB'),
            BlobsCountPerArtifact: getEnv('BLOBS_COUNT_PER_ARTIFACT', 1)
        }
    }[userDataSize]
}
