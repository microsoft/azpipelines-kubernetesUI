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

prepPackage(azDevOpsPackageFolderName, azDevOpsWebPackConfigFileName, editAzDevOpsPackageJson);
prepPackage(webAppPackageFolderName, webAppWebPackConfigFileName, editWebAppPackageJson);

function prepPackage(packageFolderName, webpackConfigFileName, editPackageJsonCallback) {
    const binFolderPath = path.join(__dirname, "_bin");
    ensureDirExists(binFolderPath);
    
    const packageFolderPath = path.join(binFolderPath, packageFolderName);
    console.log(`Deleting folder: ${packageFolderName}`);
    rimraf.sync(packageFolderPath);

    console.log(`Creating folder: ${packageFolderName}`);
    fs.mkdirSync(packageFolderPath);
    fs.statSync
    console.log(`Copying package.json, README.md and LICENSE.txt to ${packageFolderName}`);
    filesToCopy = ["package.json", "README.md", "LICENSE.txt"];
    filesToCopy.forEach(fileName => {
        srcFilePath = path.join(__dirname, fileName);
        targetFilePath = path.join(packageFolderPath, fileName);
        fs.copyFileSync(srcFilePath, targetFilePath);
    });

    console.log(`Altering package.json inside ${packageFolderName}`);
    const targetPackageJsonPath = path.join(packageFolderPath, "package.json");
    let targetPackageJsonContent = fs.readFileSync(targetPackageJsonPath);
    let parsedTargetPackageJson = JSON.parse(targetPackageJsonContent);
    parsedTargetPackageJson = editPackageJsonCallback(parsedTargetPackageJson);
    fs.writeFileSync(targetPackageJsonPath, JSON.stringify(parsedTargetPackageJson, null, 2));

    console.log(`Copying dist folder to ${packageFolderName}`);
    const srcDistFolderPath = path.join(__dirname, "dist");
    const targetDistFolderPath = path.join(packageFolderPath, "dist");
    copydir.sync(srcDistFolderPath, targetDistFolderPath);

    console.log(`Running webpack for ${packageFolderName}`);
    const webPackConfigFilePath = path.join(__dirname, webpackConfigFileName);
    execSync(`webpack --mode production --config ${webPackConfigFilePath}`, {
        stdio: 'inherit'
    });

    console.log(`Packaging ${packageFolderName}`);
    execSync("npm pack", {
        cwd: packageFolderPath,
        stdio: 'inherit'
    });
}

function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath);
    }
}

function editAzDevOpsPackageJson(parsedPackageJson) {
    parsedPackageJson.name = azDevOpsPackageName;
    delete parsedPackageJson.dependencies["azure-devops-ui"];
    return parsedPackageJson;
}

function editWebAppPackageJson(parsedPackageJson) {
    parsedPackageJson.name = webAppPackageName;
    return parsedPackageJson;
}