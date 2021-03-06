import {describe, it} from 'mocha'
import {expect} from 'chai'
const path = require('path')
const fs = require('fs')
const ROOT = path.resolve(__dirname, '../test/fixtures')
const fixtures = fs.readdirSync(ROOT).filter(filepath => filepath.indexOf('.') !== 0)

const mos = require('mos-processor')
const ejs = require('mos-plugin-ejs')
import license from './index'

describe('mos-plugin-toc', () => {
  fixtures.forEach(fixture => {
    const filepath = path.join(ROOT, fixture)
    const output = fs.readFileSync(path.join(filepath, 'output.md'), 'utf-8')
    const inputPath = path.join(filepath, 'input.md')
    const input = fs.readFileSync(inputPath, 'utf-8')
    const configPath = path.join(filepath, 'config.json')
    const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : {}

    it('should pass fixture in dir ' + filepath, done => {
      mos({ content: input, filePath: inputPath }, [{ register: ejs }, { register: license, options: config }])
        .then(processor => processor.process())
        .then(result => {
          expect(result).to.eq(output)
          done()
        })
        .catch(done)
    })
  })
})
