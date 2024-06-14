import * as diff from 'diff';
import * as jsonc from 'jsonc-parser';

/**
 * Compares `.iqgeorc.jsonc` files from project and template, checking for missing keys,
 * unexpected keys, and type mismatches.
 *
 * @param {string} projectIqgeorcStr
 * @param {string} templateIqgeorcStr
 */
export function compareIqgeorc(projectIqgeorcStr, templateIqgeorcStr) {
    /** @type {Record<string, unknown>} */
    const projectIqgeorc = jsonc.parse(projectIqgeorcStr);
    /** @type {Config} */
    const templateIqgeorc = jsonc.parse(templateIqgeorcStr);

    /** @type {Record<"missingKeys" | "unexpectedKeys" | "typeMismatches", string[]>} */
    const diffs = {
        missingKeys: [],
        unexpectedKeys: [],
        typeMismatches: []
    };

    /**
     * @param {Record<string, unknown>} obj1
     * @param {Record<string, unknown>} obj2
     * @param {string} path
     */
    function compareObjects(obj1, obj2, path = '') {
        Object.keys(obj1).forEach(key => {
            const joinedPath = path ? `${path}.${key}` : key;
            const val2 = obj2[key];

            delete obj2[key]; // Delete expected keys so we're left with only unexpected ones below

            // Check missing keys
            if (val2 === undefined) {
                diffs.missingKeys.push(joinedPath);

                return;
            }

            const isArr = Array.isArray(obj1[key]);

            // Check type mismatches
            if ((isArr && !Array.isArray(val2)) || typeof obj1[key] !== typeof val2) {
                diffs.typeMismatches.push(joinedPath);

                return;
            }

            // Check nested objects
            if (typeof obj1[key] === 'object' && !isArr) {
                // @ts-expect-error TS can't infer the correct type, but we know it's an object
                compareObjects(obj1[key], val2, joinedPath);

                return;
            }
        });

        diffs.unexpectedKeys = Object.keys(obj2);

        return diffs;
    }

    return compareObjects(templateIqgeorc, projectIqgeorc);
}

/**
 * Merges custom sections from `projectFileStr` into `templateFileStr`.
 *
 * @param {string} templateFileStr
 * @param {string} projectFileStr
 */
export function mergeCustomSections(templateFileStr, projectFileStr) {
    const diffs = diff.diffLines(templateFileStr, projectFileStr);

    let mergedText = '';

    diffs.forEach(part => {
        // `part.added` is true for project file changes, so we parse
        // and add custom sections from those below.
        // Otherwise, we just add the template text as-is.
        if (!part.added) {
            mergedText += part.value;

            return;
        }

        // Start of part value is continuation of custom section content
        if (
            /# START CUSTOM SECTION((?!\s*# END CUSTOM SECTION).*?\s*?)?$/.test(mergedText) &&
            !/^\s*# START CUSTOM SECTION.*/.test(part.value)
        ) {
            mergedText += part.value.split(/# END CUSTOM SECTION/)[0];
        }

        // Extract custom sections from project file
        const sections =
            // Parts can either have complete custom sections, or just the start or end of one
            part.value.match(/\s*# START CUSTOM SECTION.*?# END CUSTOM SECTION\s*/gs) ||
            part.value.match(/\s*# START CUSTOM SECTION.*|.*?# END CUSTOM SECTION\s/gs);
        if (!sections) return;

        const joinedSections = sections.join('');
        if (mergedText.endsWith(joinedSections)) return;

        // Ensure no duplicate custom section lines/blocks
        if (/^\s*# START CUSTOM SECTION/.test(joinedSections)) {
            const splitByStartDelimiter = mergedText.split(/(?=# START CUSTOM SECTION)/g);
            const popped = splitByStartDelimiter.pop();

            // If merged text ends with a custom section block, remove it before adding new ones
            if (
                popped &&
                /# START CUSTOM SECTION/.test(popped) &&
                (/# END CUSTOM SECTION\s*$/.test(popped) || !/# END CUSTOM SECTION\s/.test(popped))
            ) {
                mergedText = splitByStartDelimiter.join('') + joinedSections.trimStart();

                return;
            }
        }

        mergedText += joinedSections;
    });

    return mergedText;
}

/**
 * @typedef {import('../typedef.js').Config} Config
 */
