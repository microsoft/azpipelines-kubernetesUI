const path = require("path");
const fs = require("fs");
const globSync = require("glob").sync

const searchPattern = "/**/*";
const outputPathRelativePath = "./../dist_tests";
const testsFolderName = "tests";
const outputPath = path.resolve(__dirname, outputPathRelativePath);

// Webpack entry points. Mapping from resulting bundle name to the source file entry.
const entries = {};
// Loop through subfolders for .test.ts/tsx/js files
const allFiles = globSync(__dirname + searchPattern);
allFiles.forEach(f => {
    if (fs.statSync(f).isFile()) {
        if (f.endsWith(".test.ts") || f.endsWith(".test.tsx") || f.endsWith(".test.js")) {
            // find test file, use the relativepath + name as the key for webpack
            const relativePath = path.relative(process.cwd(), f);
            const parsedPath = path.parse(path.normalize(relativePath));
            const fName = path.join(parsedPath.dir, parsedPath.name);
            entries[fName] = path.normalize(f);
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
        rules: [{
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
            },
            { test: /\.(png|jpg)$/, loader: 'file-loader' },
        ]
    },
    node: {
        fs: 'empty',
        tls: 'mock',
        child_process: 'empty',
        net: 'empty'
    }
};
