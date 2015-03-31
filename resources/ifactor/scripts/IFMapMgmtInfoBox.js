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
 * Created by Peter on 1/9/2015.
 */

(function() {
    var app = angular.module('IFMapMgmtInfoBox', []);
    /*TODO: create status dropdown using angular pattern*/

    app.directive('ifactorMgmtInfoBox',['$sce', '$http', function($sce, $http){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/mgmtInfoBox.html',
            controller: ['$scope',  function($scope){
                var infoPanel = $('#info-panel');
                var ASSET_INCIDENT_ID;

                /*title*/
                createInfoBoxTitle = function(){
                    infoPanel.find(".title-bar").html(getInfoBoxTitle());
                };

                /*BEGIN: body*/
                createInfoBoxBody = function(incident){
                    //TODO: make form data dynamic; based on the customized form
                    var formData = JSON.parse(incident.formData);
                    var name = (formData.name === undefined ? formData.contactname : formData.name);
                    var email = (formData.email === undefined ? 'no email on file' : formData.email.toUpperCase());
                    var poleNumber = (formData.poleNumber === undefined ? formData.polenumber : formData.poleNumber);
                    var problemType = (formData.problemType === undefined ? formData.problemtype : formData.problemType);
                    var comment = (formData.comment === undefined ? formData.comments : formData.comment);
                    ASSET_INCIDENT_ID = incident.sloId;

                    var content = '<div><b>SLO Id: </b>' + incident.sloId + '</div>'
                                + '<div><b>Customer Id: </b>' + (incident.customerId.length != 0 ? incident.customerId : incident.sloId) + '</div>'
                        + '<div><b>Asset Id: </b>' + incident.assetId + '</div>'
                        + '<div><b>Date Reported:</b>' + incident.dateReported + '</div>'
                        + '<div><b>Incident Type: </b>' + incident.incidentType + '</div>'
                        + '<div><b>Incident Status: </b>' + incident.status + '</div>'
                        + '<div><b>Latitude: </b>' + incident.lat + '</div>'
                        + '<div><b>Longitude: </b>' + incident.lng + '</div>'
                        + '<hr>'
                        + '<div><b>FORM DATA</b></div>'
                        + '<div><b>Name: </b>' + (name != undefined && name.length > 0 ? name.toUpperCase() : 'NO NAME') + '</div>'
                        + '<div><b>Email: </b>' + email + '</div>'
                        + '<div><b>Phone: </b>' + formData.phone + '</div>'
                        + '<div><b>Pole Number: </b>' + (poleNumber != undefined && poleNumber.length != 0 ? poleNumber : 'NOT AVAILABLE') + '</div>'
                        + '<div><b>Problem Type: </b>' + problemType + '</div>'
                        + '<div><b>Address: </b>' + formData.sloStreetLightAddress.toUpperCase() + '</div>'
                        + '<div><b>Comment: </b>' + comment + '</div>'
                        + '<hr>'
                        + '<div><b>Asset Information</b></div>'
                        + '<div><b>Asset data </b></div>'
                        + '<hr>'
                        + '<div><b>Transaction History</b></div>'
                        + '<div><b>Transaction data</b></div>';

                /*    for (var property in incident){
                      content = content + '<div>' + property + ": " +incident[property] + "</div>";
                    };*/

                    infoPanel.find("#info-box-content").html(content);
                };

                /*BEGIN: footer*/
                /*END: footer*/

                /*BEGIN: infopanel*/
                $scope.showMgmtInfoPanel = function(scope, incident){
                    createInfoBoxTitle();
                    createInfoBoxBody(incident);
                    $('#info-panel').show('slide', {direction: 'right'}, 300);
                };

                $scope.showMgmtInfoPanelFromMap = function(scope, title, position){
                    var title = title.split(':');
                    var type = title[0];
                    ASSET_INCIDENT_ID = title[1];

                    createInfoBoxTitle();

                    switch(type){
                        case 'streetlight':
                            getAsset();
                            break;
                        default:
                            for (i=0; i < $scope.incidentList.length; i++){
                                if ($scope.incidentList[i].sloId === ASSET_INCIDENT_ID){

                                    createInfoBoxBody($scope.incidentList[i]);
                                    break;
                                };
                            };

                            break;
                    };

                    $('#info-panel').show('slide', {direction: 'right'}, 300);
                };

                $scope.hideMgmtInfoPanel = function(){
                    $('#info-panel').hide('slide', {direction: 'right'}, 300, function(){
                    });
                };
                /*END: infopanel*/

                getAsset = function() {
                    $http.get("http://dvlp.streetlightoutages.com:82/ifassetservice.asmx/GetAssetByDbId",
                        {
                            params: {userToken: $scope.adminToken, dbId: ASSET_INCIDENT_ID },
                            headers: {"Content-Type":"application/json"}
                        })
                        .success(function(result){
                            createAssetInformation(result);
                        });

                };

                $scope.updateIncidentStatus = function(status){
                    $http.get("http://dvlp.streetlightoutages.com:82/ifincidentservice.asmx/SetIncidentStatusBySLOID",
                        {
                            params: {userToken: $scope.adminToken, SLOID: ASSET_INCIDENT_ID, statusType: status },
                            headers: {"Content-Type":"application/json"}
                        })
                        .success(function(result){
                            $scope.hideMgmtInfoPanel();

                            var localList = $scope.incidentList;
                            var title;
                            var position;
                            $scope.incidentList = [];
                            var cleanMarkers;

                            if ((status==='closed')){
                                var assetId = 0;
                                for (i=0; i < localList.length; i++ ){
                                    if (localList[i].sloId!=ASSET_INCIDENT_ID){
                                        $scope.incidentList.push(localList[i]);
                                    }
                                    else{
                                        //title = 'streetlight:' + ASSET_INCIDENT_ID;
                                        assetId = 'streetlight:' + localList[i].assetId;
                                        title = assetId;
                                        position = new google.maps.LatLng(localList[i].lat, localList[i].lng);
                                    }
                                };

                                cleanMarkers = removeItemInMarkersArray($scope.INCIDENTMARKERS, 'incident:' + ASSET_INCIDENT_ID);
                                $scope.INCIDENTMARKERS=[];
                                $scope.INCIDENTMARKERS = cleanMarkers;

                                cleanMarkers = removeItemInMarkersArray($scope.STREETLIGHTMARKERS, assetId);
                                $scope.STREETLIGHTMARKERS=[];
                                $scope.STREETLIGHTMARKERS = cleanMarkers;
                            }else{
                                //TODO: getImageBasedOnStatus
                                for (i=0; i < localList.length; i++ ){
                                    if (localList[i].sloId===ASSET_INCIDENT_ID){
                                        localList[i].status = status;
                                        localList[i].lightIcon = $scope.getImage(status);
                                        title = 'incident:' + ASSET_INCIDENT_ID;
                                        position = new google.maps.LatLng(localList[i].lat, localList[i].lng);

                                    };
                                    $scope.incidentList.push(localList[i]);
                                };

                                cleanMarkers = removeItemInMarkersArray($scope.INCIDENTMARKERS, title);
                                $scope.INCIDENTMARKERS=[];
                                $scope.INCIDENTMARKERS = cleanMarkers;
                            };

                            /*remark the position with a valid incidentId*/
                            $scope.$broadcast('createIncidentMarker', title, position, status);

                            //$scope.createIncidentMarker($scope, title, position, status);

                        });

                };

                removeItemInMarkersArray = function(markerArray, title) {
                    var iMarkerTemp = markerArray;
                    markerArray = [];

                    for (i = 0; i < iMarkerTemp.length; i++) {
                        if (iMarkerTemp[i].title != title) {
                            markerArray.push(iMarkerTemp[i]);
                        }
                    }

                    return markerArray;
                }

                convertXMLtoJSON = function(xml){
                    var x2js = new X2JS();
                    var json = x2js.xml_str2json(xml);

                    return json;
                };

                createAssetInformation = function(xml){
                    var assetInfo = convertXMLtoJSON(xml).ArrayOfAsset.Asset;

                    //TODO: make form data dynamic based on the customized form
                    /*var jsonData = assetInfo.JsonData.split(',');*/

                    var content = '<div><b>Asset Id: </b>' + assetInfo.DbId + '</div>'
                        + '<div><b>ForeignId Id: </b>' + assetInfo.ForeignId + '</div>'
                        + '<div><b>Latitude: </b>' + assetInfo.Latitude + '</div>'
                        + '<div><b>Longitude: </b>' + assetInfo.Longitude + '</div>'
                        + '<div><b>Pole Number: </b>' + assetInfo.PoleNumber + '</div>'
                        + '<div><b>JSON Data: </b><br/>' + assetInfo.JsonData + '</div>'

                    /*for (i=0; i < jsonData.length; i++){
                        var data = jsonData[i].split(':');
                        content = content +  '<div>' + data[0] + ':' + data[1] + '</div>';
                    };*/

                    infoPanel.find("#info-box-content").html(content);

                };

                /*BEGIN: properties*/
                getInfoBoxTitle = function(id){
                    return CONFIGURATION.mgmtInfoBoxTitle || 'incident details';
                };
                /*END: properties*/

                /*BEGIN: helpers*/
                /*END: helpers*/

                /*BEGIN: http calls*/
                /*END:http calls*/

                /*BEGIN: form validations*/
                /*END: form validations*/
            }],
            /*scope: {},*/  /*isolated scope*/
            link: function(scope, element, attrs){
                /*BEGIN: infobox event listeners*/

                scope.$on('showMgmtInfoPanel', function(event, incident) {
                    scope.showMgmtInfoPanel(scope, incident);
                });

                scope.$on('showMgmtInfoPanelFromMap', function(event, title, position) {
                    scope.showMgmtInfoPanelFromMap(scope, title, position);
                });

                scope.$on('hideMgmtInfoPanel', function() {
                    scope.hideMgmtInfoPanel();
                });
                /*END: infobox event listeners*/
            }
        };

    }]);
})();
