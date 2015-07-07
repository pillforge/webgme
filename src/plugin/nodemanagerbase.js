/*globals requireJS*/
/*jshint node:true, newcap:false*/
/**
 * @author pmeijer / https://github.com/pmeijer
 */
'use strict';

var Core = requireJS('common/core/core'),
    PluginResult = requireJS('plugin/PluginResult'),
    PluginMessage = requireJS('plugin/PluginMessage'),
    Q = require('q');

/**
 * TODO: A single instance should be able to run on different projects (and cores)..
 *
 * @param blobClient
 * @param project
 * @param mainLogger
 * @param gmeConfig
 * @constructor
 */
function PluginNodeManagerBase(blobClient, project, mainLogger, gmeConfig) {
    var self = this;

    this.logger = mainLogger.fork('PluginNodeManagerBase');
    this.core = null;

    /**
     *
     * @param {string} pluginName
     * @param {object} pluginConfig - configuration for the plugin.
     * @param {object} context
     * @param {string} context.commitHash - commit from which to start the plugin.
     * @param {string} context.branchName - name of branch that should be updated
     * @param {string} [context.activeNode=''] - path to active node
     * @param {string[]} [context.activeSelection=[]] - paths to selected nodes.
     * @param callback
     */
    this.executePlugin = function (pluginName, pluginConfig, context, callback) {
        var plugin,
            Plugin,
            pluginLogger = self.logger.fork('plugin:' + pluginName);

        try {
            Plugin = getPlugin(pluginName);
        } catch (err) {
            callback(err.toString(), self.getPluginErrorResult(pluginName, 'Failed to load plugin.'));
            return;
        }
        plugin = new Plugin();
        plugin.initialize(pluginLogger, blobClient, gmeConfig);

        if (!pluginConfig) {
            pluginConfig = plugin.getDefaultConfig();
        }
        //TODO: Check that a passed config is consistent with the structure..
        plugin.setCurrentConfig(pluginConfig);

        this.core = new Core(project, {
            globConf: gmeConfig,
            logger: pluginLogger.fork('core')
        });

        self.loadContext(context)
            .then(function (pluginContext) {
                var startTime = (new Date()).toISOString(),
                    mainCallbackCalls = 0,
                    multiCallbackHandled = false;

                self.logger.debug('context loaded');
                pluginContext.project = project;
                pluginContext.branch = null; // Branch is only applicable on client side.
                pluginContext.projectName = project.projectId;
                pluginContext.core = self.core;

                plugin.configure(pluginContext); // (This does not modify pluginContext.)

                self.logger.debug('plugin configured, invoking main');
                plugin.main(function (err, result) {
                    var stackTrace;
                    if (result) {
                        self.logger.debug('plugin main callback called', {result: result.serialize()});
                    }
                    mainCallbackCalls += 1;
                    // set common information (meta info) about the plugin and measured execution times
                    result.setFinishTime((new Date()).toISOString());
                    result.setStartTime(startTime);

                    result.setPluginName(plugin.getName());

                    if (mainCallbackCalls > 1) {
                        stackTrace = new Error().stack;
                        self.logger.error('The main callback is being called more than once!', {metadata: stackTrace});
                        result.setError('The main callback is being called more than once!');
                        if (multiCallbackHandled === true) {
                            plugin.createMessage(null, stackTrace);
                            return;
                        }
                        multiCallbackHandled = true;
                        result.setSuccess(false);
                        plugin.createMessage(null, 'The main callback is being called more than once.');
                        plugin.createMessage(null, stackTrace);
                        callback('The main callback is being called more than once!', result);
                    } else {
                        result.setError(err);
                        callback(err, result);
                    }
                });
            })
            .catch(function (err) {
                var pluginResult = self.getPluginErrorResult(pluginName, 'Exception got thrown');
                self.logger.error(err.stack);
                callback(err.message, pluginResult);
            });
    };

    function getPlugin(name) {
        var pluginPath = 'plugin/' + name + '/' + name + '/' + name;
        self.logger.debug('requireJS plugin from path: ' + pluginPath);
        return requireJS('plugin/' + name + '/' + name + '/' + name);
    }

    this.getPluginErrorResult = function (pluginName, message) {
        var pluginResult = new PluginResult(),
            pluginMessage = new PluginMessage();
        pluginMessage.severity = 'error';
        pluginMessage.message = message;
        pluginResult.setSuccess(false);
        pluginResult.pluginName = pluginName;
        pluginResult.addMessage(pluginMessage);
        pluginResult.setStartTime((new Date()).toISOString());
        pluginResult.setFinishTime((new Date()).toISOString());
        pluginResult.setError(pluginMessage.message);
    };

    /**
     *
     * @param {object} context
     * @param {string} context.commitHash - commit from which to start the plugin.
     * @param {string} context.branchName - name of branch that should be updated
     * @param {string} [context.activeNode=''] - path to active node
     * @param {string[]} [context.activeSelection=[]] - paths to selected nodes.
     */
    this.loadContext = function (context) {
        var deferred = Q.defer(),
            pluginContext = {
                branchName: context.branchName,
                commitHash: context.commitHash,

                rootNode: null,
                activeNode: null,
                activeSelection: null,
                META: null
            };
        self.logger.debug('loading context');
        Q.ninvoke(project, 'loadObject', context.commitHash)
            .then(function (commitObject) {
                var rootDeferred = Q.defer();
                self.logger.debug('commitObject loaded', {metadata: commitObject});
                self.core.loadRoot(commitObject.root, function (err, rootNode) {
                    if (err) {
                        rootDeferred.reject(err);
                    } else {
                        self.logger.debug('rootNode loaded');
                        rootDeferred.resolve(rootNode);
                    }
                });

                return rootDeferred.promise;
            })
            .then(function (rootNode) {
                pluginContext.rootNode = rootNode;
                // Load active node
                return self.loadNodeByPath(rootNode, context.activeNode || '');
            })
            .then(function (activeNode) {
                pluginContext.activeNode = activeNode;
                self.logger.debug('activeNode loaded');
                // Load active selection
                return self.loadNodesByPath(pluginContext.rootNode, context.activeSelection || []);
            })
            .then(function (activeSelection) {
                pluginContext.activeSelection = activeSelection;
                self.logger.debug('activeSelection loaded');
                // Load meta nodes
                var metaIds = self.core.getMemberPaths(pluginContext.rootNode, 'MetaAspectSet');
                return self.loadNodesByPath(pluginContext.rootNode, metaIds, true);
            })
            .then(function (metaNodes) {
                pluginContext.META = metaNodes;
                self.logger.debug('metaNodes loaded');
                deferred.resolve(pluginContext);
            })
            .catch(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    this.loadNodeByPath = function (rootNode, path) {
        var deferred = Q.defer();
        self.core.loadByPath(rootNode, path, function (err, rootNode) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(rootNode);
            }
        });
        return deferred.promise;
    };

    this.loadNodesByPath = function (rootNode, nodePaths, returnNameMap) {
        var deferred = Q.defer(),
            len = nodePaths.length,
            error = '',
            nodes = [];

        var allNodesLoadedHandler = function () {
            var nameToNode = {};

            if (error) {
                deferred.reject(error);
                return;
            }

            if (returnNameMap) {
                nodes.map(function (node) {
                    //TODO: what if the names are equal?
                    nameToNode[self.core.getAttribute(node, 'name')] = node;
                });
                deferred.resolve(nameToNode);
            } else {
                deferred.resolve(nodes);
            }
        };

        var loadedNodeHandler = function (err, nodeObj) {
            if (err) {
                error += err;
            }
            nodes.push(nodeObj);

            if (nodes.length === nodePaths.length) {
                allNodesLoadedHandler();
            }
        };

        if (len === 0) {
            allNodesLoadedHandler();
        }
        while (len--) {
            self.core.loadByPath(rootNode, nodePaths[len], loadedNodeHandler);
        }

        return deferred.promise;
    };
}

module.exports = PluginNodeManagerBase;