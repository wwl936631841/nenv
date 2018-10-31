const notifier = require('node-notifier')
const childProcess = require('child_process')
const isWindows = /^win/.test(process.platform)

export async function compile (task) {
    await task.parallel(['bin', 'server', 'lib', 'client'])
}

export async function bin (task, opts) {
    await task.source(opts.src || 'bin/*').babel().target('dist/bin', {mode: '0755'})
    notify('Compiled binaries')
}

export async function lib (task, opts) {
    await task.source(opts.src || 'lib/**/*.js').babel().target('dist/lib')
    notify('Compiled lib files')
}

export async function server (task, opts) {
    await task.source(opts.src || 'server/**/*.js').babel().target('dist/server')
    notify('Compiled server files')
}

export async function client (task, opts) {
    await task.source(opts.src || 'client/**/*.js').babel().target('dist/client')
    notify('Compiled client files')
}

export async function copy(task) {
    //await task.source('pages/**/*.js').target
}

export async function build(task) {
    await task.serial(['copy', 'compile'])
}

export default async function (task) {
    await task.start('build')
    await task.watch('bin/*', 'bin')
    await task.watch('pages/**/*.js', 'copy')
    await task.watch('server/**/*.js', 'server')
    await task.watch('client/**/*.js', 'client')
    await task.watch('lib/**/*.js', 'lib')
}

export async function release (task) {
    await task.clear('dist').start('build')
}



function notify (msg) {
    return notifier.notify({
        title: '▲ Nenv',
        message: msg,
        icon: false
    })
}