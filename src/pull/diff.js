import * as diff from 'diff';

/**
 * Compares `.iqgeorc.jsonc` files from project and template, checking for missing keys,
 * unexpected keys, and type mismatches.
 *
 * @param {Record<string, unknown>} projectIqgeorc
 * @param {Record<string, unknown>} templateIqgeorc
 */
export function compareIqgeorc(projectIqgeorc, templateIqgeorc) {
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

    return compareObjects({ ...templateIqgeorc }, { ...projectIqgeorc });
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

        const sections =
            // Parts can either have complete custom sections, or just the start/end tag
            part.value.match(/\s*# START CUSTOM SECTION.*?# END CUSTOM SECTION\s*/gs) ||
            part.value.match(/\s*# START CUSTOM SECTION.*|.*?# END CUSTOM SECTION\s*/gs);

        const extraText =
            !/^\s*# START CUSTOM SECTION.*/s.test(part.value) &&
            part.value.split(/# END CUSTOM SECTION/)[0];

        if (!sections && !extraText) {
            return;
        }

        const mergedTextSplitByStartTag = mergedText.split(/(?=# START CUSTOM SECTION)/g);

        let mergedTextSectionPop = /** @type {string} */ (mergedTextSplitByStartTag.pop());

        const isContinuation =
            /# START CUSTOM SECTION/.test(mergedTextSectionPop) &&
            !/# END CUSTOM SECTION/.test(mergedTextSectionPop);

        // Add any extra text from start of part.value as continuation of open section
        if (extraText && isContinuation) {
            mergedText =
                mergedTextSplitByStartTag.join('') +
                mergedTextSectionPop.replace(/(?<=\n\s*).*/s, '') + // Remove placeholder text
                extraText;
        }

        if (sections) {
            // Prevent leaving duplicate section from template
            if (
                !extraText &&
                (isContinuation || /# END CUSTOM SECTION\s*$/s.test(mergedTextSectionPop))
            ) {
                // Discard last section and normalise indentation
                mergedText = mergedTextSplitByStartTag.join('').replace(/[ \t]*$/, '');
            }

            mergedText += sections.join('');
        }
    });

    return mergedText;
}

/**
 * @typedef {import('../typedef.js').Config} Config
 */
