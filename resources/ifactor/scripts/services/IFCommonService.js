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
 * Created by Peter on 3/27/2015.
 */

(function() {
    var app = angular.module('IFCommonService', [])

        .factory('commonServiceCache', ['$cacheFactory', function($cacheFactory){
            return $cacheFactory('commonServiceCache');
        }])

        .provider('IFCommonServiceProvider',  function(){
            var serviceType = '/IFCommonService.svc/jsonp/';
            var loadConfiguration = function(data){
                var orgParameters = angular.fromJson(eval("(" + data + ")")); //JSON.parse(data);

                var paramName;
                var configurations = [];

                for (paramName in orgParameters)
                {
                    if(orgParameters.hasOwnProperty(paramName)){
                        configurations[paramName] = orgParameters[paramName];
                    };
                };

                return configurations;
            }

            this.$get = function($http, $q, commonServiceCache, sloService) {
                return {
                    getUserToken: function(username, password) {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'usertoken',
                            {
                                params: {username: username, password: password, expiryminutes: 120}
                            })
                            .success(function (data) {
                                deferred.resolve(JSON.parse(data));
                                //_usertoken = JSON.parse(data);
                                commonServiceCache.put('usertoken', JSON.parse(data));
                            })
                            .error(function (data) {
                                if (data.indexOf('IFInvalidCredentialsException') >= 0) {
                                    deferred.reject('invalid credential. contact ifactor consulting.');
                                }else {
                                    deferred.reject('a service exception occured. contact ifactor consulting.');
                                }
                            })
                        return deferred.promise;
                    },

                    getConfiguration: function() {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'configurations',
                            {
                                params: {usertoken: commonServiceCache.get('usertoken') }
                            })
                            .success(function (data) {
                                deferred.resolve(loadConfiguration(data));
                            })
                            .error(function (data) {
                                deferred.reject('unable to load configuration, contact ifactor consulting');
                            })
                        return deferred.promise;
                    },

                    getServiceArea: function() {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'servicearea',
                            {
                                params: {usertoken: commonServiceCache.get('usertoken') }
                            })
                            .success(function (data) {
                                deferred.resolve(data);
                            })
                            .error(function (data) {
                                deferred.reject('unable to load service area territory. unexpected behavior might occur while using map, contact ifactor consulting');
                            })
                        return deferred.promise;
                    }
                }
            };

        });

})();
