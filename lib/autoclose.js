'use babel';

import { CompositeDisposable } from 'atom';
import { pipeline, safeTransform, stringToRegex, validate } from './utils/core';
import Immutable from 'immutable';
// import Rx from 'rxjs-es/Rx';

console.log('autoclose init');

// Lord have mercy
const QUOTED_STRING_HUNTER_REGEX = /(?=["'`])(?:"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^'\\]*(?:\\[\s\S][^'\\]*)*'|`[^'\\]*(?:\\[\s\S][^'\\]*)*`)/gi;
const QUOTE_CHARACTER_REGEX =      /[\'\"\`]/gi;
const OPEN_OR_CLOSE_CARET_REGEX =  /(?:>|<)/gi;
const TAG_NAME_REGEX =             /<(?:[a-zA-Z0-9-_.]+)[^>]*?/g;

const OPEN_CARET_STRING = '<';
const CLOSE_CARET_STRING = '>';

const getGroupMatch = safeTransform(value => value[1]);

function extractMatchInfo(match) {
    const { index, input } = match;
    const text = match[0];

    return {
        index,
        input,
        text
    };
}

// Results are in an immutable list
function findAll(haystack, needle, results = Immutable.List()) {
    const needleExpression = stringToRegex(needle);

    const nextMatch = needleExpression.exec(haystack);
    const allDone = !nextMatch && results;

    return allDone || findAll(haystack, needle, results.push(
        extractMatchInfo(nextMatch)
    ));
}

function stripAllQuotedParts(originalString, quoteHunterRegex = QUOTED_STRING_HUNTER_REGEX) {
    return originalString.replace(quoteHunterRegex, '');
}

const removeCaretsFromString = safeTransform(
    value => value.replace(OPEN_OR_CLOSE_CARET_REGEX, '')
)

function findMatchingTagName(haystack) {
    const allOpenCarets = findAll(haystack, OPEN_OR_CLOSE_CARET_REGEX);

    const probablyHasMatchingTagName = validate(
        val => !val.isEmpty(),
        val => val.last() !== CLOSE_CARET_STRING
    )(allOpenCarets);

    const foundStartOfTag = probablyHasMatchingTagName && findAll(haystack, TAG_NAME_REGEX).last();

    const tagName = foundStartOfTag && removeCaretsFromString(foundStartOfTag);

    return tagName;
}

export default {
    subscriptions : null,
    currentEditor : null,
    action : null,
    extension : '',
    disabledFileExtensions : [],
    config : {
        disabledFileExtensions: {
            type: 'array',
            default: [
                'js', 'jsx'
            ],
            description: 'Disabled autoclose in above file types'
        }
    },

    activate() {
        this.clearAndReset();

        atom.config.observe('autoclose.disabledFileExtensions', value => {
            return this.disabledFileExtensions = value;
        });
    },

    clearAndReset() {
        if (this.subscriptions) this.subscriptions.dispose();

        this.currentEditor = atom.workspace.getActiveTextEditor();
        this.subscriptions = new CompositeDisposable();

        this.addTextWatcher(event => this.closeTag(event));
        this.addPaneChangeWatcher(event => this.clearAndReset());
    },

    addEvent(callback) {
        return this.subscriptions.add(callback);
    },

    addTextWatcher(callback) {
        const hasEditor = this.currentEditor;
        return hasEditor && this.addEvent(this.currentEditor.onDidInsertText(callback));
    },

    addPaneChangeWatcher(callback) {
        return this.addEvent(atom.workspace.onDidChangeActivePaneItem(callback));
    },

    // dispose
    deactivate() {
        console.log('autoclose dispose');
        return this.subscriptions.dispose();
    },

    addIndent(range) {
        let {start, end} = range;
        let {buffer} = this.currentEditor;
        let lineBefore = buffer.getLines()[start.row];
        let lineAfter = buffer.getLines()[end.row];
        let content = lineBefore.substr(lineBefore.lastIndexOf('<')) + '\n' + lineAfter;
        let regex = /^.*\<([a-zA-Z0-9-_]+)(\s.+)?\>\n\s*\<\/\1\>.*/;

        if (regex.test(content)) {
            this.currentEditor.insertNewlineAbove();
            return this.currentEditor.insertText('  ');
        }
    },

    closeTag(event) {
        let {text, range} = event;
        if (text === '\n') {
            this.addIndent(event.range);
            return;
        }

        if (text !== '>' && text !== '/') {
            return;
        }

        let line = this.currentEditor.buffer.getLines()[range.end.row];

        let strBefore = line.substr(0, range.start.column);
        let strAfter = line.substr(range.end.column);

        const allOpeningBrackets = findAll(strBefore, '<');
        const allClosingBrackets = findAll(strBefore, '>');

        const allQuoteChars = findAll(strBefore, quoteCharsRegex);
        // const currentlyWithinQuote = isOdd(allQuoteChars.length);
        // const allDoubleQuotes = findAll(strBefore, '"');

        console.log({
            allOpeningBrackets,
            allClosingBrackets,
            allQuoteChars
        });
        // <meow derp='>' foo='bar'>
        // ^(`[^`]+`)|\s(`[^`]+`)|

        let previousTagIndex = strBefore.lastIndexOf('<');
        let previousCloseIndex = strBefore.lastIndexOf('>');

        if (previousCloseIndex > previousTagIndex) {
            return;
        }

        if (previousTagIndex < 0) {
            return;
        }

        let tagName = safeTransform(
            strBefore.match(TAG_NAME_REGEX),
            value => value[1]
        );

        if (!tagName) {
            return;
        }

        if (text === '>') {
            if (strBefore[strBefore.length - 1] === '/') {
                return;
            }

            this.currentEditor.insertText(`</${tagName}>`);
            return this.currentEditor.moveLeft(tagName.length + 3);
        } else if (text === '/') {
            if (strAfter[0] === '>') {
                return;
            }
            return this.currentEditor.insertText('>');
        }
    }
};
