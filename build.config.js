// Build Configuration
module.exports = {
    css: {
        input: 'src/styles',
        output: 'dist/css',
        components: [
            'base/reset.css',
            'components/*.css',
            'layouts/*.css',
            'utilities/*.css'
        ]
    },
    js: {
        input: 'src',
        output: 'dist/js',
        modules: [
            'config/*.js',
            'utils/*.js',
            'services/*.js',
            'components/**/*.js',
            'app.js'
        ]
    }
};