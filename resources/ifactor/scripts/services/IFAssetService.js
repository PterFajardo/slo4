/*************************************************************************
 *
 * iFactor Consulting Incorporated CONFIDENTIAL
 * __________________
 *
 *  Copyright [2006] - [2014] iFactor Consulting Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of iFactor Consulting Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to iFactor Consulting Incorporated
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from iFactor Consulting Incorporated.
 */
/**
 * Created by Peter on 3/30/2015.
 */

(function() {
    var app = angular.module('IFAssetService', [])

        .factory('assetServiceCache', ['$cacheFactory', function($cacheFactory){
            return $cacheFactory('assetServiceCache');
        }])

        .provider('IFAssetServiceProvider', function(){
            var serviceType = '/IFAssetService.svc/jsonp/';

            this.$get = function($http, $q, assetServiceCache, sloService) {
                return {
                    getBoundingAreaAssets: function(params) {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'visiblepoles',
                            {
                                params: params
                            })
                            .success(function (data) {
                                deferred.resolve(data);
                            })
                            .error(function (data) {
                                deferred.reject('unable to retrieve asset(s). contact ifactor consulting.');
                            })
                        return deferred.promise;
                    },

                    getAssetInfo: function(usertoken, polenumber, orgId) {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'displayhtml',
                            {
                                params: {usertoken: usertoken, polenumber: polenumber, orgId: orgId}
                            })
                            .success(function (data) {
                                deferred.resolve(data);
                            })
                            .error(function (data) {
                                deferred.reject('unable to retrieve asset information . contact ifactor consulting.');
                            })
                        return deferred.promise;
                    }
                }
            };

        });

})();