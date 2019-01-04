/**
 * This build script will traverse all CSS files in a directory and post-process them such that any CSS variables
 * are emitted in a way that a default (non-themed) version works on browsers that don't support CSS variables (IE 11).
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
 * 
 * Required argument:
 *     --rootFolder: Folder under which to traverse all .css files
 * 
 * Optional argument:
 *     --defaults: List of JSON files (separated by semi-colon) to use as default values
 */

const fs = require("fs");
const glob = require("glob");
const parseArgs = require("minimist");
const cssVariables = require("./CssVariablesLibrary.js");

function processCssFile(file, defaults) {
    const originalContent = fs.readFileSync(file, "utf8");
    const newContent = cssVariables.processCssContent(originalContent, defaults);
    fs.writeFileSync(file, newContent);
}

async function processCss(rootFolder, defaultsPaths) {

    let defaults = cssVariables.loadDefaultValues(defaultsPaths);
    
    const files = await new Promise((resolve, reject) => {
        glob(rootFolder + "/**/*.css", (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });

    for (const file of files) {
        processCssFile(file, defaults);
    }
}

const parsedArgs = parseArgs(process.argv.slice(2));
const rootFolder = parsedArgs.root || ".";
const defaultsPaths = parsedArgs.defaults;

processCss(rootFolder, defaultsPaths ? defaultsPaths.split(";") : undefined);