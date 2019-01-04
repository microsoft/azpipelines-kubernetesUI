/**
 * This utility is used to post-process CSS containing CSS variables so that a default (non-themed) version works
 * on browsers that don't support CSS variables (IE 11).
 *
 * This requires a JSON file containing the default values for all possible CSS variables. It will
 * find any var(--XXX) values in CSS and emit 2 styles, one with the default value, then a second
 * (higher precedence) that uses the CSS variable.
 *
 * So the following:
 *
 *   .button {
 *       color: var(--button-color);
 *   }
 *
 * becomes:
 *
 *   .button {
 *       color: #ccc;
 *       color: var(--button-color, #ccc);
 *   }
 *
 * given a defaults file like:
 *
 *   {
 *       "button-color": "#ccc"
 *   }
 */

const fs = require("fs");
const path = require("path");

const varString = "var(--";
const borderAttributes = {
    "border": true,
    "border-top": true,
    "border-right": true,
    "border-bottom": true,
    "border-left": true
};

function getVarReplacement(line, defaults, start, varReplacements) {
    const indexOfNextVar = line.indexOf(varString, start);

    if (indexOfNextVar === -1) return;
    // Need to find the end of the var function.  It will be a ), but it may not be the first one.
    // for example: var(--secondary-text, rgba(0, 0, 0, 0.55))
    let openParens = 0;
    let indexOfEndOfVar = -1;
    for (let j = indexOfNextVar + varString.length; j < line.length; j++) {
        let check = line[j];

        // Keep track of opened parens.  If we hit a closing paren and there were no open parens,
        // we found the end of the var.
        if (check === "(") {
            openParens++;
        } else if (check === ")") {
            if (openParens === 0) {
                indexOfEndOfVar = j;
                break;
            } else {
                openParens--;
            }
        }
    }

    if (indexOfEndOfVar === -1) {
        console.error(`Did not find closing bracket for var function:  ${line}}`);
        return;
    }

    const varInput = line.substr(indexOfNextVar + 4, indexOfEndOfVar - indexOfNextVar - 4);
    const varInputs = varInput.split(",");
    let themeEntry = varInputs[0].trim();
    const replacementVar = defaults[themeEntry.substr(2)];

    if (!replacementVar) {
        console.error(`Did not find replacement variable for: '${themeEntry}'. Line: ${line}`);
    }

    varReplacements.push({
        string: line.substr(indexOfNextVar, indexOfEndOfVar - indexOfNextVar + 1),
        replacement: replacementVar,
        defaultSet: varInputs.length === 2,
        themeEntry: themeEntry
    });

    getVarReplacement(line, defaults, indexOfEndOfVar, varReplacements);
}

function trimEnd(val) {
    // Shim trimEnd for older versions of node
    return ("x" + val).trim().substr(1);
}

function processCssLine(line, defaults, outputLines) {
    let writeOriginalLine = true;

    let duplicateLine = line;
    let defaultsLine = line;
    // Look to see if line might have an attribute
    let indexOfAttribute = line.indexOf(":");

    // If there is an attribute, then look for a var function.  var function will start witht  var(--
    if (indexOfAttribute > -1) {
        const indexOfFirstVar = line.indexOf(varString, indexOfAttribute);
        if (indexOfFirstVar > -1) {
            // There is a var function so we will be writing a duplicate attribute.
            const attribute = line.substr(0, indexOfAttribute);

            // Special-case handling for the "border" attribute for a bug in Safari where it doesn't support
            // rgba with a variable unless it is at the start of the border attribute. We will pull this out
            // into two separate statements. A border: with the width and fill, and a border-color with the
            // rgba/variable combo.
            //
            // Safari bug: https://bugs.webkit.org/show_bug.cgi?id=185940
            //
            // Example:
            //     border: 1px solid rgba(var(--palette-color), 0.1);
            //
            // becomes:
            //     border: 1px solid;
            //     border-color: rgba(var(--palette-color), 0.1);
            //
            // then gets each of these lines re-processed

            let rgbaIndex;
            if (borderAttributes[attribute.trim()] && (rgbaIndex = line.indexOf(" rgba(", indexOfAttribute + 1)) !== -1) {
                let preRgba = line.substr(indexOfAttribute + 1, rgbaIndex - indexOfAttribute - 1);
                if (preRgba) {
                    processCssLine(`${attribute}: ${preRgba};`, defaults, outputLines);
                    processCssLine(`${attribute}-color: ${line.substr(rgbaIndex + 1)}`, defaults, outputLines);
                    return;
                }
            }
            let replacements = [];
            getVarReplacement(line, defaults, indexOfFirstVar, replacements);

            for (let i = 0; i < replacements.length; i++) {
                let varReplacement = replacements[i];
                let string = varReplacement.string;
                let replacement = varReplacement.replacement;
                let defaultsReplacement = `var(${varReplacement.themeEntry},${varReplacement.replacement})`;

                duplicateLine = duplicateLine.replace(string, replacement);

                // If no default was set, then write the line back out with a default.
                if (!varReplacement.defaultSet) {
                    writeOriginalLine = false;
                    defaultsLine = defaultsLine.replace(string, defaultsReplacement);
                }
            }

            while (duplicateLine.endsWith("}")) {
                duplicateLine = trimEnd(duplicateLine.substr(0, duplicateLine.length - 1));
            }

            outputLines.push(duplicateLine);
        }
    }

    if (writeOriginalLine) {
        outputLines.push(line);
    } else {
        outputLines.push(defaultsLine);
    }
}

function processCssContent(content, defaults) {
    const originalLines = content.split("\n");
    const outputLines = [];

    originalLines.forEach(line => {
        processCssLine(line, defaults, outputLines);
    });

    return outputLines.join("\n");
}

function loadDefaultValues(defaultFilePaths) {
    let defaultsPaths = [path.join(__dirname, "cssDefaults.json")];

    if (defaultFilePaths) {
        defaultsPaths = defaultsPaths.concat(defaultFilePaths);
    }

    let defaults = {};
    defaultsPaths.forEach(file => {
        defaults = { ...defaults, ...JSON.parse(fs.readFileSync(file, "utf8")) };
    });

    return defaults;
}

module.exports = {
    processCssContent,
    loadDefaultValues
};
