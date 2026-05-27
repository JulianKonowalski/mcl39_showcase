const path              = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    context: __dirname,
    entry: "./src/index.tsx",
    mode: "development",
    devServer: {
        static: { directory: path.join(__dirname, 'public') },
        historyApiFallback: true,
    },
    resolve: {
        extensions: [".tsx", ".jsx", ".js", ".ts"]
    },
    module: {
        rules: [
            {
                test: /\.jsx$/,
                exclude: "/node_modules/",
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-react"],
                }
            },
            {
                test: /\.tsx$/,
                exclude: "/node_modules/",
                use: "ts-loader"
            },
            {
                test: /\.ts$/,
                exclude: "/node_modules/",
                use: "ts-loader"
            },
            {
                test: /\.js$/,
                type: "javascript/auto"
            },
            {
                test: /\.wasm$/,
                loader: "file-loader",
                type: "javascript/auto"
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.data$/,
                type: "asset/resource"
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: "asset/resource"
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({ template: "./src/index.html" }),
    ],
};