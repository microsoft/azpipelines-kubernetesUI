const path = require("path");
const fs = require("fs");

// Webpack entry points. Mapping from resulting bundle name to the source file entry.
const entries = {};
const outputPath = path.resolve(__dirname, "./dist_tests");

// Loop through subfolders in the "pages" folder and add an entry for each one
const testsDir = path.join(__dirname, "tests");
fs.readdirSync(testsDir).filter(dir => {
    if (fs.statSync(path.join(testsDir, dir)).isDirectory()) {
        entries[dir] = "./" + path.relative(process.cwd(), path.join(testsDir, dir, dir));
    }
});

module.exports = {
    entry: entries,
    output: {
        filename: "[name]/[name].js",
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
