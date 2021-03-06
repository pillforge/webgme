/**
 * @author kecso / https://github.com/kecso
 */

var requirejs = require('requirejs'),
    FS = require('fs'),
    path = FS.readdirSync('./node_modules').indexOf('requirejs') === -1 ?
        '../../requirejs/require' : '../node_modules/requirejs/require',
    config = {
        name: 'webgme.classes',
        out: './dist/webgme.classes.build.js',
        baseUrl: './src',
        paths: {
            'webgme.classes': '../utils/build/webgme.classes/webgme.classes',
            blob: './common/blob',
            executor: './common/executor',
            superagent: './client/lib/superagent/superagent',
            debug: './client/lib/debug/debug',
            underscore: './client/lib/underscore/underscore',
            q: './client/lib/q/q',
            js: './client/js/',
            lib: './client/lib/',
            'js/Dialogs/PluginConfig/PluginConfigDialog': '../utils/build/empty/empty',
            teststorage: '../teststorage'
        },
        optimize: 'none',
        generateSourceMaps: true,
        insertRequire: ['webgme.classes'],
        wrap: {
            startFile: './utils/build/webgme.classes/start.frag',
            endFile: './utils/build/webgme.classes/end.frag'
        },
        include:[path]
    };

requirejs.optimize(config, function (data) {
    console.log(data);
}, function (err) {
    console.log(err);
});
