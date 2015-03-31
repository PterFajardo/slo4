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

(function(){
    var app = angular.module('IFMap', ['IFCommonService', 'IFAssetService', 'IFIncidentService']);
     /*   .service('sloConfigService', function(){
            return{
                config: {startLat: "test"}
            };
        });*/
    var map = null;
    var highlightMarkers = [];
    var minZoomLevelToDisplayAsset;
  /*
    var streetlightMarkers = [];
    var incidentMarkers = [];
    var adhocMarkers = [];
*/
    /*var initialPosition;*/



    var ifMap = this;
    ifMap.USERTOKEN;
    ifMap.CONFIGURATION = [];
    ifMap.serviceArea = [];
    ifMap.ASSETS = [];
    ifMap.STREETLIGHTMARKERS = [];
    ifMap.INCIDENTMARKERS = [];
    ifMap.ADHOCMARKERS = [];
    ifMap.ASSETADDRESS;
    ifMap.LOCATIONMARKERS = [];

    app.directive('ifactorMap', function(){
        return {
            restrict: 'E',
            replace: true,
            template: '<div></div>',
            controller:['$scope', 'sloService', 'IFCommonServiceProvider', 'IFAssetServiceProvider', 'IFIncidentServiceProvider',
                function($scope, sloService, IFCommonServiceProvider, IFAssetServiceProvider, IFIncidentServiceProvider){

                $scope.initialize = function(scope, element, attrs){

                    //this provider will provide the usertoken data
                    IFCommonServiceProvider.getUserToken(convertKey(), '').then(function(result){
                        ifMap.USERTOKEN = result;
                        //this provider will provide the configuration data
                        IFCommonServiceProvider.getConfiguration().then(function(result){
                            //alert(result);
                            ifMap.CONFIGURATION = result;

                            $scope.renderMap(scope, element, attrs);

                        }, function(reason){
                            scope.$broadcast('showAlert', reason, 'bad');
                        });

                        //this provider will provide the service area data
                        IFCommonServiceProvider.getServiceArea().then(function(result){

                            //alert(result);
                            displayServiceArea(scope, result);
                        }, function(reason){
                            scope.$broadcast('showAlert', reason, 'bad');
                        });

                    }, function(reason){
                        scope.$broadcast('showAlert', reason, 'bad');
                        $scope.renderMap(scope, element, attrs);
                    });
                };

                $scope.showBoundingAreaAssetsAndIncidents = function(scope,attemptToRetrieveAssets){
                    if (getAssetExists()) {/*check if there the flag to retrieve asset is on.  default is false*/
                        var currentZoom = map.getZoom();
                        /*var center = map.getCenter();*/

                        if (currentZoom === minZoomLevelToDisplayAsset || (attemptToRetrieveAssets && currentZoom >= minZoomLevelToDisplayAsset)) {
                            scope.$broadcast('showAlert', 'retrieving assets in this area...','good');

                            IFAssetServiceProvider.getBoundingAreaAssets(getBoundingAreaParameters()).then(function(result){
                                scope.$broadcast('showAlert', 'asset retrieval completed...','good');
                                var assets = result;

                                scope.$broadcast('showAlert', 'retrieving incidents in this area...','good');

                                IFIncidentServiceProvider.getBoundingAreaIncidents(getBoundingAreaParameters()).then(function(result){
                                    scope.$broadcast('showAlert', 'incident retrieval completed...','good');
                                    displayStreetlights(scope, removeIncidentsFromAssets(assets, result));
                                    displayIncidents(scope, result);

                                }, function(reason){
                                    scope.$broadcast('showAlert', reason, 'bad');
                                });

                            }, function(reason){
                                scope.$broadcast('showAlert', reason, 'bad');
                            });
                       }else {
                            scope.$broadcast('showAlert', 'will not retrieve assets at zoom level ' + currentZoom, 'ugly', sloService.environment.isDebug);/*debug*/

                            if (currentZoom < minZoomLevelToDisplayAsset) {  //clear the markers
                                removeMarker(ifMap.STREETLIGHTMARKERS);
                                removeMarker(ifMap.INCIDENTMARKERS);
                                removeMarker(highlightMarkers);
                                removeMarker(ifMap.ADHOCMARKERS);


                            };
                        };
                    };
                };

                $scope.renderMap = function(scope, element, attrs){
                    //console.log(element);

                    var mapElement = document.getElementById(attrs.id);

                    var initialLatitude = getStartLat();
                    var initialLongitude = getStartLng();
                    minZoomLevelToDisplayAsset = getMinZoomLevelToDisplayAsset();

                    initialPosition = new google.maps.LatLng(initialLatitude, initialLongitude);  //failover location

                    var gMapOptions = {
                        key: getMapKey(),
                        center: initialPosition,
                        mapTypeId: getMapType(),
                        zoom: getStartZoom(),
                        enableClickableLogo: false,
                        enableSearchLogo: false,
                        showDashboard: false,
                        showMapTypeSelector: false,
                        showScalebar: false,
                        panControl: false,
                        zoomControl: false,
                        mapTypeControl: false,
                        scaleControl: false,
                        streetViewControl: false,
                        overviewMapControl: false
                    };

                    map = new google.maps.Map(mapElement, gMapOptions);

                    //boundService();

                    registerMapListeners(scope);

                    postProcessor();

                    scope.$on('geoCode', function(event) {
                        scope.geoCode(scope);
                    });
                };

                $scope.findMe = function(){
                    findMe($scope);
                };

                $scope.zoomIn = function(){
                    zoomIn($scope);
                };

                $scope.zoomOut = function(){
                    zoomOut($scope);
                };

                $scope.geoCode = function(scope){
                    geoCode(scope);
                };

                /*BEGIN: helper functions*/
                convertKey = function(){
                    //TODO: this function will convert key
                    return sloService.environment.key;
                };

                reloadLogo = function(){
                    var host = sloService.environment.host;

                    if(host.indexOf('localhost') >= 0 || host.indexOf('10.0.2.2') >= 0 || host.indexOf('dev') >= 0 ||
                        host.indexOf('dvlp') >= 0 || host.indexOf('test') >= 0 || host.indexOf('quat') >= 0){
                       $('#btn-logo').addClass("default-logo");
                    };
                };

                processSearchText = function(){
                    /*extend this to handle address, polenumber and latlng*/
                    return $('#search-field').val() + ' ' + getAddressCountry();
                };

                removeIncidentsFromAssets = function(assets, incidents){
                    /*assets needs to be cleaned up first prior to loading incidents to prevent overlays*/
                    ifMap.ASSETS = [];
                    var iAssetIds = [];

                    for (i=0; i < incidents.length; i++){
                        var iAsset = incidents[i];
                        var iAssetId = iAsset['assetID'].toString();

                        if (iAssetId != -1){
                            iAssetIds.push(iAssetId);
                        };
                    };

                    for (a=0; a < assets.length; a++)
                    {
                        var asset = assets[a];
                        var assetId = asset['id'].toString();

                        if ($.inArray(assetId, iAssetIds) === -1){
                            ifMap.ASSETS.push(asset);
                        };
                    };

                    return ifMap.ASSETS;
                };


                getBoundingAreaParameters = function(){
                    var bounds = map.getBounds();

                    var svcParams = {
                        'usertoken': USERTOKEN,
                        'minx': bounds.getSouthWest().lng(),
                        'miny': bounds.getSouthWest().lat(),
                        'maxx': bounds.getNorthEast().lng(),
                        'maxy': bounds.getNorthEast().lat()
                    };

                    return svcParams;
                };

                boundService = function(){
                    /**/
                    // bounds of the desired area
                    var allowedBounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(parseFloat(CONFIGURATION.minViewableLatitude),parseFloat(CONFIGURATION.minViewableLongitude)),/*southwest*/
                        new google.maps.LatLng(parseFloat(CONFIGURATION.maxViewableLatitude),parseFloat(CONFIGURATION.maxViewableLongitude))/*northeast*/
                    );
                    var boundLimits = {
                        maxLat : allowedBounds.getNorthEast().lat(),
                        maxLng : allowedBounds.getNorthEast().lng(),
                        minLat : allowedBounds.getSouthWest().lat(),
                        minLng : allowedBounds.getSouthWest().lng()
                    };

                    var lastValidCenter = map.getCenter();
                    var newLat, newLng;
                    google.maps.event.addListener(map, 'center_changed', function() {
                        var bounds = map.getBounds();
                        var ne = bounds.getNorthEast();
                        var sw = bounds.getSouthWest();

                        if (allowedBounds.contains(ne) && allowedBounds.contains(sw)) {
                            // still within valid bounds, so save the last valid position
                            lastValidCenter = map.getCenter();
                        }

                        var newLng = lastValidCenter.lng();
                        var newLat = lastValidCenter.lat();

                        if(Math.min(sw.lng(), ne.lng()) > boundLimits.minLng &&
                            Math.max(sw.lng(), ne.lng()) < boundLimits.maxLng){
                            newLng = map.getCenter().lng();
                        }
                        if(Math.min(sw.lat(), ne.lat()) > boundLimits.minLat &&
                            Math.max(sw.lat(), ne.lat()) < boundLimits.maxLat){
                            newLat = map.getCenter().lat();
                        }
                        map.panTo(new google.maps.LatLng(newLat, newLng));
                    });
                    /*end*/
                };
                /*END: helper functions*/

                displayStreetlights = function(scope, streetlights){
                    var image = {
                        url: getLightIconLocation() + 'light-on.png',
                        size: new google.maps.Size(25, 25),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(12, 25)
                    };

                    var noOfStreetlights = streetlights.length;

                    if (noOfStreetlights === 0){
                        scope.$broadcast('showAlert', 'no assets in this area. <br/>zoom in to report a light', 'good');
                    }
                    else {
                        for (var i = 0; i < noOfStreetlights; i++) {

                            var count = i + 1;

                            scope.$broadcast('showAlert', 'displaying streetlights (' + count + ' of ' + noOfStreetlights + ')', 'ugly', sloService.environment.isDebug);
                            /*debug*/

                            var streetlight = streetlights[i];

                            var id = streetlight['id'].toString();
                            var polenumber = streetlight['polenumber'];
                            /*to do*/
                            var lat = streetlight['y'];
                            var lng = streetlight['x'];
                            var position = new google.maps.LatLng(lat, lng);

                            createMarker(scope, position, 'streetlight:' + id, 3, image, sloMarkerTypeEnum.streetlight);
                        };

                        scope.$broadcast('showAlert', 'streetlights were placed. for lights not shown, zoom in and click the location.', 'good');
                    };

                    scope.$broadcast('hideAlert');
                };

                displayIncidents = function(scope, incidents){
                    var noOfIncidents = incidents.length;

                    for (var i = 0; i < noOfIncidents; i++) {

                        var count = i + 1;

                        scope.$broadcast('showAlert', 'displaying incidents (' + count + ' of ' + noOfIncidents + ')','ugly', sloService.environment.isDebug);/*debug*/

                        var incident = incidents[i];

                        var id = incident['id'].toString();

                        var polenumber = incident['polenumber'];
                        /*to do*/
                        var lat = incident['y'];
                        var lng = incident['x'];
                        var position = new google.maps.LatLng(lat, lng);
                        var status = incident['lightStatus'];

                       // if ($.inArray(status, incidentStatusTypes) != -1){
                            //createMarker(scope, position, 'incident:' + id, 5, image, sloMarkerTypeEnum.incident);
                            scope.createIncidentMarker(scope, 'incident:' + id, position, status);
                        //};

                    };

                    scope.$broadcast('hideAlert');
                };

                $scope.createIncidentMarker = function(scope, title, position, status){
                    var image = {
                        url: getImageBasedOnStatus(status),
                        size: new google.maps.Size(25, 25),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(12, 25)
                    };

                    /*var sloMarker = new google.maps.Marker({
                        position: position,
                        map: map,
                        icon: image,
                        title: title,
                        zIndex: 4
                    });*/

                    createMarker(scope, position, title, 5, image, sloMarkerTypeEnum.incident);
                };

                displayServiceArea = function(scope, polygons){
                    var PolygonPointsJSON = polygons;

                    // Lood Config Parameters for an Org
                    for (paramName in PolygonPointsJSON) { //sevice area level to get polygons
                        var vertices = new Array(); // pointsArray in old version
                        if (PolygonPointsJSON.hasOwnProperty(paramName)) {
                            var polygonJSON = PolygonPointsJSON[paramName];
                            var param;
                            for (param in polygonJSON) {//polygon level to get a pair of long & lat
                                if (polygonJSON.hasOwnProperty(param)) {
                                    var polygonPoints = polygonJSON[param];
                                    ifMap.serviceArea.push(new google.maps.LatLng(polygonPoints[1], polygonPoints[0]));
                                }
                            }
                        }
                    }

                    serviceArea = new google.maps.Polygon({
                        paths: ifMap.serviceArea,
                        strokeColor: '#0000FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.03
                    });

                    serviceArea.setMap(map);

                    google.maps.event.addListener(serviceArea, "click", function (event) {
                            mapClick(scope, event);
                    });
                };

                mapClick =function(scope, e){
                    //TODO: eval if max zoom level display adhoc form

                    scope.$broadcast('hideInfoPanel');
                    scope.$broadcast('hideAlert');

                    processAdhoc(scope, e);
                    scope.showBoundingAreaAssetsAndIncidents(scope);
                };

                registerMapListeners = function(scope){
                    // Check map allowable bounds and correct them
                    google.maps.event.addListener(map, "dragend", function (event) {
                        scope.$apply(function(scope){
                            console.log(event);
                            scope.showBoundingAreaAssetsAndIncidents(scope, true);
                        });

                    });

                  /*  google.maps.event.addListener(map, "center_changed", function (e) {
                         if (allowableBounds.contains(map.getCenter())){
                             lastValidCenter = map.getCenter();
                             return;
                         };

                            map.panTo(lastValidCenter);
                     });
*/
                    /*  google.maps.event.addListener(map, "bounds_changed", function (e) {
                     scope.$apply(function(scope){
                     console.log(e);
                     //alert('dragged');
                     showBoundingAreaAssetsAndIncidents(scope);
                     });

                     });*/

                    // Map click
                     google.maps.event.addListener(map, "click", function (event) {
                         scope.$apply(function(scope){
                            //console.log(event);
                             scope.$broadcast('showAlert', getOutsideServiceAreaMessage(),'ugly');
                        });
                     });

                    // Map view change events
                   /*  google.maps.event.addListener(map, "idle", function () {
                         allowableBounds = map.getBounds();
                         lastValidCenter = map.getCenter();
                     });*/

                    google.maps.event.addListener(map, "zoom_changed", function (event) {
                        scope.$apply(function(scope){
                            //console.log(event);
                            scope.showBoundingAreaAssetsAndIncidents(scope);
                        });

                        /*ensures that the map zoom out activity stays within the predefined limit*/
                        if (map.getZoom() < getStartZoom()){
                            map.setZoom(getStartZoom());
                        }

                    });

                    /* // Event to re-center the map when window rescaled
                     google.maps.event.addDomListener(window, "resize", function () {
                     that.mapViewResized();
                     });*/
                };

                postProcessor = function(){
                    getSearchPlaceholderText();
                    reloadLogo();
                };

                var sloMarkerTypeEnum = {streetlight:1, adhoc:2, incident: 3};

                createMarker = function(scope, position, title, zIndex, image, sloMarkerTypeEnum){

                    var sloMarker = new google.maps.Marker({
                        position: position,
                        map: map,
                        icon: image,
                        title: title,
                        zIndex: zIndex
                    });

                    switch (sloMarkerTypeEnum){
                        case 2:
                            ifMap.ADHOCMARKERS.push(sloMarker);
                            scope.$broadcast('showInfoPanel', title, position);
                            break;
                        case 3:
                            /*TODO: need to clear from markers*/
                            ifMap.INCIDENTMARKERS.push(sloMarker);
                            break;
                        default:
                            ifMap.STREETLIGHTMARKERS.push(sloMarker);
                            break;
                    };

                    /* if (isAdhoc){
                     adhocMarkers.push(sloMarker);
                     scope.$broadcast('showInfoPanel', title, position);
                     }else{
                     streetlightMarkers.push(sloMarker);
                     }*/

                    // Add mouse click event to the marker to open Infobox
                    google.maps.event.addListener(sloMarker, "click", function () {
                        scope.$broadcast('showAlert', 'retrieving id ' + this.title,'ugly', sloService.environment.isDebug);/*debug*/

                        //removeMarker(highlightMarkers);
                        removeMarker(ifMap.ADHOCMARKERS);
                        createMarkerHighlighter(position);
                        map.setCenter(position);
                        scope.$broadcast('showInfoPanel', this.title, position); //type:assetId or incidentId; format: (asset:123456)
                    });
                };

                createMarkerHighlighter = function(position){
                    removeMarker(highlightMarkers); /*remove highlightmarker prior to creating one*/
                    var image = {
                        url: 'resources/ifactor/images/iconhighlight.png',
                        size: new google.maps.Size(43, 43),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(21, 36)
                    };

                    highlightMarker = new google.maps.Marker({
                        position: position,
                        map: map,
                        icon: image
                    });

                    highlightMarkers.push(highlightMarker);
                };

                removeMarker = function(markerArray){
                    for (var i = 0; i < markerArray.length; i++) {
                        markerArray[i].setMap(null);
                    }
                    markerArray = [];
                };

                processAdhoc = function(scope, e){
                    if (getAllowAdhocReporting()) {/*first: check if adhoc is allowed*/
                        if (map.getZoom() === getAdhocReportingLevel()) {/*second: check if within zoom level*/
                            removeMarker(ifMap.ADHOCMARKERS);
                            removeMarker(highlightMarkers);
                            var title = 'adhoc';
                            var position = new google.maps.LatLng(e.latLng.lat(), e.latLng.lng());
                            var image = {
                                url: getLightIconLocation() + 'adhoc.png',
                                size: new google.maps.Size(25, 25),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(12, 25)
                            };

                            createMarker(scope, position, title, 3, image, sloMarkerTypeEnum.adhoc);
                            createMarkerHighlighter(position);
                        }
                    }
                };

                findMe = function(scope){
                    var options = {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    };

                    var message = "Something is wrong. Unable to perform geolocation.";

                    function success(position) {
                        var crd = position.coords;
                        map.setCenter(new google.maps.LatLng(crd.latitude, crd.longitude));
                    };

                    function error(err) {
                        scope.$broadcast('showAlert', message,'bad');
                    };

                    if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(success, error, options);
                    }
                    else{
                        message = "Your browser doesn't support geolocation.";
                        scope.$broadcast('showAlert', message,'ugly');
                    };
                };

                zoomIn = function(scope)
                {
                     map.setZoom(map.getZoom() + 1);
                    scope.showBoundingAreaAssetsAndIncidents(scope, true);
                };

                zoomOut = function(scope)
                {
                    map.setZoom(map.getZoom() - 1);
                    scope.showBoundingAreaAssetsAndIncidents(scope, true);
                };

                var currentScope;  //TODO: it works but can be better.  find a better way of passing this around

                geoCode = function(scope){
                    currentScope = scope;
                    /*TODO: include state and country*/
                    var geocoder = new google.maps.Geocoder();
                    var searchVal = processSearchText();

                    geocoder.geocode({'address': searchVal},function(results, status) {
                        var message = getAddressSearchErrorMessage();

                        if (status == google.maps.GeocoderStatus.OK) {
                            scope.$broadcast('hideAlert');

                            if (results.length === 1) {
                                map.setCenter(results[0].geometry.location);
                                map.setZoom(minZoomLevelToDisplayAsset);
                                scope.showBoundingAreaAssetsAndIncidents(scope, true);

                                var image = {
                                    url: getLightIconLocation() + 'location.png',
                                    size: new google.maps.Size(30, 30),
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(15, 30)
                                };

                                var marker = new google.maps.Marker({
                                    position: results[0].geometry.location,
                                    map: map,
                                    icon: image,
                                    title: results[0].formatted_address,
                                    zIndex: 3
                                });
                            }
                            else{
                                var addresses = [];

                                for (i=0; i < results.length; i++) {
                                    if (results[i].types[0] === 'street_address') {
                                        var address = results[i].formatted_address;
                                        var lat = results[i].geometry.location.k;
                                        var lng = results[i].geometry.location.D

                                        if (isWithInServiceArea(lat, lng)) {
                                            addresses.push(results[i]);
                                        };
                                    };
                                };

                                createAddressMessageBox(scope, addresses);
                            }

                        } else {
                            scope.$broadcast('showAlert', message,'good');
                        }
                    });
                };

                createAddressMessageBox = function(scope, addresses){
                    var maxResult = 5; //display max of five addresses

                    if (addresses.length > maxResult)
                    {
                        message = 'too many result. refine your search criteria';
                        scope.$broadcast('showAlert', message,'bad');
                    }
                    else{
                        //TODO: configurable message
                        var title = 'Found Addresses';
                        var template = '';
                        var addressCount = addresses.length;
                        message = '<p>Your address search resulted to ' + addressCount + ' results.  Select an address below.</p>';


                        for(i=0; i < addresses.length; i++){
                            var location = addresses[i].geometry.location;
                            template += "<a href='#' onclick='goToPosition(" + location.lat() + "," + location.lng() + ");'>" + addresses[i].formatted_address.replace(', USA', '') + "</a><br/>";
                        };

                        scope.$broadcast('showMessageBox', title, message + template);
                    };
                };

                reverseGeocode = function(latitude, longitude){
                    $scope.reverseGeocode(latitude, longitude);
                };

                $scope.reverseGeocode = function(latitute, longitude, scope){
                    /*TODO: include state and country*/
                    if (scope!= undefined){currentScope = $scope;};
                    var geocoder = new google.maps.Geocoder();
                    var latLng = new google.maps.LatLng(latitute, longitude);

                    geocoder.geocode({'latLng': latLng},function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results[1]) {
                                map.setCenter(latLng);
                                map.setZoom(minZoomLevelToDisplayAsset);
                                currentScope.showBoundingAreaAssetsAndIncidents(currentScope);
                                /*TODO: need icon*/
                                var image = {
                                    url: getLightIconLocation() + 'location.png',
                                    size: new google.maps.Size(30, 30),
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(15, 30)
                                };

                                var marker = new google.maps.Marker({
                                    position: results[0].geometry.location,
                                    map: map,
                                    icon: image,
                                    title: results[0].formatted_address,
                                    zIndex: 3
                                });

                                if (currentScope === undefined) {
                                  /*TODO.  need to cleanup occurs when multi address appears*/
                                    currentScope.$broadcast('hideMessageBox');
                                };
                            } else {
                                alert('No results found');
                            }

                        } else {
                            alert(status);
                            //scope.$broadcast('showAlert', message);
                        }
                    });
                };

                goToPosition = function(latitude, longitude){
                    $scope.goToPosition($scope, latitude, longitude);
                };

                $scope.goToPosition = function(scope, latitute, longitude){
                    removeMarker(ifMap.LOCATIONMARKERS);

                    /*TODO: include state and country*/
                    //if (scope!= undefined){currentScope = $scope;};
                    var latLng = new google.maps.LatLng(latitute, longitude);
                    map.setCenter(latLng);
                    map.setZoom(minZoomLevelToDisplayAsset);
                    scope.showBoundingAreaAssetsAndIncidents(scope);
                    /*TODO: need icon*/
                    var image = {
                        url: getLightIconLocation() + 'location.png',
                        size: new google.maps.Size(30, 30),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(15, 30)
                    };

                    var marker = new google.maps.Marker({
                        position: latLng,
                        map: map,
                        icon: image,
                        title: '',
                        zIndex: 6
                    });

                    ifMap.LOCATIONMARKERS.push(marker);

                    createMarkerHighlighter(latLng);

                    scope.$broadcast('hideMessageBox');
                };

                $scope.goToIncident = function(scope, position){
                    map.setCenter(position);
                    map.setZoom(minZoomLevelToDisplayAsset);
                    scope.showBoundingAreaAssetsAndIncidents(scope);
                    createMarkerHighlighter(position);
                };

                isWithInServiceArea = function(lat, lng){
                    var result = false;
                    var latLng = new google.maps.LatLng(lat, lng);

                    if (google.maps.geometry.poly.containsLocation(latLng, ifMap.serviceArea)){
                        result = true;
                    };

                    return result;
                };

                /*BEGIN: properties*/
                getMapKey = function(){
                    return CONFIGURATION.mapKey || "AIzaSyB_zpujxV1PNvAk6DYmwlKSAhOV05sNyS0";
                };

                getMapType = function(){
                    var mapType;

                    if (sloService.environment.mapType != undefined){
                        mapType = sloService.environment.mapType;
                    }
                    else{
                        var mapType = CONFIGURATION.mapType || 'road';
                    }

                    switch (mapType.toLowerCase()){
                        case 'hybrid':
                            mapType = google.maps.MapTypeId.HYBRID;
                            break;
                        case 'satellite':
                            mapType = google.maps.MapTypeId.SATELLITE;
                            break;
                        case 'terrain':
                            mapType = google.maps.MapTypeId.TERRAIN;
                            break;
                        default :
                            mapType = google.maps.MapTypeId.ROADMAP;
                            break;
                    }

                    return mapType;
                };

                getStartLat = function(){
                    return parseFloat(CONFIGURATION.startLat) || 33.430808;
                };

                getStartLng = function(){
                    return parseFloat(CONFIGURATION.startLng) || -111.938919;
                };

                getStartZoom = function(){
                    return parseInt(CONFIGURATION.startZoom) || 5;
                };

                getTimezone = function(){
                    return CONFIGURATION.timeZone || 'Mountain Standard Time';
                };

                getMinZoomLevelToDisplayAsset = function(){
                    return parseInt(CONFIGURATION.minZoomLevelToDisplayAsset) || 19;
                };

                getAdhocReportingLevel = function(){
                    return parseInt(CONFIGURATION.adhocReportingLevel) || 20;
                };

                getAssetExists = function(){
                    var value = false;
                    if ( CONFIGURATION.assetExists != undefined ){
                        if (CONFIGURATION.assetExists === 'true'){
                            value = true;
                        };
                    };

                    return value;
                };

                getAllowAdhocReporting = function(){
                    var value = true;
                    if ( CONFIGURATION.allowAdhocReporting != undefined ){
                        if (CONFIGURATION.allowAdhocReporting != 'true'){
                            value = false;
                        };
                    };

                    return value;
                };

                getOutsideServiceAreaMessage = function(){
                    var defaultMessage = 'This area is not within our service territory.';
                    return CONFIGURATION.outsideServiceAreaMessage || defaultMessage;
                };

                getAddressSearchErrorMessage = function(){
                    var defaultMessage = "Something is wrong. Geocode was not successful. Verify you're search criteria.";
                    return CONFIGURATION.addressSearchErrorMessage || defaultMessage;
                };

                getAddressCountry = function(){
                    return CONFIGURATION.addressCountry || 'USA';
                };

                getSearchPlaceholderText = function(){
                 var defaultMessage = CONFIGURATION.searchPlaceholderText || 'Enter address to locate';
                    $('#search-field').attr('placeholder', defaultMessage);
                 /*return defaultMessage;*/
                 };

                getImageBasedOnStatus = function(status){
                    //TODO: need to clean up
                    var icon = 'light-off.png';
                    if (CONFIGURATION['status:' + status] != undefined){
                        icon = CONFIGURATION['status:' + status];
                    }else{
                        if (status===3 || status===5){
                            icon = 'light-on.png';
                        };
                    };

                    return  getLightIconLocation() + icon;

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

                $scope.getAddress = function(position){
                    var geocoder = new google.maps.Geocoder();
                    var latLng = new google.maps.LatLng(position.k, position.D);
                    ASSETADDRESS = 'no address found';

                    geocoder.geocode({'latLng': latLng},function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results.length > 0) {
                                for(i=0; i < results.length; i++){
                                    if ($.inArray('street_address', results[i].types) === 0){
                                        ASSETADDRESS =  results[i].formatted_address.replace(', USA', '');
                                        $('#assetAddress').html(ASSETADDRESS);
                                    };
                                };
                            };
                        };
                    });
                    /*return address;*/

                };
                /*END: properties*/



            }],
            link: function (scope, element, attrs) {

                scope.initialize(scope, element, attrs);

                scope.$on('getAddress', function(event, position) {
                    //alert('what');
                    scope.getAddress(position);
                });

                scope.$on('createIncidentMarker', function(event, title, position) {
                    //alert('what');
                    scope.createIncidentMarker(scope, title, position);
                });

                scope.$on('reverseGeocode', function(event, latitude, longitude){
                    scope.reverseGeocode(latitude, longitude, scope);
                });

                scope.$on('goToPosition', function(event, latitude, longitude){
                    scope.goToPosition(scope, latitude, longitude);
                });

                scope.$on('goToIncident', function(event, position){
                    scope.goToIncident(scope, position);
                    });
                }
    }
    });



})();
