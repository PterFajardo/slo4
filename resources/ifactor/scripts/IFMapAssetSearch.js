/**
 * Created by Peter on 1/15/2015.
 */
/*
 * This search module will handle the following parameters (w/ sample format)
 * address: 150 fleet st
 * polenumber: 757454-0243
 * latlng(reversible): 39.0808296203613,	-77.1518173217773
 * incidentId: sloid:40230
 */


(function(){
    var app = angular.module('IFMapAssetSearch', ['autocomplete']);

    app.directive('ifactorAssetSearch',function(){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/assetSearch.html',
            controller: ['$scope', '$http', function($scope, $http, SearchRetriever){

                //TODO: clean this up
                $scope.previousSearchData = ["Arizona",
                    "Arkansas",
                    "Science of Sleep",
                    "Back to the Future",
                    "Oldboy"];

                // gives another searchData array on change
                $scope.updateSearchData = function(typed){
                    // searchData could be some service returning a promise
                    $scope.newSearchData = SearchRetriever.getPreviousSearchData(typed);
                    $scope.newSearchData.then(function(data){
                        $scope.previousSearchData = data;
                    });
                }

                $scope.performSearch = function() {
                    var searchVal = $('#search-field').val();

                    if(validateSearch(searchVal)) {
                        $scope.$broadcast('showAlert', 'searching ' + searchVal + '...', 'good');

                        var latLngExpression = /-?\d{2}.\d*,\s?-?\d{2}.\d*/;
                        var latLngRegex = new RegExp(latLngExpression);
                        //TODO: pole expression configurable sql:organizations.polenumber_regexp_search
                        var poleExpression = /(\d{6})-?(\d{2})\d?(\d{2})\d?/;
                        var poleRegex = new RegExp(poleExpression);

                        var idExpression = /sloid:\s*(\d?)*/;
                        var idRegex = new RegExp(idExpression);

                        if (latLngRegex.test(searchVal)) {
                            performSearchLatLng(searchVal);
                        }else if (poleRegex.test(searchVal)){
                            performSearchPolenumber(searchVal);
                        }else if (idRegex.test(searchVal)){
                            performSearchSLOId(searchVal);
                        }else{
                            /*addressSearch*/
                            //put('searchKeys', searchVal)
                            $scope.$broadcast('geoCode');
                        };
                    };

                };

                performSearchLatLng = function(value){
                    /*latLng search*/
                    var latLng = value.split(',');

                    if (latLng[0].indexOf('-') >= 0 && latLng[1].indexOf('-') >= 0){
                        $scope.$broadcast('showAlert', 'unable to determine position with the provided parameter(s)', 'bad');
                        //break;
                    }else if(latLng[0].indexOf('-') >= 0){
                        $scope.$broadcast('goToPosition', parseFloat(latLng[1]), parseFloat(latLng[0]));
                    }
                    else{
                        $scope.$broadcast('goToPosition', parseFloat(latLng[0]), parseFloat(latLng[1]));
                    }
                };

                performSearchPolenumber = function(value){
                    $http.get("http://dvlp.streetlightoutages.com:82/ifassetservice.asmx/GetAssetDetails",
                        {
                            params: {userToken: USERTOKEN, polenumber: value },
                            headers: {"Content-Type":"application/json"}
                        })
                        .success(function(result){
                            var asset = convertXMLtoJSON(result).IFPointSimpleStructure;

                            if (asset.latitude != undefined && asset.longitude != undefined){
                                $scope.$broadcast('goToPosition', parseFloat(asset.latitude), parseFloat(asset.longitude));
                            }
                            else {//no pole found
                                $scope.$broadcast('showAlert', 'unable to determine location of pole with the provided parameter(s)', 'bad');
                            }
                        })
                        .error(function(data){
                            $scope.$broadcast('showAlert', 'unable to search by pole number.  please contact administrator', 'bad');
                        });
                };

                performSearchSLOId = function(value){
                    //TODO: need to create a service that will provide key information (latlng) information only as the service below
                    //includes reporter's data
                    var key = value.split(':');

                    $http.get("http://dvlp.streetlightoutages.com:82/ifincidentservice.asmx/GetIncidentDetails",
                    {
                        params: {userToken: USERTOKEN, sloIncidentId: key[1] },
                        headers: {"Content-Type":"application/json"}
                    })
                    .success(function(result) {
                            var incident = convertXMLtoJSON(result).IFIncidentStructure;

                            if (incident.latitude != undefined && incident.longitude != undefined){
                                $scope.$broadcast('goToPosition', parseFloat(incident.latitude), parseFloat(incident.longitude));
                            }
                            else {//no id found
                                $scope.$broadcast('showAlert', 'unable to determine location of id with the provided parameter(s)', 'bad');
                            }
                    })
                    .error(function(data){
                        $scope.$broadcast('showAlert', 'unable to search by id.  please contact administrator', 'bad');
                    });
                };

                //TODO: refactor
                convertXMLtoJSON = function(xml){
                    var x2js = new X2JS();
                    var json = x2js.xml_str2json(xml);

                    return json;
                };

                validateSearch = function(value){
                    var isValid = true;
                    var message = 'Something is wrong. Unable to perform search'; //default message

                    if(value.length === 0 || value === undefined){
                        message = 'Enter a search criteria';
                        $scope.$broadcast('showAlert', message);
                        isValid = false;
                    };

                    return isValid;
                };

                /*$scope.getLocation = function(val) {
                    return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
                        params: {
                            address: val,
                            sensor: false
                        }
                    }).then(function(response){
                        return response.data.results.map(function(item){
                            return item.formatted_address;
                        });
                    });
                };*/


                /*TODO: moving to ifmap until page lifecycle is figured out*/
                /*$scope.getSearchPlaceholderText = function(){
                    var defaultMessage = "Enter address to locate";
                   // var x = sloConfig;
                    *//*TODO: neet to get config*//*
                    *//*return ifMap.configuration.searchPlaceholderText || defaultMessage;*//*
                    return defaultMessage;
                };*/
            }],
            controllerAs: 'assetSearchCtrl',
            link: function(scope, element, attrs){
                /*scope, element, attrs, ctrl*/
              /*$('#search-field').attr('placeholder', scope.getSearchPlaceholderText());*/

                element.bind('keypress', function(event){
                    if(event.which ===13){
                        scope.performSearch();
                    };
                });


            }
        };
    });
})();
