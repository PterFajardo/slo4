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
 * Created by Peter on 1/19/2015.
 */

(function(){
    var app = angular.module('IFMapMgmtIncidentPanel', []);

    app.directive('ifactorIncidentPanel', function(){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/mgmtIncidentPanel.html',
            controller: ['$scope','$http','sloService', function($scope, $http, sloService){

                $scope.incidentList = [];
                $scope.adminToken;

                /*BEGIN: admin functionalities*/
                $scope.getAdminToken = function(scope){
                    $http.get("http://dvlp.streetlightoutages.com:81/IFCommonService.svc/jsonp/usertoken",
                        {
                            /* cache: true,*/
                            params: {username: "ifcslo+phi@gmail.com", password: "ifactorsgr8", expiryminutes: 120 }
                        })
                        .success(function(adminToken){
                            $scope.$broadcast('showAlert', 'admin token was retrieved', 'good', sloService.environment.isDebug); /*debug*/
                            $scope.adminToken = JSON.parse(adminToken)

                            $scope.getIncidents($scope.adminToken);

                        })
                        .error(function(data) {
                            if (data.indexOf('IFInvalidCredentialsException') >= 0) {
                                $scope.$broadcast('showAlert', 'invalid credential. contact ifactor consulting.', 'bad');
                            }else {
                                $scope.$broadcast('showAlert', 'a service exception occurred. contact ifactor consulting.', 'bad');
                            }
                        });
                };

                $scope.getIncidents = function(adminToken) {
                    $http.get("http://dvlp.streetlightoutages.com:82/ifincidentservice.asmx/GetAllIncidents",
                        {
                            params: {userToken: adminToken },
                            headers: {"Content-Type":"application/json"}
                        })
                        .success(function(result){
                            createIncidentTable(result);
                        });

                };

                 $scope.getDetail = function(incident) {
                     $scope.$broadcast('showMgmtInfoPanel', incident);
                     $scope.$broadcast('goToIncidentMgmt', new google.maps.LatLng(incident.lat, incident.lng));
                 };

                //TODO: refactor
                convertXMLtoJSON = function(xml){
                    var x2js = new X2JS();
                    var json = x2js.xml_str2json(xml);

                    return json;
                };


                createIncidentTable = function(result){
                    var jsonData =convertXMLtoJSON(result).ArrayOfIFIncidentStructure.IFIncidentStructure;

                    for(i=0; i < jsonData.length; i++){
                        var incident = {
                            incidentType: jsonData[i].incidenttype,
                            sloId: jsonData[i].SLOID,
                            assetId: jsonData[i].assetdbID,
                            status: jsonData[i].statustype,
                            lightIcon: $scope.getImage(jsonData[i].statustype),
                            lat: jsonData[i].latitude,
                            lng: jsonData[i].longitude,
                            dateReported: jsonData[i].creation_time_string,
                            contactName: (JSON.parse(jsonData[i].JSONData).name != undefined ? JSON.parse(jsonData[i].JSONData).name.toUpperCase() : 'NO NAME'),
                            organizationName: jsonData[i].orgName,
                            reporterName: jsonData[i].reporterName,
                            customerId: jsonData[i].customerID,
                            formData: jsonData[i].JSONData
                        };

                        if (incident.status!='closed') {
                                //TODO: make this configurable
                            $scope.incidentList.push(incident);
                        };
                      };

                    };

                $scope.getImage = function(status){
                    var image = 'light-off.png'

                    switch(status.toLowerCase()){
                        case 'additionalworkneeded':
                            image = 'additionalWork.png';
                            break;
                        case 'notourlight':
                            image = 'notOurLight.png';
                            break;
                        default :
                            image = 'light-off.png';
                            break;
                    }

                    return getLightIconLocation() + image;
                };

                getLightIconLocation = function(){
                    var defaultImageType = 'png';
                    var defaultImageSize = '25px';
                    var defaultLocation = 'resources/ifactor/images/default/lightIcons/' + defaultImageType + '/' + defaultImageSize + '/';
                    var iconColor;

                    if (sloService.environment.lic != undefined){
                    iconColor = sloService.environment.lic;
                    }
                    else{
                    var iconColor = CONFIGURATION.lightIconColor || 'yellow';
                    };

                    return defaultLocation + '/' + iconColor + '/';

                };


               $scope.scrollMenuItem = function() {
                    var mExp = $("#menu-panel .expandable.menu-row.expanded");

                    if(mExp.length) {
                        var open =  (mExp.position().top) + "px";

                        $("#menu-panel").animate({
                            scrollTop: open
                        }); 
                    } else {
                        $("#menu-panel").animate({
                            scrollTop: "0px"
                        }); 
                    }

                };

                $scope.applyListeners = function(scope) {
                    var $menu = $("#menu-panel"),
                        $scFrame = $("#sc-frame");

                    // Slide-out menu rows
                    $(".expandable", $menu).click(function(e) {
                        e.preventDefault();
                        
                        var $div = $(this).next();
                        if( !$div.is(":hidden") ) {
                            // Hide section
                            $div.removeClass("selected");
                            $(this)
                                .removeClass("expanded")
                                .addClass("collapsed")
                                .children(".menu-arrow")
                                    .removeClass("icon-triangle-down")
                                    .addClass("icon-triangle-right");
                        } else {
                            // Collapse all other sections/tabs
                            $(".menu-row .menu-arrow").removeClass("icon-triangle-down").addClass("icon-triangle-right");
                            $(".expandable", $menu).removeClass("expanded").addClass("collapsed");
                            $(".expandable-content", $menu).removeClass("selected");
                            
                            // Show section
                            $div.addClass("selected");
                            $(this)
                                .removeClass("collapsed")
                                .addClass("expanded")
                                .children(".menu-arrow")
                                    .removeClass("icon-triangle-right").addClass("icon-triangle-down");

                            scope.scrollMenuItem();
                        }
                    });

                    $('#btn-menu').on("click",function(){
                        scope.toggleMenu(scope);
                    });

                    scope.activateMenuIcons(scope);

                };

                $scope.activateMenuIcons = function(scope) {
                    $("#menu-panel.gpuAccelCapable .menu-row .menu-icon, #menu-panel.legacy .menu-row .menu-icon").on("click", function(e) {
                        var parent = $(this).parent(".menu-row");
                        e.preventDefault();
                        scope.toggleMenu(scope,parent);
                    });
                };

                $scope.toggleMenu = function(scope, message){
                    var $menu = $("#menu-panel"),
                        $scFrame = $("#sc-frame");

                    if( $menu.hasClass("animating") ) {
                        return;
                    }

                    if( !$menu.hasClass("expanded") ) {
                        // Show menu
                        $scFrame.addClass("collapsed");
                        $menu.addClass("expanded");

                        $("#menu-panel.gpuAccelCapable.expanded .menu-row .menu-icon")
                            .off("click")
                            .children(".menu-arrow")
                            .removeClass(".icon-triangle-down")
                            .addClass(".icon-triangle-right");

                    } else {
                        // Hide menu
                        $scFrame.removeClass("hidden");
                        
                        scope.activateMenuIcons(scope);

                        $(".menu-row .menu-arrow")
                            .removeClass("icon-triangle-down")
                            .addClass("icon-triangle-right");

                        $(".expandable", this.$menu).removeClass("expanded").addClass("collapsed");
                        $(".expandable-content").removeClass("selected");

                        // adding the following to the event queue prevents flickering issue
                        setTimeout(function(){
                            $scFrame.removeClass("no-animate collapsed");
                            $menu.addClass("collapsing animating").removeClass("expanded");
                            scope.scrollMenuItem(); //scroll menu back to top when menu closed
                        }, 20);
                    }

                };

                $scope.transitionEnd = function(scope) {
                    var $menu = $("#menu-panel"),
                        $scFrame = $("#sc-frame");
                    
                    // Slide-out menu transition completion callback
                    $menu.bind("transitionend webkitTransitionEnd mozTransitionEnd oTransitionEnd MSTransitionEnd", function() {
                        $(this).removeClass("animating collapsing");
                        if( $(this).hasClass("expanded") )
                        {
                            $scFrame.addClass("no-animate");
                            $scFrame.addClass("hidden");
                        }
                    });
                };

                $scope.checkGpuAccelSupport = function() {
                    var el = document.createElement("p");
                    var has3d;
                    var transforms = {
                        "webkitTransform": "-webkit-transform",
                        "OTransform": "-o-transform",
                        "msTransform": "-ms-transform",
                        "MozTransform": "-moz-transform",
                        "transform": "transform"
                    };

                    // Add it to the body to get the computed style.
                    document.body.insertBefore(el, null);

                    for( var t in transforms )
                    {
                        if( el.style[t] !== undefined )
                        {
                            el.style[t] = "translate3d(1px,1px,1px)";
                            has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                        }
                    }

                    document.body.removeChild(el);

                    var result = (has3d !== undefined && has3d.length > 0 && has3d !== "none");
                    this.gpuAccelSupported = result;
                    if( result == true )
                    {
                        $("#sc-frame, #menu-panel, #info-panel, #wizard-panel").addClass("gpuAccelCapable");
                    } else {
                        $("#sc-frame, #info-panel, #menu-panel").addClass("legacy");
                        $("#menu-panel").addClass("legacy-collapsed");
                        $("#sc-frame").addClass("legacy-exp");
                    }
                };

            }],
            controllerAs: 'incidentCtrl',
            link: function(scope, element, attrs){

                scope.getAdminToken(scope);

                scope.checkGpuAccelSupport(scope);

                //scope.toggleMenu(scope);
                scope.transitionEnd(scope);

/*                scope.$watch('toggleMenu', function(event, message){
                   scope.toggleMenu(scope, message)
                });*/

                scope.applyListeners(scope);

                scope.$watch('transitionEnd', function(event, message){
                   scope.transitionEnd(scope, message)
                });

            }
        };
    });
})();
