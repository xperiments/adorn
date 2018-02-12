const pillStyles =
    'padding:4px; padding-left:8px; padding-right:8px; border-radius:4px; line-height:18px; margin-left:2px; font-weight:100;';
const buttonPillsStyles =
    pillStyles + 'padding-top:0px; padding-bottom:2px; font-size:14px;';

const STYLES = {
    class: (color: string) => {
        return `background-color:#${color}; color:#${getContrastYIQ(
            color
        )};${pillStyles}; line-height:30px;`;
    },
    parameters: pillStyles + 'background-color:#f13a10; color:#fff;',
    logs: pillStyles + 'background-color:#488bcc; color:#fff;',
    inlineResult:
        pillStyles + 'background-color:#eee; color:#000;font-size:9px;',
    result: pillStyles + 'background-color:#4eb81f; color:#000;',
    read: buttonPillsStyles + 'background-color:#FF4500; color:#000;',
    write: buttonPillsStyles + 'background-color:#4eb81f; color:#000;',
    methodCall: buttonPillsStyles + 'background-color:#ccc; color:#FF4500;',
    undefined: pillStyles + 'background-color:#e8e119; color:#000;'
};
const SPACER = repeatStringNumTimes(' ', 400);
const LOG_CACHE: any[] = [];
const WHITE_LISTED_CLASSES: string[] = [];
/* PUBLIC */
export function log(message?: any, ...optionalParams: any[]) {
    LOG_CACHE.push(arguments);
}

export function enableTrace(target: any) {
    WHITE_LISTED_CLASSES.push(target.name);
    return target;
}

export function trace(title: string = null) {
    return (
        target: any,
        key: string,
        descriptor?: PropertyDescriptor
    ): PropertyDescriptor | void | any => {
        if (!descriptor) {
            return traceProperty(target, key, title);
        }
        return traceMethod(target, key, descriptor, title);
    };
}

/* PRIVATE */

function clearLog() {
    LOG_CACHE.length = 0;
}

function getContrastYIQ(hexcolor: string) {
    //https://24ways.org/2010/calculating-color-contrast/
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '000' : 'fff';
}

function getDepth(obj: any, index: number = 0): number {
    if (typeof obj === 'object') {
        const result = Object.keys(obj).map(key => {
            return getDepth(obj[key], index + 1);
        });
        return Math.max(...result);
    }
    return index;
}

function getParamNames(fn: Function): string[] {
    const funStr = fn.toString();
    return funStr
        .slice(funStr.indexOf('(') + 1, funStr.indexOf(')'))
        .match(/([^\s,]+)/g);
}

function getStripedJSON(val: any, size: number = 60) {
    if (val === undefined) return 'undefined';
    return JSON.stringify(val, (key: string, value: any) => {
        if (
            value != null &&
            typeof value === 'object' &&
            Array.isArray(value) === false
        ) {
            return JSON.stringify(value).length > size ? '{…}' : value;
        }
        return value;
    })
        .replace(/"/g, "'")
        .replace(/'{…}'/g, '{…}');
}

function hasPrimitiveTypes(input: any[]): boolean {
    return input.reduce((prev: any, current: string, index: number) => {
        if (!prev) {
            return false;
        }
        if (Array.isArray(current)) {
            return hasPrimitiveTypes(current);
        }
        if (isObject(current)) {
            return false;
        }
        return true;
    }, true);
}

function isObject(val: any): boolean {
    return (
        val != null && typeof val === 'object' && Array.isArray(val) === false
    );
}

function logObject(obj: any, maxLines: number = 20) {
    if (typeof obj === 'string') {
        console.log('%c' + obj + SPACER, 'background-color:#ddd; padding:4px;');
        return;
    }
    const lines = print_r(obj).split('\n');
    if (lines.length > maxLines || getDepth(obj) > 3) {
        console.dir(obj);
    } else {
        lines.forEach(line => {
            console.log(
                '%c' + line + SPACER,
                'background-color:#ddd; padding:4px;'
            );
        });
    }
}

function print_r(obj: any, tab: string = '') {
    // check if it's array
    var isArr = Object.prototype.toString.call(obj) === '[object Array]';

    // use {} for object, [] for array
    var str = isArr ? '[\n' : '{\n';

    // walk through it's properties
    for (let prop in obj) {
        if (Object.prototype.hasOwnProperty.apply(obj, [prop])) {
            const val1 = obj[prop];
            const type = Object.prototype.toString.call(val1);
            let val2 = '';
            switch (type) {
                // recursive if object/array
                case '[object Array]':
                case '[object Object]':
                    val2 = print_r(val1, tab + '  ');
                    break;

                case '[object String]':
                    val2 = "'" + val1 + "'";
                    break;

                default:
                    val2 = val1;
            }
            str += tab + '  ' + prop + ':' + val2 + ',\n';
        }
    }

    // remove extra comma for last property
    str = str.substring(0, str.length - 2) + '\n' + tab;

    return isArr ? str + ']' : str + '}';
}

function repeatStringNumTimes(str: string, times: number): string {
    /* https://medium.freecodecamp.org/three-ways-to-repeat-a-string-in-javascript-2a9053b93a2d */
    if (times < 0) {
        return '';
    }
    if (times === 1) {
        return str;
    } else {
        return str + repeatStringNumTimes(str, times - 1);
    }
}

function showValue(result: any, key: any) {
    if (result === undefined || result == null) {
        console.log('%cundefined🔞', STYLES.undefined);
    } else if (Array.isArray(result) && hasPrimitiveTypes(result)) {
        console.table(result);
    } else {
        logObject(result);
    }
}

function stringToColour(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xff;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

function traceMethod(
    target: any,
    key: string,
    descriptor?: PropertyDescriptor,
    title?: string
): PropertyDescriptor | void | any {
    const { log, table, dir, group, groupEnd, groupCollapsed } = console;
    const targetName = target.constructor.name;
    const targetColor = stringToColour(targetName);
    /* method decorator */
    const oldValue = descriptor.value;
    const parameters = getParamNames(target[key]);
    descriptor.value = function() {
        const hasParams = parameters && parameters.length > 0;
        let inputParams = '';
        let inputObject: any;
        let result: any;
        if (WHITE_LISTED_CLASSES.indexOf(targetName) !== -1) {
            let hasPrimitiveParameterTypes = true;
            if (hasParams == true) {
                let paramsPreview = parameters.join(',');
                const args = Array.prototype.slice.call(arguments);

                inputObject = parameters.reduce(
                    (prev: any, current: string, index: number) => {
                        prev[current] = args[index];
                        if (isObject(args[index])) {
                            hasPrimitiveParameterTypes = false;
                        }
                        return prev;
                    },
                    Object.create(null)
                );

                if (hasPrimitiveTypes(args)) {
                    paramsPreview = JSON.stringify(inputObject)
                        .replace(/{/g, '')
                        .replace(/}/g, '')
                        .replace(/:/g, '=')
                        .replace(/"/g, '');
                }
                inputParams = getStripedJSON(inputObject)
                    .substring(1)
                    .slice(0, -1);
            }

            groupCollapsed(
                `%c◯%c${
                    title ? `[ ${title} ] ` : ''
                }${targetName}.${key}%c(${inputParams})`,
                STYLES.methodCall,
                STYLES.class(targetColor),
                STYLES.inlineResult
            );

            clearLog();
            result = oldValue.apply(this, [arguments[1], arguments[0]]);
            const internalLog = LOG_CACHE;
            if (internalLog.length) {
                group('%clogs(' + internalLog.length + ')', STYLES.logs);
                internalLog.forEach((msg: any[], index: number) => {
                    console.log.apply(null, msg);
                });
                groupEnd();
            }

            if (inputObject) {
                const params = getStripedJSON(inputObject)
                    .substring(1)
                    .slice(0, -1);
                groupCollapsed(
                    `%cparams%c(${params})`,
                    STYLES.parameters,
                    STYLES.inlineResult
                );

                if (hasPrimitiveParameterTypes) {
                    table(inputObject);
                } else {
                    showValue(inputObject, key);
                }
                groupEnd();
            }

            groupCollapsed(
                '%creturns%c' + getStripedJSON(result),
                STYLES.result,
                STYLES.inlineResult
            );
            if (result !== null && result !== undefined) {
                showValue(result, key);
            }
            groupEnd();

            groupEnd();
        } else {
            clearLog();
            result = oldValue.apply(this, [arguments[1], arguments[0]]);
        }

        return result;
    };

    return descriptor;
}

function traceProperty(target: any, key: string, title: string): void {
    const targetName = target.constructor.name;
    const targetColor = stringToColour(targetName);
    const { log, table, dir, group, groupEnd, groupCollapsed } = console;

    let _value = target[key];

    const getter = () => {
        if (WHITE_LISTED_CLASSES.indexOf(targetName) !== -1) {
            groupCollapsed(
                `%c↩%c${
                    title ? `[ ${title} ] ` : ''
                }${targetName}.${key} is%c${getStripedJSON(_value)} `,
                STYLES.write,
                STYLES.class(targetColor),
                STYLES.inlineResult
            );
            showValue(_value, key);
            groupEnd();
        }
        return _value;
    };

    const setter = (newVal: any) => {
        if (WHITE_LISTED_CLASSES.indexOf(targetName) !== -1) {
            groupCollapsed(
                `%c↪%c${
                    title ? `[ ${title} ] ` : ''
                }${targetName}.${key} =>%c${getStripedJSON(newVal)}`,
                STYLES.read,
                STYLES.class(targetColor),
                STYLES.inlineResult
            );
            showValue(newVal, key);
            groupEnd();
        }
        _value = newVal;
    };

    /* Delete property */
    if (delete target[key]) {
        /* Create new property with getter and setter */
        Object.defineProperty(target, key, {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true
        });
    }
    return;
}
