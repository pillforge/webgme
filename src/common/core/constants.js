/*globals define*/
/*jshint node: true, browser: true*/
/**
 * @author kecso / https://github.com/kecso
 */
define([], function () {
    'use strict';
    //return string constants
    return {
        ATTRIBUTES_PROPERTY: 'atr',
        REGISTRY_PROPERTY: 'reg',
        OVERLAYS_PROPERTY: 'ovr',
        COLLECTION_NAME_SUFFIX: '-inv',
        ALL_SETS_PROPERTY: '_sets',
        SET_MODIFIED_REGISTRY: '_sets_',
        MEMBER_RELATION: 'member',
        BASE_POINTER: 'base',

        NULLPTR_NAME: '_null_pointer',
        NULLPTR_RELID: '_nullptr',

        META_SET_NAME: 'MetaAspectSet',
        NULL_GUID: '00000000-0000-0000-0000-000000000000',
        OWN_GUID: '_relguid',

        CONSTRAINTS_RELID: '_constraints',
        C_DEF_PRIORITY: 1,
        CONSTRAINT_REGISTRY_PREFIX: '_ch#_',

        TO_DELETE_STRING: '*to*delete*',

        SET_ITEMS: 'items',
        SET_ITEMS_MAX: 'max',
        SET_ITEMS_MIN: 'min',

        META_ASPECTS: 'aspects',
        META_CHILDREN: 'children',
        META_NODE: '_meta',
        META_POINTER_PREFIX: '_p_',
        META_ASPECT_PREFIX: '_a_',

        MAX_AGE: 3,
        MAX_TICKS: 2000,
        MAX_MUTATE: 30000
    };
});