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
    var app = angular.module('IFIncidentService', [])

        .factory('incidentServiceCache', ['$cacheFactory', function($cacheFactory){
            return $cacheFactory('incidentServiceCache');
        }])

        .provider('IFIncidentServiceProvider', function(){
            var serviceType = '/IFIncidentService.svc/jsonp/';

            this.$get = function($http, $q, incidentServiceCache, sloService) {
                return {
                    getBoundingAreaIncidents: function(params) {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'visiblepoints',
                            {
                                params: params
                            })
                            .success(function (data) {
                                deferred.resolve(data);

                            })
                            .error(function (data) {
                                deferred.reject('unable to retrieve incident(s). contact ifactor consulting.');

                            })
                        return deferred.promise;
                    },

                    getIncidentInfo: function(usertoken, id) {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'displayhtml',
                            {
                                params: {usertoken: usertoken, dbid: id, displayType: 'mobile' }
                            })
                            .success(function (data) {
                                deferred.resolve(data);
                            })
                            .error(function (data) {
                                deferred.reject('unable to retrieve incident information . contact ifactor consulting.');
                            })
                        return deferred.promise;
                    },

                    reportIncident: function(usertoken, lat, lng, id, jsonData) {
                        var deferred = $q.defer();
                        $http.get(sloService.environment.serviceHost + serviceType + 'reportincident',
                            {
                                params: { usertoken: usertoken, lat: lat, lon: lng, assetDBID: id, data: jsonData }
                            })
                            .success(function (data) {
                                deferred.resolve(data);
                            })
                            .error(function (data) {
                                deferred.reject('unable to retrieve incident information . contact ifactor consulting.');
                            })
                        return deferred.promise;
                    }
                }
            };

        });

})();