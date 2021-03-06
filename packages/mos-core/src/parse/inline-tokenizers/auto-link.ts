import decode from 'parse-entities'
import Tokenizer from '../tokenizer'
import renderLink from './renderers/link'
import createScanner from '../scanner'
const MAILTO_PROTOCOL = 'mailto:'

/**
 * Tokenise a URL in carets.
 *
 * @example
 *   tokenizeAutoLink(eat, '<http://foo.bar>')
 *
 * @property {boolean} notInLink
 * @property {Function} locator - Auto-link locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `link` node.
 */
const tokenizeAutoLink: Tokenizer = function (parser, value, silent) {
  const scanner = createScanner(value)

  if (scanner.next() !== '<') {
    return false
  }

  let subvalue = ''
  let queue = ''
  let hasAtCharacter = false
  let link = ''

  subvalue = '<'

  while (!scanner.eos()) {
    let character = scanner.next()

    if (
      character === ' ' ||
      character === '>' ||
      character === '@' ||
      (character === ':' && scanner.peek() === '/')
    ) {
      scanner.moveIndex(-1)
      break
    }

    queue += character
  }

  if (!queue) {
    return false
  }

  link += queue
  queue = ''

  let character = scanner.next()
  link += character

  if (character === '@') {
    hasAtCharacter = true
  } else {
    if (
      character !== ':' ||
      scanner.peek() !== '/'
    ) {
      return false
    }

    link += '/'
    scanner.moveIndex(1)
  }

  while (!scanner.eos()) {
    character = scanner.next()

    if (character === ' ' || character === '>') {
      scanner.moveIndex(-1)
      break
    }

    queue += character
  }

  character = scanner.next()

  if (!queue || character !== '>') {
    return false
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  link += queue
  let content = link
  subvalue += link + character
  const now = parser.eat.now()
  now.column++
  now.offset++

  if (hasAtCharacter) {
    if (
      link.substr(0, MAILTO_PROTOCOL.length).toLowerCase() !== MAILTO_PROTOCOL
    ) {
      link = MAILTO_PROTOCOL + link
    } else {
      content = content.substr(MAILTO_PROTOCOL.length)
      now.column += MAILTO_PROTOCOL.length
      now.offset += MAILTO_PROTOCOL.length
    }
  }

  parser.context.inAutoLink = true
  const eater = parser.eat(subvalue)
  return renderLink(parser, decode(link), content, null, now)
    .then(node => {
      parser.context.inAutoLink = false
      const addedNode = eater(node)
      return addedNode
    })
}

tokenizeAutoLink.notInLink = true

/**
 * Find a possible auto-link.
 *
 * @example
 *   locateAutoLink('foo <bar') // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible auto-link.
 */
tokenizeAutoLink.locator = function (parser, value, fromIndex) {
  return value.indexOf('<', fromIndex)
}

export default tokenizeAutoLink
