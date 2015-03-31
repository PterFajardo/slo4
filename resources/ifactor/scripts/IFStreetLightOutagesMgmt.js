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
 * Created by Peter on 12/30/2014.
 */
(function(){
    var sloObject;

    var app = angular.module('SLOMgmt', ['IFMapMgmt'])
        .config(function($locationProvider){
        $locationProvider.html5Mode(true);
    })
        .service('sloService', function(){
            return{
              environment: sloObject
            };
        })
        .controller('SloController', ['$scope', '$sce', '$http', '$log', '$location' , function($scope, $sce, $http, $log, $location) {

            /*TODO: if needed, provide screen size, browser type, OS, etc*/

            sloObject = {
                protocol: $location.protocol(),
                host: $location.host(),
                key: $location.search().key,
                lat: $location.search().lat,
                lng: $location.search().lng,
                isDebug: true,
                lic: $location.search().lic,
                mapType: $location.search().map
            };
    }]);
})();