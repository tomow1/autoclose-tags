'use babel';

export function pipeline(...fns) {
    return (initialValue) => fns.reduce((result, currentFunk) => {
        return currentFunk(result);
    }, initialValue);
}

export function notNullOrUndefined(value) {
    return (
        typeof value !== 'undefined' &&
        value !== null
    );
}

export function safeTransform(transform) {
    return (value) => notNullOrUndefined(value) && transform(value);
}


export function prepareStringForRegex(originalString) {
    const regexEscapeRegex = /[|\\{}()[\]^$+*?.]/g;
    return originalString.replace(regexEscapeRegex, '\\$&');
}

export function stringToRegex(value) {
    const isString = typeof value === 'string';
    const regexFromString = isString && new RegExp(
        prepareStringForRegex(value),
        'gi'
    );

    return regexFromString || value;
}

export function falseAsUndefined(value) {
    return value || undefined;
}

export function validate(...handlers) {
    return (value) => value && handlers.every(fn => fn(value));
}

export function pattern(handlers) {

}

const lens =

const whenever = (...patterns) => {
    return (value) => {
        return patterns.reduce((result, currentItem) => {
            const output = currentItem(value);

        })
    }
}

function isTypeOf(someType) {
    return (transformFn) => (value) => {
        return value instanceof someType && transformFn(value);
    }
}

const someVal = match(
    when(is.typeOf(String))(
        val => val + ' is a string baby!'
    ),
    when(is.typeOf(Number), is.greaterThan(20))(
        val => val * val
    ),
    when(val => val.isEmpty())(
        val => val.push(20)
    ),
    when.either(is.typeOf(Array), is.arrayLike())(

    ),
    when(isNot.typeOf(String))(

    )
    when.otherwise(
        val => 'Invaliiiiiiddd'
    )
)('Should pass the string one');

when(value).isTypeOf(String).then(val => val + 'is a string baby')
    .otherwise(val => 'This is definitely not the type we were looking for');
