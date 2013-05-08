/*
 * Copyright (C) 2012-2013 Vanderbilt University, All rights reserved.
 *
 * Author: Tamas Kecskes
 */

define([ "util/assert","util/sha1"], function (ASSERT,SHA1) {
    "use strict";
    var HASH_REGEXP = new RegExp("^#[0-9a-zA-Z_]*$");

    function Database(_database,options){
        ASSERT(typeof options === "object" && typeof _database === "object");

        function openProject (projectName, callback) {

            var _project = null;
            _database.openProject(projectName,function(err,proj){
                if(!err && proj){
                    _project = proj;
                    callback(null,{
                        fsyncDatabase: _project.fsyncDatabase,
                        closeProject: _project.closeProject,
                        loadObject: _project.loadObject,
                        insertObject: _project.insertObject,
                        findHash: _project.findHash,
                        dumpObjects: _project.dumpObjects,
                        getBranchNames: _project.getBranchNames,
                        getBranchHash: _project.getBranchHash,
                        setBranchHash: _project.setBranchHash,
                        getCommits: _project.getCommits,
                        makeCommit: makeCommit
                    });
                } else {
                    callback(err,proj);
                }
            });

            function makeCommit(parents,roothash,msg,callback){
                //THERE IS NO SENSE TO CALL THIS METHOD!!!
                //we implement only because of the API
                ASSERT(HASH_REGEXP.test(roothash));
                ASSERT(typeof callback === 'function');
                parents = parents || [];
                msg = msg || "n/a";

                var commitObj = {
                    _id     : "",
                    root    : roothash,
                    parents : parents,
                    updater : ['TODO'],
                    time    : (new Date()).getTime(),
                    message : msg,
                    type    : "commit"
                };

                commitObj._id = '#' + SHA1(JSON.stringify(commitObj));
                _project.insertObject(commitObj,callback);
                return commitObj._id;
            }
        }

        return {
            openDatabase : _database.openDatabase,
            closeDatabase: _database.closeDatabase,
            fsyncDatabase: _database.fsyncDatabase,
            getProjectNames: _database.getProjectNames,
            getDatabaseStatus: _database.getDatabaseStatus,
            openProject: openProject,
            deleteProject: _database.deleteProject,
            ID_NAME: _database.ID_NAME
        };
    }

    return Database;
});


