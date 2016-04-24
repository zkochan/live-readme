'use strict'
module.exports = mos

const remark = require('remark')
const getMarkdownMeta = require('./get-markdown-meta')
const createMDScope = require('./create-md-scope')
const remarkMos = require('remark-mos')
const remarkToc = require('remark-toc')

const defaultPlugins = [
  require('../plugins/mos-plugin-package-json'),
  require('../plugins/mos-plugin-installation'),
  require('../plugins/mos-plugin-license'),
  require('mos-plugin-shields'),
  require('mos-plugin-example'),
  require('mos-plugin-dependencies'),
  require('mos-plugin-snippet'),
]

const defaultRemarkPlugins = [[remarkToc]]

function mos () {
  let mosPlugins = defaultPlugins
  const remarkPlugins = defaultRemarkPlugins

  const processor = {
    use (plugins) {
      mosPlugins = mosPlugins.concat(plugins)
      return processor
    },
    useRemarkPlugin () {
      remarkPlugins.push(arguments)
      return processor
    },
    process (md, opts) {
      opts = opts || {}
      if (!opts.filePath) throw new Error('opts.filePath is required')

      return getMarkdownMeta(opts.filePath)
        .then(markdown => createMDScope(mosPlugins, markdown))
        .then(scope => {
          const remarkProcessor = remark().use(remarkMos, {scope})

          remarkPlugins.forEach(useArgs => remarkProcessor.use.apply(remarkProcessor, useArgs))

          return new Promise((resolve, reject) => {
            remarkProcessor.process(md, (err, result) => {
              return err ? reject(err) : resolve(remarkProcessor.stringify(result, {
                listItemIndent: '1',
              }))
            })
          })
        })
    },
  }

  return processor
}