import * as CopyWebpackPlugin from "copy-webpack-plugin";
import * as path from "path";
// tslint:disable-next-line
const ResponsiveJSONWebpackPlugin = require("responsive-json-webpack-plugin");
import { Configuration } from "webpack";

const srcFolder = path.resolve("./src");

const configuration: Configuration = {
    devtool: "source-map",
    entry: ["background", "content", "options"].reduce(
        (entries, name) =>
            Object.assign(entries, {
                [name]: ["@babel/polyfill", path.join(srcFolder, name)],
            }),
        {},
    ),
    mode: "production",
    module: {
        rules: [
            {
                exclude: /(node_modules|bower_components)/,
                test: /\.tsx?$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/react", "@babel/preset-typescript"],
                    },
                },
            },
        ],
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "./dist"),
    },
    plugins: [
        new CopyWebpackPlugin(
            ["content", "options"].reduce(
                (config, name) => {
                    config.push(
                        ...["html", "css"].map(ext => ({
                            from: path.join(srcFolder, name, `index.${ext}`),
                            to: `${name}.${ext}`,
                        })),
                    );
                    return config;
                },
                [{ from: path.join(srcFolder, "manifest.json") }],
            ),
        ),
        new ResponsiveJSONWebpackPlugin({
            outputFolder: ".",
        }),
    ],
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        modules: [srcFolder, path.resolve("./node_modules")],
    },
};

export default configuration; // tslint:disable-line