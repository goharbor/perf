#!/bin/bash
# harbor访问地址
HARBOR_URL="${HARBOR_URL}"
HARBOR_USER="${HARBOR_USER:-admin}"
HARBOR_PASSWORD="${HARBOR_PASSWORD:-Harbor12345}"

# 要删除的项目/用户前缀：有默认值，也支持覆盖
DELETE_PROJECT_PREFIX="${DELETE_PROJECT_PREFIX:-project}"
DELETE_USER_PREFIX="${DELETE_USER_PREFIX:-user}"
 
function get_projects(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects?q=name%3D~${DELETE_PROJECT_PREFIX}\&page=1\&page_size=10\&with_detail=true |jq -r '.[].name'
}

function check_project_is_deleteable(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}/_deletable |jq -r '.deletable'
}

function delete_project(){
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}
}

function get_project_summary(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}/summary
}

function get_all_repositories(){
    local repository_number=$(get_project_summary | jq -r '.repo_count')
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}/repositories?page_size=${repository_number}\&page=1 | jq -r '.[].name' | awk -F '^[^/]*/' '{print $NF}'
}

function delete_repository(){
    echo "curl -s -k -X DELETE ${HARBOR_URL}/api/v2.0/projects/${project_name}/repositories/$(echo "$1"|sed 's#/#%252F#g')" 1>&2
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}/repositories/$(echo "$1"|sed 's#/#%252F#g')
}

function delete_all_repository(){
    for repository_name in $(get_all_repositories);do
    echo "删除 ${project_name} 下的 '${repository_name}' 镜像仓库"
        delete_repository ${repository_name}
    done
}
 
function get_all_charts(){
    local chart_number=$(get_project_summary | jq -r '.chart_count')
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/chartrepo/${project_name}/charts | jq -r '.[].name'
}

function delete_chart(){
    echo "curl -s -k -X DELETE ${HARBOR_URL}/api/chartrepo/${project_name}/charts/$(echo "$1"|sed 's#/#%252F#g')" 1>&2
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/chartrepo/${project_name}/charts/$(echo "$1"|sed 's#/#%252F#g')
}

function delete_all_chart(){
    for chart_name in $(get_all_charts);do
        echo "删除 ${project_name} 下的 '${chart_name}'chart仓库"
        delete_chart ${chart_name}
    done
}

function get_all_immutabletagrules(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}/immutabletagrules?page=1\&page_size=50 | jq -r '.[].id'
}

function delete_immutabletagrule(){
    echo "curl -s -k -X DELETE ${HARBOR_URL}/api/v2.0/projects/${project_name}/immutabletagrules/${1}" 1>&2
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/projects/${project_name}/immutabletagrules/${1}
}

function delete_all_immutabletagrule(){
    while [ "$(get_all_immutabletagrules)" != "" ];do
        for immutabletagrule_id in $(get_all_immutabletagrules);do
            echo "删除 ${project_name} 下的 '${immutabletagrule_id}' immutabletagrule"
            delete_immutabletagrule ${immutabletagrule_id}
        done
    done
}

function get_all_users(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/users?q=name%3D${DELETE_USER_PREFIX}\&page=1\&page_size=50  | jq -r '.[].user_id'
}

function get_user_name_by_id(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/users/${1}  | jq -r '.username'
}

function delete_user(){
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/users/${1}
}

function delete_all_users(){
    while [ "$(get_all_users)" != "" ];do
        for user_id in $(get_all_users);do
        echo "删除用户 '$(get_user_name_by_id ${user_id})' '${user_id}'"
            delete_user ${user_id}
        done
    done
}

function get_all_robots(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/robots?page=1\&page_size=50  | jq -r '.[].id'
}
 
function get_robot_name_by_id(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/robots/${1}  | jq -r '.name'
}

function delete_robot(){
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/robots/${1}
}

function delete_all_robots(){
    while [ "$(get_all_robots)" != "" ];do
        for robot_id in $(get_all_robots);do
            echo "删除robot用户 '$(get_robot_name_by_id ${robot_id})' '${robot_id}'"
            delete_robot ${robot_id}
        done
    done
}

function get_all_registries(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/registries?page=1\&page_size=50  | jq -r '.[].id'
}

function get_registry_name_by_id(){
    curl -s -k --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/registries/${1}  | jq -r '.name'
}

function delete_registry(){
    echo "curl -s -k -X DELETE --user \"${HARBOR_USER}:${HARBOR_PASSWORD}\" ${HARBOR_URL}/api/v2.0/registries/${1}"
    curl -s -k -X DELETE --user "${HARBOR_USER}:${HARBOR_PASSWORD}" ${HARBOR_URL}/api/v2.0/registries/${1}
}

function delete_all_registries(){
    while [ "$(get_all_registries)" != "" ];do
        for registry_id in $(get_all_registries);do
            echo "删除registry '$(get_registry_name_by_id ${registry_id})' '${registry_id}'"
            delete_registry ${registry_id}
        done
    done
}

while [ "$(get_projects)" != "" ];do
    for project_name in $(get_projects);do
        echo -e "\n************************\n开始清理 ${project_name}\n****************************\n"
        if [ "$(check_project_is_deleteable ${project_name})" == "null" ];then
            echo "${project_name}) 不能直接删除项目：${project_name}"
            delete_all_immutabletagrule
            delete_all_repository
            delete_all_chart
            delete_project
        else
            echo "可直接删除项目：${project_name}"
            delete_project
        fi
    done
done

delete_all_users
delete_all_registries
delete_all_robots