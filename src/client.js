const core = require('./core')
const utils = require('./utils')
const path = require('path')
const mkdirp = require('mkdirp')
const log = require('debug')('acme:Pull content')
const chalk = require('chalk')

let getData, containerPath, containerType, assetsDir, titleResourceType, aemBaseURL, aemFolderName, aemComponentName

const init = (config) => {
    getData = core.getData.bind(null, config.credentials, config.baseURL)
    containerPath = config.containerPath
    containerType = config.containerType
    assetsDir = config.assetsDir
    titleResourceType = config.titleResourceType
    aemBaseURL = config.baseURL
    aemFolderName = config.folderName
    aemComponentName = config.componentName
}

const getComponentPages = async (contentPath) => {
    return getData(utils.getJsonPath(contentPath))
        .then(core.getJson)
        .then(core.getPagePaths)
}

const getRenderedComponent = async (
    componentContentPath,
    title,
    componentLogMsg,
    componentDir
) => {
    log(
        `Saving template file for ${chalk.yellow.bold(
            title
        )} state of ${componentLogMsg} component`
    )
    return getData(utils.getHtmlPath(componentContentPath))
        .then(async (response) => {
            const filepath = path.format({
                dir: componentDir,
                name: title.replace(/\W+/g, '-'),
                ext: '.html'
            })
            const html = await core.getHtml(response)
            const imageTags = html.match(/<img[^>]+>/g) || []
            const linkTags = html.match(/<link[^>]+>/g) || []

            // Iterate over each image tag and update the src attribute
            const updatedHtml = imageTags.reduce((updatedContent, imageTag) => {
                // Append "http://localhost:4502/" before the src path
                const updatedImageTag = imageTag.replace(/src="([^"]+)"/, `src=${aemBaseURL}$1`)
                // Replace the original image tag with the updated one in the HTML content
                return updatedContent.replace(imageTag, updatedImageTag)
            }, html)

            // Iterate over each image tag and update the src attribute
            const updatedLinkHtml = linkTags.reduce((updatedContent, linkTag) => {
                // Append "http://localhost:4502/" before the src path
                const updatedLinkTag = linkTag.replace(/href="([^"]+)"/, `href=${aemBaseURL}$1`)
                // Replace the original image tag with the updated one in the HTML content
                return updatedContent.replace(linkTag, updatedLinkTag)
            }, updatedHtml)

            getContent(html)
            utils.writeToFile(filepath, utils.tidy(updatedLinkHtml))
        })
        .catch((error) => {
            console.log('error', error)
            // throw new Error(error)
        })
}

const getRenderedComponents = async (json, pageUrl, previousFolderName) => {
    // console.log('json', json)
    const component = pageUrl.split('/').pop()
    const componentLogMsg = chalk.green.bold(component)
    log(`Retrieving states from ${componentLogMsg} component page`)
    const componentDir = path.join(assetsDir, `components/${previousFolderName}`, component)
    const componentPaths = core.getComponentPaths(json, containerType)
    // console.log('componentDir', componentDir)
    // console.log('componentPaths', componentPaths)
    const titles = core.getTitles(
        json,
        titleResourceType,
        containerPath,
        componentPaths.length
    )
    // console.log('titles', titles)
    mkdirp.sync(componentDir)
    const result = []
    for (const [ind, componentPath] of componentPaths.entries()) {
        const title = titles[ind]
        const componentContentPath = pageUrl + componentPath
        result.push(
            getRenderedComponent(
                componentContentPath,
                title,
                componentLogMsg,
                componentDir
            )
        )
    }
    return result
}

const getParentComponents = async (contentPath) => {
    console.log('contentPath', contentPath)
    return getComponentPages(contentPath).then((pagePaths) => {
        const result = pagePaths.map((pagePath) => {
            const fullPagePath = contentPath + pagePath
            return getComponentPages(fullPagePath).then((pagePaths) => {
                // console.log('pagePaths--2', pagePaths)
                const innerresult = pagePaths.map((pagePath) => {
                    const pagePathList = fullPagePath + pagePath
                    console.log('pagePathList', pagePathList)
                    const urlParts = pagePathList.split('/')
                    // Get the second-to-last part
                    const previousFolderName = urlParts[urlParts.length - 2]
                    const camelCaseFolderName = previousFolderName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
                    const components = getData(utils.getJsonPath(pagePathList))
                        .then(core.getJson)
                        .then((json) => getRenderedComponents(json, pagePathList, camelCaseFolderName))

                    return components
                })
                return Promise.all(innerresult)
            })
        })
        return Promise.all(result)
    })
}

const getAllComponentsFromFolderPath = async (contentPath) => {
    const fullPagePath = contentPath + aemFolderName
    return getComponentPages(fullPagePath).then((pagePaths) => {
        const innerresult = pagePaths.map((pagePath) => {
            const pagePathList = fullPagePath + pagePath
            console.log('pagePathList', pagePathList)
            const urlParts = pagePathList.split('/')
            const previousFolderName = urlParts[urlParts.length - 2]
            const camelCaseFolderName = previousFolderName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
            const components = getData(utils.getJsonPath(pagePathList))
                .then(core.getJson)
                .then((json) => getRenderedComponents(json, pagePathList, camelCaseFolderName))

            return components
        })
        return Promise.all(innerresult)
    })
}

const getComponentsFromComponentPath = async (contentPath) => {
    const pagePathList = contentPath + aemComponentName
    console.log('pagePathList', pagePathList)
    const urlParts = pagePathList.split('/')
    // Get the second-to-last part
    const previousFolderName = urlParts[urlParts.length - 2]
    const camelCaseFolderName = previousFolderName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    const components = getData(utils.getJsonPath(pagePathList))
        .then(core.getJson)
        .then((json) => getRenderedComponents(json, pagePathList, camelCaseFolderName))

    return components
}

const getAllComponents = async (contentPath) => {
    // console.log('contentPath', contentPath)
    return getComponentPages(contentPath).then((pagePaths) => {
        //    console.log('pagePaths', pagePaths)
        const result = pagePaths.map((pagePath) => {
            const fullPagePath = contentPath + pagePath
            const components = getData(utils.getJsonPath(fullPagePath))
                .then(core.getJson)
                .then((json) => getRenderedComponents(json, fullPagePath))
            return components
        })
        return Promise.all(result)
    })
}

const getContent = async (html) => {
    const resourcePaths = core.getResourcePaths(html, aemBaseURL)

    const resources = resourcePaths
        .filter((p) => {
            const isExternal = utils.isExternalUrl(p)
            if (isExternal) {
                log(`Skipping external resource: ${chalk.red(p)}`)
            }
            return !isExternal
        })
        .map((resourcePath) => {
            const filename = path.basename(resourcePath)
            const filepath = path.dirname(resourcePath)

            const targetPath = path.join(assetsDir, filepath)
            const fullPath = path.join(targetPath, filename)
            mkdirp.sync(targetPath)
            return getData(resourcePath).then((response) =>
                core.writeToFile(response, fullPath)
            )
        })
    return Promise.all(resources)
}

/* const getFonts = async (response, resourceDir, targetPath) => {
    if (
        response.headers
            .get('content-type')
            .includes('text/css')
    ) {
        const cssCode = await response.text()
        const fontUrls = core.getFontUrls(cssCode)
        fontUrls.forEach(async (fontPath) => {
            const fontUrl = path.join(
                resourceDir,
                fontPath
            )
            const filename = path.basename(fontPath)
            await getData(fontUrl).then(async (response) => {
                const fontDir = path.join(
                    targetPath,
                    path.dirname(fontPath)
                )
                mkdirp.sync(fontDir)
                await core.writeToFile(
                    response,
                    path.join(fontDir, filename)
                )
            })
        })
    }
} */

const getResources = async (contentPath) => {
    return getData(utils.getHtmlPath(contentPath))
        .then(core.getHtml)
        .then((html) => {
            const resourcePaths = core.getResourcePaths(html)
            const targetPath = path.join(assetsDir, 'resources')
            mkdirp.sync(targetPath)
            const resources = resourcePaths
                .filter((p) => {
                    // TODO - Define whitelist in config
                    return ['clientlib-base', 'http'].some((x) =>
                        p.includes(x)
                    )
                })
                .map(async (resourcePath) => {
                    // const resourceDir = path.dirname(resourcePath)
                    return getData(resourcePath).then(async (response) => {
                        let filename = path.basename(resourcePath)
                        if (utils.isExternalUrl(resourcePath)) {
                            // const clone = response.clone()
                            const contentType = response.headers.get(
                                'content-type'
                            )
                            filename = utils.buildFilename(
                                contentType,
                                resourcePath
                            )
                        }
                        const filepath = path.join(targetPath, filename)
                        // const clone = response.clone()
                        // getFonts(clone, resourceDir, targetPath)
                        return core.writeToFile(response, filepath)
                    })
                })
            return Promise.all(resources)
        })
}

const getResourcesImage = async (contentPath) => {
    return getData(utils.getHtmlPath(contentPath))
        .then(core.getHtml)
        .then((html) => {
            // Find all image tags in the HTML content
            const imageTags = html.match(/<img[^>]+>/g) || []

            // Iterate over each image tag and update the src attribute
            const updatedHtml = imageTags.reduce((updatedContent, imageTag) => {
                // Append "http://localhost:4502/" before the src path
                const updatedImageTag = imageTag.replace(/src="([^"]+)"/, 'src="http://localhost:4502/$1"')
                // Replace the original image tag with the updated one in the HTML content
                return updatedContent.replace(imageTag, updatedImageTag)
            }, html)

            const targetPath = path.join(assetsDir, 'resources')
            mkdirp.sync(targetPath)

            // Write the updated HTML content to a file
            const filepath = path.join(targetPath, 'updated.html')
            return core.writeToFile(updatedHtml, filepath)
        })
}

const getPolicy = async (policyPath, policiesDir) => {
    const component = path.basename(policyPath)
    log(`Retrieving policy for ${chalk.green.bold(component)} component`)
    return getData(utils.getJsonPath(policyPath)).then((response) => {
        const filepath = path.format({
            dir: policiesDir,
            name: component,
            ext: '.json'
        })
        return core.writeToFile(response, filepath)
    })
}

const getPolicies = async (policiesUrl) => {
    // console.log('policiesUrl', policiesUrl)
    return getData(utils.getJsonPath(policiesUrl))
        .then(core.getJson)
        .then((json) => {
            const policyPaths = core.getPolicyPaths(json)
            const policiesDir = path.join(assetsDir, 'policies')
            mkdirp.sync(policiesDir)

            const result = policyPaths.map((policyPath) =>
                getPolicy(policiesUrl + policyPath, policiesDir)
            )
            return Promise.all(result)
        })
}

exports.getResourcesImage = getResourcesImage
exports.getAllComponents = getAllComponents
exports.getParentComponents = getParentComponents
exports.getAllComponentsFromFolderPath = getAllComponentsFromFolderPath
exports.getComponentsFromComponentPath = getComponentsFromComponentPath
exports.getResources = getResources
exports.getPolicies = getPolicies
exports.init = init
