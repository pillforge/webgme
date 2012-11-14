define([ "core/assert","core/mongo","core/lib/sha1","socket.io"], function (ASSERT,MONGO,SHA1,IO) {
    "use strict";
    var ProjectServer = function(options){
        ASSERT((options.io && options.namespace) || options.port);
        ASSERT(options.mongo);
        var _socket = null;
        var _mongo = MONGO(options.mongo);
        var _self = this;
        var _selfid = null;
        var KEY = "_id";
        var BID = "*";
        var _polls = {};
        var _commits = {};

        if(options.io){
            _socket = options.io.of(options.namespace);
            _selfid = "[PSRV-"+options.namespace+"]";
        } else {
            _socket = IO.listen(options.port);
            _selfid = "[PSRV-"+options.port+"]";
        }

        var _log = options.log || function(txt){ console.log(txt);};
        var log = function(txt,socketid){
            var prefix = _selfid;
            prefix += socketid === null ? "" : "["+socketid+"]";
            _log(prefix+txt);
        };

        var getBranchNameFromId = function(myid){
            //var regexp = new RegExp("^"+"\*");
            return myid.replace(/^\*/,'');
        };

        var compareRoots = function(oldroot,newroot){
            if(oldroot === null || oldroot.root === newroot.oldroot){
                return true;
            }
            console.log("root matching error old:"+JSON.stringify(oldroot)+" new:"+JSON.stringify(newroot));
            return false;
        };
        var broadcastRoot = function(root){
            var callbacks = _polls[getBranchNameFromId(root[KEY])];
            if(callbacks){
                for(var i=0;i<callbacks.length;i++){
                    callbacks[i](root);
                }
                delete _polls[getBranchNameFromId(root[KEY])];
            }
        };

        var isTruePredecessor = function(commit,predecessorcommit){
            if(_commits[commit]){
                if(_commits[commit].parents.indexOf(predecessorcommit) !== -1){
                    return true;
                } else {
                    var retval = false;
                    for(var i=0;i<_commits[commit].parents.length;i++){
                        retval = retval || isTruePredecessor(_commits[commit].parents[i],predecessorcommit);
                    }
                    return retval;
                }
            } else {
                return false;
            }
        };

        _socket.on('connection',function(socket){
            log("connection arrived",socket.id);

            /*mongo functions*/
            /*socket.on('open',function(callback){
                _mongo.open(callback);
            });*/
            socket.on('open',function(callback){
                _mongo.open(function(err){
                    if(err){
                        callback(err);
                    } else {
                        _commits = {};
                        _mongo.find({type:'commit'},function(err,commits){
                            if(!err){
                                for(var i=0;i<commits.length;i++){
                                    _commits[commits[i][KEY]] = commits[i];
                                }
                            }
                            callback();
                        });
                    }
                });
            });
            socket.on('load',function(key,callback){
                _mongo.load(key,callback);
            });
            /*socket.on('save',function(node,callback){

                var okay = false;

                var saving = function(){
                    _mongo.save(node,function(err){
                        if(!err){
                            if(_polls[node[KEY]]){
                                console.log('we have polls');
                                var object = _polls[node[KEY]];
                                for(var i=0;i<object.length;i++){
                                    console.log('calling poll');
                                    if(!!(object[i] && object[i].constructor && object[i].call && object[i].apply)){
                                        console.log('poll is a function');
                                        object[i](node);
                                    }
                                }
                                delete _polls[node[KEY]];
                            }
                            console.log('save callback '+node[KEY]);
                            callback();
                        } else {
                            callback(err);
                        }
                    });
                };

                //start of the function
                if(node[KEY].indexOf(BID) === 0){
                    _mongo.load(node[KEY],function(err,oldroot){
                        if(err){
                            callback(err);
                        } else {
                            if(compareRoots(oldroot,node)){
                                saving();
                            } else {
                                callback("invalid root cannot be saved!!!");
                            }
                        }
                    });
                } else {
                    saving();
                }
            });*/
            socket.on('save',function(node,callback){
                console.log('save '+node[KEY]);
                //check if the object is hash-based
                var rechash = node[KEY];
                node[KEY] = false;
                var comphash = SHA1(node);
                if(true/*comphash === rechash*/){
                    node[KEY] = rechash;
                    _mongo.save(node,function(err){
                        if(!err){
                            if(node.type && node.type === 'commit'){
                                console.log('save commit '+node[KEY]);
                                _commits[node[KEY]] = node;
                            }
                            console.log("saves "+node[KEY]);
                            callback();
                        } else {
                            console.log("save "+node[KEY]+" "+err);
                            callback(err);
                        }
                    });
                } else {
                    console.log("save "+node[KEY]+" invalid hash");
                    callback('invalid hash value');
                }
            });
            socket.on('remove',function(key,callback){
                _mongo.remove(key,callback);
            });
            socket.on('close',function(callback){
                _mongo.close(callback);
            });
            socket.on('removeAll',function(callback){
                _mongo.removeAll(callback);
            });
            socket.on('searchId',function(beginning,callback){
                _mongo.searchId(beginning,callback);
            });
            socket.on('dumpAll',function(callback){
                _mongo.dumpAll(callback);
            });
            socket.on('fsync',function(callback){
                _mongo.fsync(callback);
            });
            socket.on('find',function(criteria,callback){
                _mongo.find(criteria,callback);
            });

            //only branches accepts polls
            socket.on('requestPoll',function(key,callback){
                console.log('polling '+key+' for '+socket.id);
                if(_polls[key]){
                    _polls[key].push(callback);
                } else {
                    _polls[key] = [callback];
                }
            });

            socket.on('createBranch',function(name,callback){
                //TODO this should be a bit more sophisticated
                _mongo.save({'_id':"*#*"+name,name:name,type:'branch',commit:null},callback);
            });
            socket.on('deleteBranch',function(name,callback){
                _mongo.remove("*#*"+name,callback);
            });
            socket.on('updateBranch',function(name,commit,callback){
                //TODO if the server will not be exclusive - then we would have a lot of problems at this point
                if(_commits[commit]){
                    //we have to check whether the current commit value of the branch object is a predecessor of this commit
                    _mongo.load("*#*"+name,function(err,branch){
                        if(!err && branch){
                            if(isTruePredecessor(commit,branch.commit)){
                                //now we can update the branch
                                branch.commit = commit;
                                _mongo.save(branch,function(err){
                                    if(!err){
                                        if(_polls[name]){
                                            console.log('we have polls');
                                            var object = _polls[name];
                                            for(var i=0;i<object.length;i++){
                                                if(!!(object[i] && object[i].constructor && object[i].call && object[i].apply)){
                                                    object[i](branch);
                                                }
                                            }
                                            delete _polls[name];
                                        }
                                    }
                                    callback(err);
                                });
                            } else {
                                callback('not fastforward from earlier commit');
                            }
                        } else {
                            callback('not valid branch to update');
                        }
                    });
                } else {
                    callback('commit is not valid');
                }
            });
        });
    };
    return ProjectServer;
});

