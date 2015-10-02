/*globals define*/
/*jshint node: true, browser: true*/

/**
 * This class defines the public API of the WebGME-Core
 *
 * @author kecso / https://github.com/kecso
 * @module Core
 */

/**
 * @typedef {object} Node - the object that represents the atomic element of the containment hierarchy.
 */

/**
 * @typedef {object} DataObject - Inner data of {@link module:Core~Node} that can be serialized and saved in the storage.
 */

/**
 * @typedef {object} GmePersisted - the result object of a persist which contains information about the newly
 * created data objects.
 * @prop {module:Core~ObjectHash} rootHash - Hash of the root node.
 * @prop {Object.<module:Core~ObjectHash, module:Core~DataObject>} objects - Hash of the root node.
 */

/**
 * @typedef {string} ObjectHash - Unique SHA-1 hash for the node object.
 * @example
 * '#5496cf226542fcceccf89056f0d27564abc88c99'
 */

/**
 * @typedef {string} GUID - Globally unique identifier. A formatted string containing hexadecimal characters. If some
 * projects share some GUIDs that can only be because the node with the given identification represents the same
 * concept.
 * @example
 * 'cd891e7b-e2ea-e929-f6cd-9faf4f1fc045'
 */

/**
 * @typedef {object} Constraint - An object that represents some additional rule regarding some node of the project.
 * @prop {string} script - The script which checks if the contraint is met.
 * @prop {string} info - Short description of the constraint.
 * @prop {string} priority - Gives instructions on how to deal with violations of the constraint.
 */

/**
 * @typedef {object} RelationRule - An object that represents a relational type rule-set (pointer/set).
 * @prop {integer} [min] - The minimum amount of target necessary for the relationship (if not present or '-1'
 * then there is no minimum rule that applies)
 * @prop {integer} [max] - The minimum amount of target necessary for the relationship (if not present or '-1'
 * then there is no minimum rule that applies)
 * @prop {object} [absolutePathOfTarget] - special rules regarding the given type (if the object is empty, it still
 * represents that the type is a valid target of the relationship)
 * @prop {integer} [absolutePathOfTarget.min] - The minimum amount of target necessary for the relationship
 * from the given type (if not present or '-1' then there is no minimum rule that applies)
 * @prop {integer} [absolutePathOfTarget.max] - The minimum amount of target necessary for the relationship
 * from the given type (if not present or '-1' then there is no minimum rule that applies)
 * @example
 * '{
 *  'min': 1,
 *  'max': -1,
 *  'any/path/of/node':{
 *   'min':-1,
 *   'max':2
 *   },
 *   'any/other/valid/path':{
 *   }
 * }'
 */

define([
    'common/core/corerel',
    'common/core/setcore',
    'common/core/guidcore',
    'common/core/nullpointercore',
    'common/core/coreunwrap',
    'common/core/coretype',
    'common/core/constraintcore',
    'common/core/coretree',
    'common/core/metacore',
    'common/core/coretreeloader',
    'common/core/corediff',
    'common/core/metacachecore'
], function (CoreRel,
             Set,
             Guid,
             NullPtr,
             UnWrap,
             Type,
             Constraint,
             CoreTree,
             MetaCore,
             TreeLoader,
             CoreDiff,
             MetaCacheCore) {
    'use strict';

    /**
     * @param {object} storageObject
     * @param {object} options - contains logging information
     * @alias Core
     * @constructor
     */
    function Core(storage, options) {
        var core,
            coreLayers = [];
        coreLayers.push(CoreRel);
        coreLayers.push(NullPtr);
        coreLayers.push(Type);
        coreLayers.push(NullPtr);
        coreLayers.push(Set);
        coreLayers.push(Guid);
        coreLayers.push(Constraint);
        coreLayers.push(MetaCore);
        coreLayers.push(CoreDiff);
        coreLayers.push(TreeLoader);
        coreLayers.push(MetaCacheCore);

        if (options.usertype !== 'tasync') {
            coreLayers.push(UnWrap);
        }

        core = coreLayers.reduce(function (inner, Class) {
            return new Class(inner, options);
        }, new CoreTree(storage, options));

        /**
         * Returns the parent of the node.
         * @param {module:Core~Node} node - the node in question
         *
         * @return {module:Core~Node} Returns the parent of the node or NULL if it has no parent.
         *
         * @func
         */
        this.getParent = core.getParent;

        /**
         * Returns the parent-relative identifier of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string} Returns the id string or return NULL and UNDEFINED if there is no such id for the node.
         *
         * @func
         */
        this.getRelid = core.getRelid;

        //this.getLevel = core.getLevel;

        /**
         * Returns the root node of the containment tree.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {module:Core~Node} Returns the root of the containment hierarchy (it can be the node itself).
         *
         * @func
         */
        this.getRoot = core.getRoot;

        /**
         * Retuns the complete path of the node in the containment hierarchy.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string} Returns a path string where each portion is a relative id and they are separated by '/'.
         * The path can be empty as well if the node in question is the  root itself, otherwise it should be a chain
         * of relative ids from the root of the containment hierarchy.
         *
         * @func
         */
        this.getPath = core.getPath;

        //this.isValidPath = core.isValidPath;
        //this.splitPath = core.splitPath;
        //this.buildPath = core.buildPath;
        //this.joinPaths = core.joinPaths;
        //this.getCommonPathPrefixData = core.getCommonPathPrefixData;
        //this.normalize = core.normalize;
        //this.getAncestor = core.getAncestor;
        //this.isAncestor = core.isAncestor;
        //this.createRoot = core.createRoot;
        //this.createChild = core.createChild;

        /**
         * Retrieves the child of the input node at the given relative id. It is not an asynchronous load
         * and it automatically creates the child under the given relative id if no child was there beforehand.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} relativeId - the relative id which our child in question has.
         *
         * @return {module:Core~Node} Return an empty node if it was created as a result of the function or
         * return the already existing and loaded node if it found.
         *
         * @func
         */
        this.getChild = core.getChild;

        //this.getDescendant = core.getDescendant;
        //this.getDescendantByPath = core.getDescendantByPath;
        //this.isMutable = core.isMutable;
        //this.isObject = core.isObject;

        /**
         * Checks if the node in question is exists or not.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {bool} Returns true if the node is 'empty' meaning that it is not reserved by real data.
         * Returns false if the node is exists and have some meaningful value.
         *
         * @func
         */
        this.isEmpty = core.isEmpty;

        //this.mutate = core.mutate;
        //this.getData = core.getData;
        //this.setData = core.setData;
        //this.deleteData = core.deleteData;
        //this.copyData = core.copyData;
        //this.getProperty = core.getProperty;
        //this.setProperty = core.setProperty;
        //this.deleteProperty = core.deleteProperty;
        //this.getKeys = core.getKeys;
        //this.getRawKeys = core.getRawKeys;
        //this.isHashed = core.isHashed;
        //this.setHashed = core.setHashed;

        /**
         * Returns the calculated database id of the data of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {module:Core~ObjectHash} Returns the so called Hash value of the data of the given node. If the string is empty,
         * then it means that the node was mutated but not yet saved to the database, so it do not have a hash
         * temporarily.
         *
         * @func
         */
        this.getHash = core.getHash;

        /**
         * Persists the changes made in memory and computed the data blobs that needs to be saved into the database
         * to make the change and allow other users to see the new state of the project.
         * @param {module:Core~Node} node - some node element of the modified containment hierarchy (usually the root).
         * @param {function(module:Core~Node)} callback
         *
         * @return {module:Core~GmePersisted} The function returns an object which collects all the changes
         * on data level and necessary to update the databse on server side
         *
         * @func
         */
        this.persist = core.persist;

        /**
         * Loads the data object with the given hash and makes it a root of a containment hierarchy.
         * @param {module:Core~ObjectHash} hash - the hash of the data object we like to load as root.
         * @param {function(module:Core~Node)} callback
         *
         * @func
         */
        this.loadRoot = core.loadRoot;

        /**
         * Loads the child of the given parent pointed by the relative id. Behind the scenes, it means
         * that it actually loads the data pointed by a hash stored inside the parent under the given id
         * and wraps it in a node object which will be connected to the parent as a child in the containment
         * hierarchy.
         * @param {module:Core~Node} parent - the container node in question.
         * @param {string} relativeId - the relative id of the child in question.
         * @param {function(module:Core~Node)} callback
         *
         * @func
         */
        this.loadChild = core.loadChild;

        /**
         * From the given starting node, it loads the path given as a series of relative ids (separated by '/')
         * and returns the node it finds at the ends of the path. If there is no node, it will not stop but create
         * empty nodes on demand and return a new empty node back.
         * @param {module:Core~Node} startNode - the starting node of our search.
         * @param {string} relativePath - the relative path - built by relative ids - of the node in question.
         * @param {function(module:Core~Node)} callback
         *
         * @func
         */
        this.loadByPath = core.loadByPath;

        /**
         * Loads the all children of the given parent. As it first checks the already reserved relative ids of
         * the parent, it only loads the already existing children (so no on-demand empty node creation).
         * @param {module:Core~Node} parent - the container node in question.
         * @param {function(module:Core~Node[])} callback
         *
         * @func
         */
        this.loadChildren = core.loadChildren;

        /**
         * Loads the target of the given pointer of the given node. In the callback the node can have three values:
         * if the node is valid, then it is the defined target of a valid pointer,
         * if the returned value is null, then it means that the pointer is defined, but has no real target,
         * finally if the returned value is undefined than there is no such pointer defined for the given node.
         * @param {module:Core~Node} source - the container node in question.
         * @param {string} pointerName - the relative id of the child in question.
         * @param {function(module:Core~Node)} callback
         *
         * @func
         */
        this.loadPointer = core.loadPointer;

        /**
         * Loads all the source nodes that has such a pointer and its target is the given node.
         * @param {module:Core~Node} target - the container node in question.
         * @param {string} pointerName - the relative id of the child in question.
         * @param {function(module:Core~Node[])} callback
         *
         * @func
         */
        this.loadCollection = core.loadCollection;

        /**
         * Loads a complete sub-tree of the containment hierarchy starting from the given node.
         * @param {module:Core~Node} node - the container node in question.
         * @param {function(module:Core~Node[])} callback
         *
         * @func
         */
        this.loadSubTree = core.loadSubTree;

        /**
         * Loads a complete complete containment hierarchy using the data object - pointed by the given hash -
         * as the root.
         * @param {module:Core~ObjectHash} rootHash - hash of the root node.
         * @param {function(module:Core~Node[])} callback
         *
         * @func
         */
        this.loadTree = core.loadTree;

        //this.isValidNode = core.isValidNode;
        //this.getChildHash = core.getChildHash;
        //this.isValidRelid = core.isValidRelid;

        /**
         * Collects the relative ids of all the children of the given node.
         * @param {module:Core~Node} parent - the container node in question.
         *
         *@return {string[]} The function returns an array of the relative ids.
         *
         * @func
         */
        this.getChildrenRelids = core.getChildrenRelids;

        /**
         * Collects the paths of all the children of the given node.
         * @param {module:Core~Node} parent - the container node in question.
         *
         *@return {string[]} The function returns an array of the absolute paths of the children.
         *
         * @func
         */
        this.getChildrenPaths = core.getChildrenPaths;

        /**
         * Creates a node according to the given parameters.
         * @param {object} parameters - the details of the creation.
         * @param {module:Core~Node | null} [parameters.parent] - the parent of the node to be created.
         * @param {module:Core~Node | null} [parameters.base] - the base of the node to be created.
         * @param {string} [parameters.relid] - the relative id of the node to be created (if reserved, the function
         * returns the node behind the relative id)
         * @param {module:Core~GUID} [parameters.guid] - the GUID of the node to be created
         *
         *
         *@return {module:Core~Node} The function returns the created node or null if no node was created.
         *
         * @func
         */
        this.createNode = core.createNode;

        /**
         * Removes a node from the containment hierarchy.
         * @param {module:Core~Node} node - the node to be removed.
         *
         * @func
         */
        this.deleteNode = core.deleteNode;

        /**
         * Copies the given to be a child of the given parent.
         * @param {module:Core~Node} node - the node to be copied.
         * @param {module:Core~Node} parent - the parent node of the copy.
         *
         * @return {module:Core~Node} The function returns the copy of the original node.
         *
         * @func
         */
        this.copyNode = core.copyNode;

        /**
         * Create copy of the given nodes under the given parent. The copy will
         * @param {module:Core~Node[]} nodes - the nodes to be copied.
         * @param {module:Core~Node} parent - the parent node of the copy.
         *
         * @return {module:Core~Node} The function returns the copy of the original node.
         *
         * @func
         */
        this.copyNodes = core.copyNodes;

        /**
         * Moves the given node under the given parent.
         * @param {module:Core~Node} node - the node to be moved.
         * @param {module:Core~Node} parent - the parent node of the copy.
         *
         * @return {module:Core~Node} The function returns the node after the move.
         *
         * @func
         */
        this.moveNode = core.moveNode;

        /**
         * Returns the names of the defined attributes of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of the names of the attributes of the node.
         *
         * @func
         */
        this.getAttributeNames = core.getAttributeNames;

        /**
         * Retrieves the value of the given attribute of the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         *
         * @return {object | primitive | null | undefined} The function returns the value of the attribute of the node.
         * The value can be an object or any primitive type. If the value is undefined that means the node do not have
         * such attribute defined. [The retrieved attribute should not be modified as is - it should be copied first!!]
         *
         * @func
         */
        this.getAttribute = core.getAttribute;

        /**
         * Sets the value of the given attribute of the given node. It defines the attribute on demand, means that it
         * will set the given attribute even if was ot defined for the node beforehand.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         * @param {object | primitive | null} value - the new of the attribute. Can be any primitive type or object.
         * Undefined is not allowed.
         *
         * @func
         */
        this.setAttribute = core.setAttribute;

        /**
         * Removes the given attributes from the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         *
         * @func
         */
        this.delAttribute = core.delAttribute;

        /**
         * Returns the names of the defined registry entries of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of the names of the registry entries of the node.
         *
         * @func
         */
        this.getRegistryNames = core.getRegistryNames;

        /**
         * Retrieves the value of the given registry entry of the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the registry entry.
         *
         * @return {object | primitive | null | undefined} The function returns the value of the registry entry
         * of the node. The value can be an object or any primitive type. If the value is undefined that means
         * the node do not have such attribute defined. [The retrieved registry value should
         * not be modified as is - it should be copied first!!]
         *
         * @func
         */
        this.getRegistry = core.getRegistry;

        /**
         * Sets the value of the given registry entry of the given node. It defines the registry entry on demand,
         * means that it will set the given registry entry even if was ot defined for the node beforehand.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the registry entry.
         * @param {object | primitive | null} value - the new of the registry entry. Can be any primitive
         * type or object. Undefined is not allowed.
         *
         * @func
         */
        this.setRegistry = core.setRegistry;

        /**
         * Removes the given registry entry from the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the registry entry.
         *
         * @func
         */
        this.delRegistry = core.delRegistry;

        /**
         * Retrieves a list of the defined pointer names of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of the names of the pointers of the node.
         *
         * @func
         */
        this.getPointerNames = core.getPointerNames;

        /**
         * Retrieves the path of the target of the given pointer of the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer in question.
         *
         * @return {string | null | undefined} The function returns the absolute path of the target node
         * if there is a valid target. It returns null if though the pointer is defined it does not have any
         * valid target. Finally, it return undefined if there is no pointer defined for the node under the given name.
         *
         * @func
         */
        this.getPointerPath = core.getPointerPath;

        //TODO check if this could be completely removed - or we have to start using it instead of relying on undefined
        //this.hasPointer = core.hasPointer;

        //this.getOutsidePointerPath = core.getOutsidePointerPath;

        /**
         * Removes the pointer from the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer in question.
         *
         * @func
         */
        this.deletePointer = core.deletePointer;

        /**
         * Sets the target of the pointer of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer in question.
         * @param {module:Core~Node} target - the new target of the pointer.
         *
         * @func
         */
        this.setPointer = core.setPointer;

        /**
         * Retrieves a list of the defined pointer names that has the node as target.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of the names of the pointers pointing to the node.
         *
         * @func
         */
        this.getCollectionNames = core.getCollectionNames;

        /**
         * Retrieves a list of absolute paths of nodes that has a given pointer which points to the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer.
         *
         * @return {string[]} The function returns an array of absolute paths of nodes thath
         * has the pointer pointing to the node.
         *
         * @func
         */
        this.getCollectionPaths = core.getCollectionPaths;

        //this.getCoreTree = core.getCoreTree;

        /**
         * Collects the data hash values of the children of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {object} The function returns a dictionary of {@link module:Core~ObjectHash} that stored in pair
         * with the relative id of the corresponding child of the node.
         *
         * @func
         */
        this.getChildrenHashes = core.getChildrenHashes;

        /**
         * Returns the base node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {module:Core~Node | null} Returns the base of the given node or null if there is no such node.
         *
         * @func
         */
        this.getBase = core.getBase;

        /**
         * Returns the root of the inheritance chain of the given node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {module:Core~Node} Returns the root of the inheritance chain (usually the FCO).
         *
         * @func
         */
        this.getBaseRoot = core.getBaseRoot;

        /**
         * Returns the names of the attributes of the node that have been first defined for the node and not for its
         * bases.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of the names of the own attributes of the node.
         *
         * @func
         */
        this.getOwnAttributeNames = core.getOwnAttributeNames;

        /**
         * Returns the names of the registry enrties of the node that have been first defined for the node
         * and not for its bases.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of the names of the own registry entries of the node.
         *
         * @func
         */
        this.getOwnRegistryNames = core.getOwnRegistryNames;

        /**
         * Returns the value of the attribute defined for the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         *
         * @return {object | primitive | null | undefined} Returns the value of the attribute defined specifically for
         * the node. If undefined then it means that there is no such attribute defined directly for the node, meaning
         * that it either inherits some value or there is no such attribute at all.
         *
         * @func
         */
        this.getOwnAttribute = core.getOwnAttribute;

        /**
         * Returns the value of the registry entry defined for the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the registry entry.
         *
         * @return {object | primitive | null | undefined} Returns the value of the registry entry defined specifically
         * for the node. If undefined then it means that there is no such registry entry defined directly for the node,
         * meaning that it either inherits some value or there is no such registry entry at all.
         *
         * @func
         */
        this.getOwnRegistry = core.getOwnRegistry;

        /**
         * Returns the list of the names of the pointers that were defined specifically for the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} Returns an array of names of pointers defined specifically for the node.
         *
         *@func
         */
        this.getOwnPointerNames = core.getOwnPointerNames;

        /**
         * Returns the absolute path of the target of the pointer specifically defined for the node.
         * @param {module:Core~Node} node - the node in question
         * @param {string} name - the name of the pointer
         *
         * @return {string | null | undefined} Returns the absolute path. If the path is null, then it means that
         * 'no-target' was defined specifically for this node for the pointer. If undeinfed it means that the node
         * either inherits the target of the pointer or there is no pointer defined at all.
         *
         * @func
         */
        this.getOwnPointerPath = core.getOwnPointerPath;

        /**
         * Sets the base node of the given node. The function doesn't touches the properties or the children of the node
         * so it can cause META rule violations that needs to be corrected manually.
         * @param {module:Core~Node} node - the node in question.
         * @param {module:Core~Node | null} base - the new base.
         *
         * @func
         */
        this.setBase = core.setBase;

        /**
         * Returns the root of the inheritance chain (cannot be the node itself).
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {module:Core~Node | null} Returns the root of the inheritance chain of the node. If returns null,
         * that means the node in question is the root of the chain.
         *
         * @func
         */
        this.getTypeRoot = core.getTypeRoot;

        //TODO check if the whole function could be removed
        //this.getSetNumbers = core.getSetNumbers;

        /**
         * Returns the names of the sets of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} Returns an array of set names that the node has.
         *
         * @func
         */
        this.getSetNames = core.getSetNames;

        /**
         * Returns the list of absolute paths of the members of the given set of the given node.
         * @param {module:Core~Node} node - the set owner.
         * @param {string} name - the name of the set.
         *
         * @return {string[]} Returns an array of absolute path strings of the member nodes of the set.
         * @func
         */
        this.getMemberPaths = core.getMemberPaths;

        /**
         * Removes a member from the set. The functions doesn't remove the node itself.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         * @param {string} path - the absolute path of the member to be removed.
         *
         * @func
         */
        this.delMember = core.delMember;

        /**
         * Adds a member to the given set.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         * @param {module:Core~Node} member - the new member of the set.
         *
         * @func
         */
        this.addMember = core.addMember;

        /**
         * Return the names of the attributes defined for the set membership to the member node.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         * @param {string} memberPath - the absolute path of the member.
         *
         * @return {string[]} Returns the array of names of attributes that represents some property of the membership.
         *
         * @func
         */
        this.getMemberAttributeNames = core.getMemberAttributeNames;

        /**
         * Return the names of the attributes defined for the set membership specifically defined to the member node.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         * @param {string} memberPath - the absolute path of the member.
         *
         * @return {string[]} Returns the array of names of attributes that represents some property of the membership.
         *
         * @func
         */
        this.getMemberOwnAttributeNames = core.getMemberOwnAttributeNames;

        /**
         * Get the value of the attribute in relation with the set membership.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} setName - the name of the set.
         * @param {string} memberPath - the absolute path of the member node.
         * @param {string} attrName - the name of the attribute.
         *
         * @return {object|primitive|null|undefined} Return teh value of the attribute. If it is undefined, than there
         * is no such attributed connected to the given set membership.
         *
         * @func
         */
        this.getMemberAttribute = core.getMemberAttribute;

        /**
         * Sets the attribute value which represents a property of the membership.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} setName - the name of the set.
         * @param {string} memberPath - the absolute path of the member node.
         * @param {string} attrName - the name of the attribute.
         * @param {object|primitive|null} value - the new value of the attribute.
         * @func
         */
        this.setMemberAttribute = core.setMemberAttribute;


        /**
         * Removes an attribute which represented a property of the given set membership.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} setName - the name of the set.
         * @param {string} memberPath - the absolute path of the member node.
         * @param {string} attrName - the name of the attribute.
         *
         * @func
         */
        this.delMemberAttribute = core.delMemberAttribute;

        /**
         * Return the names of the registry entries defined for the set membership to the member node.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         * @param {string} memberPath - the absolute path of the member.
         *
         * @return {string[]} Returns the array of names of registry entries that represents some property of the
         * membership.
         *
         * @func
         */
        this.getMemberRegistryNames = core.getMemberRegistryNames;

        /**
         * Return the names of the registry entries defined for the set membership specifically defined to
         * the member node.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         * @param {string} memberPath - the absolute path of the member.
         *
         * @return {string[]} Returns the array of names of registry entries that represents some property of the
         * membership.
         *
         * @func
         */
        this.getMemberOwnRegistryNames = core.getMemberOwnRegistryNames;

        /**
         * Get the value of the registry entry in relation with the set membership.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} setName - the name of the set.
         * @param {string} memberPath - the absolute path of the member node.
         * @param {string} regName - the name of the registry entry.
         *
         * @return {object|primitive|null|undefined} Return teh value of the attribute. If it is undefined, than there
         * is no such attributed connected to the given set membership.
         *
         * @func
         */
        this.getMemberRegistry = core.getMemberRegistry;

        /**
         * Sets the registry entry value which represents a property of the membership.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} setName - the name of the set.
         * @param {string} memberPath - the absolute path of the member node.
         * @param {string} regName - the name of the registry entry.
         * @param {object|primitive|null} value - the new value of the attribute.
         * @func
         */
        this.setMemberRegistry = core.setMemberRegistry;

        /**
         * Removes a registry entry which represented a property of the given set membership.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} setName - the name of the set.
         * @param {string} memberPath - the absolute path of the member node.
         * @param {string} regName - the name of the registry entry.
         *
         * @func
         */
        this.delMemberRegistry = core.delMemberRegistry;

        /**
         * Creates a set for the node.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         *
         * @func
         */
        this.createSet = core.createSet;

        /**
         * Removes a set from the node.
         * @param {module:Core~Node} node - the owner of the set.
         * @param {string} name - the name of the set.
         *
         * @func
         */
        this.deleteSet = core.deleteSet;

        /**
         * Returns all membership information of the given node.
         * @param {module:Core~Node} node - the node in question
         *
         * @return {object} Returns a dictionary where every the key of every entry is an absolute path of a set owner
         * node. The value of each entry is an array with the set names in which the node can be found as a member.
         *
         * @func
         */
        this.isMemberOf = core.isMemberOf;

        //this.getMiddleGuid = core.getMiddleGuid;

        /**
         * Get the GUID of a node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {module:Core~GUID} Returns the globally unique identifier.
         * @func
         */
        this.getGuid = core.getGuid;

        //TODO this is only used in import - export use-cases, probably could be removed...
        /**
         * Get the GUID of a node. As the Core itself do not checks whether the GUID already exists. The use of
         * this function is only advised during the creation of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {module:Core~GUID} guid - the new globally unique identifier.
         * @func
         */
        this.setGuid = core.setGuid;

        /**
         * Gets a constraint object of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the constraint.
         *
         * @return {module:Core~Constraint | null} Returns the defined constraint or null if it was not
         * defined for the node.
         * @func
         */
        this.getConstraint = core.getConstraint;

        /**
         * Sets a constraint object of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the constraint.
         * @param {module:Core~Constraint} constraint  - the contraint to be set.
         * @func
         */
        this.setConstraint = core.setConstraint;

        /**
         * Removes a constraint from the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the constraint.
         *
         * @func
         */
        this.delConstraint = core.delConstraint;

        /**
         * Retrieves the list of constraint names defined for the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} Returns the array of names of constraints available for the node.
         *
         * @func
         */
        this.getConstraintNames = core.getConstraintNames;

        /**
         * Retrieves the list of constraint names defined specifically for the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} Returns the array of names of constraints for the node.
         *
         * @func
         */
        this.getOwnConstraintNames = core.getOwnConstraintNames;

        /**
         * Checks if the given typeNode is really a base of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {module:Core~Node} type - the type node we want to check.
         *
         * @return {bool} The function returns true if the type is in the inheritance chain of the node or false
         * otherwise. Every node is type of itself.
         *
         * @func
         */
        this.isTypeOf = core.isTypeOf;

        /**
         * Checks if according to the META rules the given node can be a child of the parent.
         * @param {module:Core~Node} node - the node in question
         * @param {module:Core~Node} parent - the parent we like to test.
         *
         * @return {bool} The function returns true if according to the META rules the node can be a child of the
         * parent. The check does not cover multiplicity (so if the parent can only have twi children and it already
         * has them, this function will still returns true).
         * @func
         */
        this.isValidChildOf = core.isValidChildOf;

        /**
         * Returns the list of the META defined pointer names of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns all the pointer names that are defined among the META rules of the node.
         *
         * @func
         */
        this.getValidPointerNames = core.getValidPointerNames;

        /**
         * Returns the list of the META defined set names of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns all the set names that are defined among the META rules of the node.
         *
         * @func
         */
        this.getValidSetNames = core.getValidSetNames;

        /**
         * Returns the list of the META defined pointers of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {module:Core~Node} source - the source to test.
         * @param {string} name - the name of the pointer.
         *
         * @return {bool} The function returns true if according to the META rules, the given node is a valid
         * target of the given pointer of the source.
         *
         * @func
         */
        this.isValidTargetOf = core.isValidTargetOf;

        /**
         * Returns the list of the META defined attribute names of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns all the attribute names that are defined among the META rules of the
         * node.
         *
         * @func
         */
        this.getValidAttributeNames = core.getValidAttributeNames;

        /**
         * Checks if the given value is of the necessary type, according to the META rules.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         * @param {object|primitive|null} value - the value to test.
         *
         * @return {bool} Returns true if the value matches the META definitions.
         *
         * @func
         */
        this.isValidAttributeValueOf = core.isValidAttributeValueOf;

        /**
         * Returns the list of the META defined aspect names of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns all the aspect names that are defined among the META rules of the
         * node.
         *
         * @func
         */
        this.getValidAspectNames = core.getValidAspectNames;

        /**
         * Returns the list of valid children types of the given aspect.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the aspect.
         *
         * @return {string[]} The function returns a list of absolute paths of nodes that are valid childrens of the node
         * and fits to the META rules defined for the aspect. Any children, visible under the given aspect of the node
         * must be an instance of at least one node represented by the absolute paths.
         *
         * @func
         */
        this.getAspectMeta = core.getAspectMeta;

        /**
         * Gives a JSON representation of the META rules of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {object} Returns an object that represents all the META rules of the node.
         *
         * @func
         */
        this.getJsonMeta = core.getJsonMeta;

        /**
         * Returns the META rules specifically defined for the given node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {object} The function returns an object that represent the META rules that were defined
         * specifically for the node.
         *
         * @func
         */
        this.getOwnJsonMeta = core.getOwnJsonMeta;

        /**
         * Removes all META rules that were specifically defined for the node (so the function do not touches
         * inherited rules).
         * @param {module:Core~Node} node - the node in question.
         *
         * @func
         */
        this.clearMetaRules = core.clearMetaRules;

        /**
         * Sets the META rules of the attribute of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         * @param {object} rule - the rules that defines the attribute
         * @param {'string'|'integer'|'float'|'bool'} rule.type - the type of the attribute
         * @param {string[]} rule.enum - if the attribute is an enumeration, this array contains the possible values
         *
         * @func
         */
        this.setAttributeMeta = core.setAttributeMeta;

        /**
         * Removes an attribute definition from the META rules of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         *
         * @func
         */
        this.delAttributeMeta = core.delAttributeMeta;

        /**
         * Returns the definition object of an attribute from the META rules of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the attribute.
         *
         * @return {object} The function returns the definition object
         * @func
         */
        this.getAttributeMeta = core.getAttributeMeta;

        /**
         * Returns the list of absolute path of the valid children types of the node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {string[]} The function returns an array of absolute paths of the nodes that was defined as valid
         * children for the node.
         *
         * @func
         */
        this.getValidChildrenPaths = core.getValidChildrenPaths;

        /**
         * Sets the given child as a valid children type for the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {module:Core~Node} child - the valid child node.
         * @param {integer} [min] - the allowed minimum number of children from this given node type (if not given or
         * -1 is set, then there will be no minimum rule according this child type)
         * @param {integer} [max] - the allowed maximum number of children from this given node type (if not given or
         * -1 is set, then there will be no minimum rule according this child type)
         *
         * @func
         */
        this.setChildMeta = core.setChildMeta;

        /**
         * Removes the given child rule from the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} childPath - the absolute path of the child which rule is to be removed from the node.
         *
         * @func
         */
        this.delChildMeta = core.delChildMeta;

        /**
         * Sets the global containment limits for the node.
         *
         * @param {integer} [min] - the allowed minimum number of children (if not given or
         * -1 is set, then there will be no minimum rule according this child type)
         * @param {integer} [min] - the allowed minimum number of children (if not given or
         * -1 is set, then there will be no minimum rule according this child type)
         *
         * @func
         */
        this.setChildrenMetaLimits = core.setChildrenMetaLimits;

        /**
         * Sets the given target as a valid target type for the pointer/set of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer/set.
         * @param {module:Core~Node} target - the valid target/member node.
         * @param {integer} [min] - the allowed minimum number of target/member from this given node type (if not
         * given or -1 is set, then there will be no minimum rule according this child type)
         * @param {integer} [max] - the allowed maximum number of target/member from this given node type (if not
         * given or -1 is set, then there will be no minimum rule according this child type)
         *
         * @func
         */
        this.setPointerMetaTarget = core.setPointerMetaTarget;

        /**
         * Removes a possible target type from the pointer/set of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer/set
         * @param {string} targetPath - the absolute path of the possible target type.
         *
         * @func
         */
        this.delPointerMetaTarget = core.delPointerMetaTarget;

        /**
         * Sets the global target limits for pointer/set of the node. On META level the only distinction between
         * pointer and sets is the global multiplicity which has to maximize the number of possible targets to 1 in
         * case of 'pure' pointer definitions.
         *
         * @param {integer} [min] - the allowed minimum number of children (if not given or
         * -1 is set, then there will be no minimum rule according this child type)
         * @param {integer} [min] - the allowed minimum number of children (if not given or
         * -1 is set, then there will be no minimum rule according this child type)
         *
         * @func
         */
        this.setPointerMetaLimits = core.setPointerMetaLimits;

        /**
         * Removes the complete META rule regarding the given pointer/set of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer/set.
         *
         * @func
         */
        this.delPointerMeta = core.delPointerMeta;

        /**
         * Return a JSON representation of the META rules regarding the given pointer/set of the given node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the pointer/set.
         *
         * @return {module:Core~RelationRule} The funciton returns a detailed JSON structure that represents the META
         * rules regarding the given pointer/set of the node.
         *
         * @func
         */
        this.getPointerMeta = core.getPointerMeta;

        /**
         * Sets a valid type for the given aspect of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the aspect.
         * @param {module:Core~Node} target - the valid type for the aspect.
         *
         * @func
         */
        this.setAspectMetaTarget = core.setAspectMetaTarget;


        /**
         * Removes a valid type from the given aspect of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the aspect.
         * @param {string} targetPath - the absolute path of the valid type of the aspect.
         *
         * @func
         */
        this.delAspectMetaTarget = core.delAspectMetaTarget;

        /**
         * Removes the given aspect rule of the node.
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the aspect.
         *
         * @func
         */
        this.delAspectMeta = core.delAspectMeta;

        /**
         * Searches for the closes META node of the node in question.
         * @param {module:Core~Node} node - the node in question
         *
         * @return {module:Core~Node | null} Returns the first node (including itself) among the inheritance chain
         * that is a META node. It returns null if it does not find such node (ideally the only node with this result
         * is the ROOT).
         *
         * @func
         */
        this.getBaseType = core.getBaseType;

        /**
         * Checks if there is a node with the given name in the nodes inheritance chain (excluding itself).
         * @param {module:Core~Node} node - the node in question.
         * @param {string} name - the name of the base node.
         *
         * @return {bool} The function returns true if it finds an ancestor with the given name attribute.
         *
         * @func
         */
        this.isInstanceOf = core.isInstanceOf;

        //this.nodeDiff = core.nodeDiff;

        /**
         * Generates a differential tree among the two states of the project that contains the necessary changes
         * that can modify the source to be identical to the target.
         * @param {module:Core~Node} sourceRoot - the root node of the source state.
         * @param {module:Core~Node} targetRoot - the root node of the target state.
         *
         * @return {object} The function returns a tree structured patch, that contains the necessary modification
         * that would changes the source state to be identical with the target state.
         *
         * @func
         */
        this.generateTreeDiff = core.generateTreeDiff;

        //this.generateLightTreeDiff = core.generateLightTreeDiff;

        /**
         * Apply changes to the current project.
         * @param {module:Core~Node} root - the root of the containment hierarchy where we wish to apply the changes
         * @param {object} patch - the tree structured collection of changes represented with a special JSON object
         *
         * @func
         */
        this.applyTreeDiff = core.applyTreeDiff;

        /**
         * Tries to merge two patch object. The patches ideally represents changes made by two parties. They represents
         * changes from the same source ending in different states. Our aim is to generate a single patch that could
         * cover the changes of both party.
         * @param {object} mine - the tree structured JSON patch that represents my changes.
         * @param {object} theirs - the tree structured JSON patch that represents the changes of the other party.
         *
         * @return {object} The function returns with an object that contains the conflicts (if any) and the merged
         * patch.
         *
         * @func
         */
        this.tryToConcatChanges = core.tryToConcatChanges;

        /**
         * When our attempt to merge two patches ended in some conflict, then we can modify that result highlighting
         * that in case of every conflict, which side we prefer (mine vs. theirs). If we give that object as an input
         * to this function, it will finish the merge resolving the conflict according our settings and present a final
         * patch.
         * @param {object} conflict - the object that represents our settings for every conflict and the so-far-merged
         * patch.
         *
         * @return {object} The function results in a tree structured patch object that contains the changesthat cover
         * both parties modifications (and the conflicts are resolved according the input settings).
         *
         * @func
         */
        this.applyResolution = core.applyResolution;

        /**
         * Checks if the node is abstract.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {bool} The function returns true if the registry entry 'isAbstract' of the node if true hence
         * the node is abstract.
         *
         * @func
         */
        this.isAbstract = core.isAbstract;

        /**
         * Check is the node is a connection-like node.
         * @param {module:Core~Node} node - the node in question.
         *
         * @return {bool} Returns true if both the 'src' and 'dst' pointer are defined as valid for the node.
         *
         * @func
         */
        this.isConnection = core.isConnection;

        /**
         * Retrieves the valid META nodes that can be base of a child of the node.
         * @param {object} parameters - the input parameters of the query.
         * @param {module:Core~Node} parameters.node - the node in question.
         * @param {module:Core~Node[]} [parameters.children] - the children of the node in question.
         * @param {bool} - [parameters.sensitive] - if true, the query filters out the abstract and connection-like
         * nodes (the default value is false)
         * @param {bool} - [parameters.multiplicity] - if true, the query tries to filter out even more nodes according
         * to the multiplicity rules (the default value is false, the check is only meaningful if all the children were
         * passed)
         * @param {string} - [parameters.aspect] - if given, the query filters to contain only types that are visible
         * in the given aspect.
         * @return {module:Core~Node[]} The function returns a list of valid nodes that can be instantiated as a
         * child of the node.
         *
         * @func
         */
        this.getValidChildrenMetaNodes = core.getValidChildrenMetaNodes;

        /**
         * Retrieves the valid META nodes that can be base of a member of the set of the node.
         * @param {object} parameters - the input parameters of the query.
         * @param {module:Core~Node} parameters.node - the node in question.
         * @param {string} parameters.name - the name of the set.
         * @param {module:Core~Node[]} [parameters.members] - the members of the set of the node in question.
         * @param {bool} - [parameters.sensitive] - if true, the query filters out the abstract and connection-like
         * nodes (the default value is false)
         * @param {bool} - [parameters.multiplicity] - if true, the query tries to filter out even more nodes according
         * to the multiplicity rules (the default value is false, the check is only meaningful if all the members were
         * passed)
         *
         * @return {module:Core~Node[]} The function returns a list of valid nodes that can be instantiated as a
         * member of the set of the node.
         *
         * @func
         */
        this.getValidSetElementsMetaNodes = core.getValidSetElementsMetaNodes;

        /**
         * Returns all META nodes.
         * @param {module:Core~Node} node - any node of the containment hierarchy.
         *
         * @return {object} The function returns a dictionary. The keys of the dictionary are the absolute paths of
         * the META nodes of the project. Every value of the dictionary is a {@link module:Core~Node}.
         *
         * @func
         */
        this.getAllMetaNodes = core.getAllMetaNodes;

        /**
         * Checks if the node is a META node.
         * @param {module:Core~Node} node - the node to test.
         *
         * @return {bool} Returns true if the node is a member of the METAAspectSet of the ROOT node hence can be
         * seen as a META node.
         *
         * @func
         */
        this.isMetaNode = core.isMetaNode;
    }

    return Core;
});
