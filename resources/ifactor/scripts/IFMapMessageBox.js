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
 * Created by Peter on 1/15/2015.
 */

(function(){
    var app = angular.module('IFMapMessageBox', []);

    app.directive('ifactorMessageBox', function(){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/messageBox.html',
            controller: ['$scope', function($scope){

                $scope.showMessageBox = function(scope, title, message){
                   // $('#messageTitle').html(title);
                    $('#messageBody').html(message);
                    $('#ifactorMessageBox').dialog({
                        title: title,
                        show: {
                            effect: "blind",
                            duration: 1000
                        },
                        hide: {
                            effect: "explode",
                            duration: 1000
                        }
                    });
                };

                $scope.hideMessageBox = function(scope){
                    //$('#messageTitle').html('');
                    //$('#messageBody').html('');
                    $('#ifactorMessageBox').dialog('close');
                    /*.hide('slow');*/
                };

            }],
            controllerAs: 'messageBoxCtrl',
            link: function(scope, element, attrs){
                /*element.bind('click', function(){
                 alert('clicked');
                 });*/

                scope.$on('showMessageBox', function(event, title, message) {
                    scope.showMessageBox(scope, title, message);
                });

                scope.$on('hideMessageBox', function(event) {
                    scope.hideMessageBox(scope);
                });

            }
        };
    });
})();