const path = require('path');
const webpack = require('webpack');  // Make sure this line is present

module.exports = {
    entry: './js/send_data_transaction.js', // Entry file
    output: {
        filename: 'bundle.js', // Output file
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.mjs', '.json'],  // Specify allowed extensions
        fallback: {
            crypto: require.resolve('crypto-browserify'), // Fallback for crypto
            stream: require.resolve('stream-browserify'), // Fallback for stream
            assert: require.resolve('assert/'), // Fallback for assert if needed
            buffer: require.resolve('buffer/'),
            process: require.resolve('process/browser'),  // Add fallback for 'process'
            vm: require.resolve('vm-browserify'), // Add fallback for 'vm'
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',  // Provide 'process' globally in the browser
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
};
