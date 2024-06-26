// const argv = require('yargs').argv
const log = require('debug')('acme:create')
const path = require('path')
const { titleCase } = require('title-case')
const humanize = require('humanize-string')
const chalk = require('chalk')
const fs = require('fs')

const generator = require('generator')

const errorHandler = (err) => {
    if (err.code === 'ENOENT') {
        throw new Error(`Could not find ${chalk.red(err.path)} directory`)
    }
    throw err
}

const readdir = async (path) => {
    return await fs.promises
        .readdir(path, {
            withFileTypes: true
        })
        .catch(errorHandler)
}

const addStory = async (componentsPath, componentName, logMsg, parentFolderName) => {
    const templatesPath = path.join(componentsPath, componentName)

    const templates = await readdir(templatesPath)
    let num = 1
    for (const template of templates) {
        const templateName = path.basename(template.name, '.html')
        // Add story to stories file
        const storyName = titleCase(humanize(templateName))
        const templateLogMsg = chalk.yellow.bold(storyName)
        log(`Adding ${templateLogMsg} story for ${logMsg} component`)

        await generator.run('story', componentName, {
            funcName: 'Example_' + num++,
            storyName: storyName,
            templatePath: path.join(templatesPath, template.name),
            folderName: parentFolderName
        })
    }
}

const createStories = async (assetsPath) => {
    const componentsPath = path.join(assetsPath, 'components')
    // Path relative to assetsPath
    const policiesRelPath = path.join(path.sep, 'policies')
    const policiesRel = path.join(assetsPath, 'policies')
    const components = await readdir(componentsPath)

    return components.forEach(async (component) => {
        const fullcomponentpath = component.parentPath + '/' + component.name
        const parentFolderName = component.name
        const innercomponents = await readdir(fullcomponentpath)

        const generatedFiles = innercomponents
            .filter((component) => component.isDirectory())
            .map((component) => {
                const logMsg = chalk.green.bold(component.name)
                log(`Found ${logMsg} component... creating stories file`)
                const policyPath = policiesRel + '/' + component.name + '.json';
                const policyExists = fs.existsSync(policyPath);

                console.log('component-name--',component.name,' --policyExists', policyExists);

                // Create stories file
                return generator
                    .run('stories', component.name, {
                        policiesPath: policiesRelPath,
                        folderName: parentFolderName,
                        policyExists: policyExists + '',
                    })
                    .then(() => addStory(fullcomponentpath, component.name, logMsg, parentFolderName))
            })
        return Promise.all(generatedFiles)
    })
}

const generatePreviewJS = async (assetsPath) => {
    const resourcesPath = path.join(assetsPath, 'resources')
    const resources = await readdir(resourcesPath)
    const resourcesRelPath = resources.map((resource) => {
        return path.join('..', assetsPath, 'resources', resource.name)
    })

    log('Generating preview.js file')
    await generator.run('preview', null, {
        resourceList: resourcesRelPath.join()
    })
}

// createStories(argv.path).catch(console.error)
exports.createStories = createStories
exports.generatePreviewJS = generatePreviewJS
