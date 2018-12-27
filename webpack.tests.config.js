const path = require("path");
const fs = require("fs");
const globSync = require("glob").sync

// Webpack entry points. Mapping from resulting bundle name to the source file entry.
const entries = {};
const outputPath = path.resolve(__dirname, "./dist_tests");

// Loop through subfolders for .test.ts/tsx/js files
const allFiles = globSync(__dirname + "/tests/**/*");
let fileCounter = 0;
allFiles.forEach(f => {
    if (fs.statSync(f).isFile()) {
        // find all test files, find their relative path and the name of the file (without extension)
        // use the filename as the key and relative path for creating the webpack
        if (f.endsWith(".test.ts") || f.endsWith(".test.tsx") || f.endsWith(".test.js")) {
            fileCounter++;
            const relativePath = path.relative(process.cwd(), f);
            const fName = fileCounter + "_" + path.parse(f).name;
            entries[fName] = "./" + relativePath;
        }
    }
});

module.exports = {
    entry: entries,
    output: {
        filename: "[name].js",
        path: outputPath
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader", "azure-devops-ui/buildScripts/css-variables-loader", "sass-loader"]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.woff$/,
                use: [{
                    loader: 'base64-inline-loader'
                }]
            },
            {
                test: /\.html$/,
                loader: "file-loader"
            }
        ]
    }
};
