import * as jsonc from 'jsonc-parser';

/**
 * Key paths to overwrite template value with project value.
 *
 * @type {ReadonlyArray<JSONPath>}
 */
const OVERWRITE_PATHS = [['modules']];

/**
 * Merges project iqgeorc with template iqgeorc.
 *
 * Walks through template config properties and replaces each value with matching
 * values from the project config, then walks through project config properties
 * and discards any unexpected ones, and finally, overwrites template values
 * with project values using properties specified in {@link OVERWRITE_PATHS}.
 *
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

    /**
     * Key paths of visited properties.
     *
     * @type {JSONPath[]}
     */
    const visitedPaths = [];
    /** @type {Edit[]} */
    const editOps = [];

    // Visit template config
    jsonc.visit(templateConfigStr, {
        onObjectProperty: (property, offset, length, startLine, startCharacter, pathSupplier) => {
            const propertyPath = [...pathSupplier(), property];
            if (isSubPath(OVERWRITE_PATHS, propertyPath)) return; // Will be overwritten

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

    // Apply overwrites
    const overwrittenTemplateConfigStr = OVERWRITE_PATHS.reduce((str, path) => {
        const projectValNode = jsonc.findNodeAtLocation(projectConfigRootNode, path);
        if (!projectValNode) return str;

        const templateValNode = jsonc.findNodeAtLocation(templateConfigRootNode, path);
        if (!templateValNode) return str;

        const projectValStr = projectConfigStr.slice(
            projectValNode.offset,
            projectValNode.offset + projectValNode.length
        );

        const head = str.slice(0, templateValNode.offset);
        const tail = str.slice(templateValNode.offset + templateValNode.length);

        return `${head}${projectValStr}${tail}`;
    }, templateConfigStr);

    return jsonc.applyEdits(overwrittenTemplateConfigStr, editOps);
}

/**
 * Returns true if `path` is a subpath of any of the paths in `excludePaths`.
 *
 * @param {ReadonlyArray<JSONPath>} excludePaths
 * @param {JSONPath} path
 */
function isSubPath(excludePaths, path) {
    return excludePaths.some(excPath => excPath.every((val, i) => val === path[i]));
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
