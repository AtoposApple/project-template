/* Register new files on add in entry file */

import fs from 'fs'

export default function registrator(event) {
  const e = event
  const fullPath = e.path
  const extname = e.extname

  if (extname !== '.js' && extname !== '.styl') {
    return false
  }
  if (e.event !== 'add' && e.event !== 'unlink') {
    return false
  }

  function findFolder(folders) {
    const filtered = folders.filter((item) => {
      const regExp = new RegExp(item)
      return regExp.test(fullPath)
    })
    return filtered[0]
  }

  const options = {
    '.js': {
      folders: ['components'],
      main: 'src/js/main.js',
      method: 'import ',
    },
    '.styl': {
      folders: ['components', 'styles'],
      main: 'src/styles/main.styl',
      method: '@require ',
    },
  }

  function getIndex(where, what) {
    const index = where.indexOf(what)
    return index
  }

  function assemblePath(string) {
    let cutPath
    let assembledPath
    let jsExtname

    switch (string) {
      case 'components':
        cutPath = fullPath.slice(getIndex(fullPath, 'components'))
        jsExtname = getIndex(cutPath, '.js')
        if (~jsExtname) cutPath = cutPath.slice(0, jsExtname)
        assembledPath = `'../${cutPath}'`
        break
      case 'styles':
        cutPath = fullPath.slice(getIndex(fullPath, 'styles') + 'styles'.length + 1)
        assembledPath = `'${cutPath}'`
        break
      default:
        return false
    }

    return assembledPath
  }

  function addStr(obj) {
    const file = obj.main
    const folder = findFolder(obj.folders)
    const method = obj.method

    fs.appendFileSync(file, `\n${method}${assemblePath(folder)}`)
  }

  function deleteStr(obj) {
    const file = obj.main
    const folder = findFolder(obj.folders)
    const method = obj.method
    const data = fs.readFileSync(file, 'utf-8')
    const contentArr = data.split('\n')

    fs.writeFileSync(file, contentArr.filter(item => item !== method + assemblePath(folder)).join('\n'))
  }

  if (e.event === 'add') addStr(options[extname])
  if (e.event === 'unlink') deleteStr(options[extname])
  return true
}
