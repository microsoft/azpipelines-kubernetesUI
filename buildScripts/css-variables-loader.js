/**
 * This webpack loader is used to post-process CSS containing CSS variables so that a default (non-themed) version works
 * on browsers that don't support CSS variables (IE 11).
 * 
 * This will find any var(--XXX) values in CSS and emit 2 styles, one with the default value, then a second
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

const utils = require("loader-utils");
const cssVariables = require("./CssVariablesLibrary.js");

module.exports = function(content) {
    this.cacheable();

    const options = utils.getOptions(this);
    
    const defaults = cssVariables.loadDefaultValues(options && options.defaultsPaths);
    const result = cssVariables.processCssContent(content, defaults);

    this.value = result;
    return result;
}