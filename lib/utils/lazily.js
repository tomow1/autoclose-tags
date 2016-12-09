'use babel';

import {
    mapValue,
    mapProps,
    convertToIterator,
    safeMerge
} from './core';

export function* reverse(list, currentPosition = list.length - 1) {
    yield list[currentPosition];
    if (currentPosition > 0) yield* reverse(list, (currentPosition - 1));
}

export function* map(subject, mapFunc) {
    const mapIterator = *(index = 0) => {
        const { value, done } = subject.next();
        if (done) return;
        yield mapFunc(value, index);
        yield* mapIterator(index + 1);
    };

    yield* mapIterator();
}

export function* filter(subject, filterFn) {

}

function wrapModifier(list) {
    return (modifier) => (...args) => Lazily(modifier(list, ...args));
}

function processModifiers(list, allModifiers) {
    return mapProps(allModifiers, mapValue(
        wrapModifier(list)
    ));
}

function arrayModifiers(allModifiers) {
    return (list) => Array.isArray(list) && processModifiers(list, allModifiers);
}

function iteratorModifiers(allModifiers) {
    return (list) => processModifiers(
        convertToIterator(list),
        allModifiers
    );
}

// The Lazily API methods which work only on arrays
const arrayMethods = arrayModifiers({
    reverse
});

const iterableMethods = iteratorModifiers({
    map,
    filter,
    find,
    reduce
});

export function Lazily(list) {
    return safeMerge(
        arrayMethods(list),
        iterableMethods(list)
    );
}
