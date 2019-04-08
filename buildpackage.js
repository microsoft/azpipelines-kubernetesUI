/**
 * This is solely a build script, intended to prep the twin packages for publishing.
 */

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const copydir = require("copy-dir");
const execSync = require("child_process").execSync;

// AzDevOps Package Constants
const azDevOpsPackageName = "@azurepipelines/azdevops-kube-summary";
const azDevOpsWebPackConfigFileName = "azdevops.webpack.config.js";
const azDevOpsPackageFolderName = "azDevOpsPackage";

// WebApp Package Constants
const webAppPackageName = "@azurepipelines/webapp-kube-summary";
const webAppWebPackConfigFileName = "webapp.webpack.config.js";
const webAppPackageFolderName = "webAppPackage";

// The first argument is the full path of the node command. The second element is the full path of the file being executed.
// All the additional arguments are present from the third position going forward.

var args = process.argv.slice(2);
args.forEach((value, index) => {
    console.log(`${index}: ${value}`)
});

if (args.length === 0 || args.some(arg => arg.toLowerCase() === azDevOpsPackageFolderName.toLowerCase())) {
    prepPackage(azDevOpsPackageFolderName, azDevOpsWebPackConfigFileName, editAzDevOpsPackageJson, azDevOpsDistFilter);
}

if (args.length === 0 || args.some(arg => arg.toLowerCase() === webAppPackageFolderName.toLowerCase())) {
    prepPackage(webAppPackageFolderName, webAppWebPackConfigFileName, editWebAppPackageJson);
}

function prepPackage(packageFolderName, webpackConfigFileName, editPackageJsonCallback, distFilter) {
    const packageFolderPath = createPackageFolder(packageFolderName);

    filesToCopy = ["package.json", "README.md", "LICENSE.txt"];
    console.log(`Copying ${filesToCopy.join(", ")} to ${packageFolderName}`);
    copyFiles(filesToCopy, packageFolderPath);

    console.log(`Altering package.json inside ${packageFolderName}`);
    const targetPackageJsonPath = path.join(packageFolderPath, "package.json");
    editPackageJson(targetPackageJsonPath, editPackageJsonCallback);

    console.log(`Copying dist folder to ${packageFolderName}`);
    copyDistFolder(packageFolderPath, distFilter)

    console.log(`Running webpack for ${packageFolderName}`);
    const webPackConfigFilePath = path.join(__dirname, webpackConfigFileName);
    execSync(`webpack --mode production --config ${webPackConfigFilePath}`, {
        stdio: "inherit"
    });

    console.log(`Packaging ${packageFolderName}`);
    execSync("npm pack", {
        cwd: packageFolderPath,
        stdio: "inherit"
    });
}

function createPackageFolder(packageFolderName) {
    const binFolderPath = path.join(__dirname, "_bin");
    ensureDirExists(binFolderPath);
    
    const packageFolderPath = path.join(binFolderPath, packageFolderName);
    console.log(`Deleting folder: ${packageFolderName}`);
    rimraf.sync(packageFolderPath);

    console.log(`Creating folder: ${packageFolderName}`);
    fs.mkdirSync(packageFolderPath);

    return packageFolderPath;
}

function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath);
    }
}

function copyFiles(filesToCopy, packageFolderPath) {
    filesToCopy.forEach(fileName => {
        srcFilePath = path.join(__dirname, fileName);
        targetFilePath = path.join(packageFolderPath, fileName);
        fs.copyFileSync(srcFilePath, targetFilePath);
    });
}

function copyDistFolder(packageFolderPath, distFilter) {
    const srcDistFolderPath = path.join(__dirname, "dist");
    const targetDistFolderPath = path.join(packageFolderPath, "dist");
    copydir.sync(srcDistFolderPath, targetDistFolderPath, distFilter);
}

function azDevOpsDistFilter(stat, filepath, filename) {
    if (stat === 'file' && filename.startsWith("ContentReader")) {
        console.log(`Skipping copying ${filename}`);
        return false;
    }
    else if (stat === 'directory' && filename === 'img') { // do not copy 'img' folder containing svg
        console.log(`Skipping copying ${filename}`);
        return false;
    }

    return true;
}

function editPackageJson(targetPackageJsonPath, editContentCallback) {
    let targetPackageJsonContent = fs.readFileSync(targetPackageJsonPath);
    let parsedTargetPackageJson = JSON.parse(targetPackageJsonContent);
    parsedTargetPackageJson = editContentCallback(parsedTargetPackageJson);
    fs.writeFileSync(targetPackageJsonPath, JSON.stringify(parsedTargetPackageJson, null, 2));
}

function editAzDevOpsPackageJson(parsedPackageJson) {
    parsedPackageJson.name = azDevOpsPackageName;
    delete parsedPackageJson.dependencies["azure-devops-ui"];
    delete parsedPackageJson.dependencies["monaco-editor"];
    return parsedPackageJson;
}

function editWebAppPackageJson(parsedPackageJson) {
    parsedPackageJson.name = webAppPackageName;
    return parsedPackageJson;
}