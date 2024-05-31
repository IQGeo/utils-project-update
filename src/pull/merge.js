import * as jsonc from 'jsonc-parser';

// Key paths to overwrite template value with project value
const OVERWRITE_PATHS = [['modules']];

/**
 * @param {string} projectConfigStr
 * @param {string} templateConfigStr
 * @param {ProgressHandler} progress
 */
export function mergeIqgeorcFiles(projectConfigStr, templateConfigStr, progress) {
    const projectConfig = jsonc.parse(projectConfigStr);
    const templateConfig = jsonc.parse(templateConfigStr);

    const projectConfigRootNode = jsonc.parseTree(projectConfigStr);
    if (!projectConfigRootNode) return;

    const templateConfigRootNode = jsonc.parseTree(templateConfigStr);
    if (!templateConfigRootNode) return;

    /** @type {JSONPath[]} */
    const visitedPaths = []; // Key paths of visited properties
    /** @type {Edit[]} */
    const editOps = [];
    /** @type {Edit[]} */
    const overwriteOps = [];

    // Visit template config
    jsonc.visit(templateConfigStr, {
        onObjectProperty: (property, offset, length, startLine, startCharacter, pathSupplier) => {
            const propertyPath = [...pathSupplier(), property];

            // Push overwrite ops
            if (isExactPath(OVERWRITE_PATHS, propertyPath)) {
                const projectValNode = jsonc.findNodeAtLocation(
                    projectConfigRootNode,
                    propertyPath
                );
                if (!projectValNode) return;

                const templateValNode = jsonc.findNodeAtLocation(
                    templateConfigRootNode,
                    propertyPath
                );
                if (!templateValNode) return;

                const projectValStr = projectConfigStr.slice(
                    projectValNode.offset,
                    projectValNode.offset + projectValNode.length
                );

                overwriteOps.push({
                    offset: templateValNode.offset,
                    length: templateValNode.length,
                    content: projectValStr
                });

                return;
            }

            // Will be overwritten, so return
            if (isSubPath(OVERWRITE_PATHS, propertyPath)) return;

            visitedPaths.push(propertyPath);

            const templateVal = getNestedObjValue(templateConfig, propertyPath);
            // Skip object values as we'll handle their keys individually later on
            if (typeof templateVal === 'object' && !Array.isArray(templateVal)) return;

            const projectVal = getNestedObjValue(projectConfig, propertyPath);

            // Check for type mismatches
            if (projectVal && templateVal && typeof projectVal !== typeof templateVal) {
                progress.warn(
                    2,
                    `Detected type mismatch for property "${propertyPath.join(
                        '.'
                    )}": template value is ${JSON.stringify(
                        templateVal
                    )}, project value is ${JSON.stringify(projectVal)}. Discarding project value.`
                );

                return;
            }

            let newVal = projectVal || templateVal;

            // Merge arrays
            if (Array.isArray(projectVal) && Array.isArray(templateVal)) {
                newVal = [...new Set([...templateVal, ...projectVal])];
            }

            editOps.push(...jsonc.modify(templateConfigStr, propertyPath, newVal, {}));
        },

        onError: code => onError(code, progress)
    });

    // Visit project config
    jsonc.visit(projectConfigStr, {
        onObjectProperty: (property, offset, length, startLine, startCharacter, pathSupplier) => {
            const propertyPath = [...pathSupplier(), property];
            if (isSubPath([...OVERWRITE_PATHS, ...visitedPaths], propertyPath)) return;

            visitedPaths.push(propertyPath);

            const projectVal = getNestedObjValue(projectConfig, propertyPath);

            // If we've gotten this far, the property isn't expected as part of the template config
            progress.log(
                2,
                `Discarding unexpected property "${propertyPath.join(
                    '.'
                )}" with value ${JSON.stringify(projectVal)}`
            );
        },

        onError: code => onError(code, progress)
    });

    // Apply overwrite ops
    const overwrittenTemplateConfigStr = overwriteOps.reduce((str, op) => {
        const head = str.slice(0, op.offset);
        const tail = str.slice(op.offset + op.length);

        return `${head}${op.content}${tail}`;
    }, templateConfigStr);

    return jsonc.applyEdits(overwrittenTemplateConfigStr, editOps);
}

/**
 * Returns true if `path` is a subpath of any of the paths in `excludePaths`.
 *
 * @param {JSONPath[]} excludePaths
 * @param {JSONPath} path
 */
function isSubPath(excludePaths, path) {
    return excludePaths.some(excPath => excPath.every((val, i) => val === path[i]));
}

/**
 * Returns true if `path` is an exact match of any of the paths in `excludePaths`.
 *
 * @param {JSONPath[]} excludePaths
 * @param {JSONPath} path
 */
function isExactPath(excludePaths, path) {
    return excludePaths.some(
        excPath => excPath.length === path.length && excPath.every((val, i) => val === path[i])
    );
}

/**
 * @param {Record<PropertyKey, unknown>} obj
 * @param {JSONPath} path
 */
function getNestedObjValue(obj, path) {
    const next = obj[path[0]];

    if (!next || path.length === 1) {
        return next;
    }

    return getNestedObjValue(/** @type {typeof obj} */ (next), path.slice(1));
}

/**
 * @param {ParseErrorCode} code
 * @param {ProgressHandler} progress
 */
function onError(code, progress) {
    progress.error(2, `Unable to parse config token: ${jsonc.printParseErrorCode(code)}`);
}

/**
 * @typedef {import('jsonc-parser').JSONPath} JSONPath
 * @typedef {import('jsonc-parser').Edit} Edit
 * @typedef {import('jsonc-parser').ParseErrorCode} ParseErrorCode
 *
 * @typedef {import('../typedef.js').ProgressHandler} ProgressHandler
 */
