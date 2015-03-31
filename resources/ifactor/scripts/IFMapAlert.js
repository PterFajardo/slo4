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
    var app = angular.module('IFMapAlert', []);

    app.directive('ifactorAlert', function(){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/alert.html',
            controller: ['$scope', function($scope){

                $scope.showAlert = function(scope, message, cl){
                    $('#ifactorAlert').fadeOut(500, function(){
                        $(this).removeClass();
                        $('#alert-message').html(message);
                        $('#ifactorAlert').addClass(cl).fadeIn(1000);
                    });
                    /*.show('slow');*/
                };

                $scope.hideAlert = function(scope){
                    //$('#alert-message').html('');
                    $('#ifactorAlert').fadeOut(100, function(){
                        //$(this).removeClass();
                    });
                        /*.hide('slow');*/
                };

            }],
            controllerAs: 'alertCtrl',
            link: function(scope, element, attrs){
                /*element.bind('click', function(){
                 alert('clicked');
                 });*/

                scope.$on('showAlert', function(event, message,cl, isDebug) {
                    if (isDebug === undefined || isDebug) {
                        scope.showAlert(scope, message, cl);
                    }
                });

                scope.$on('hideAlert', function(event) {
                    scope.hideAlert(scope);
                });

            }
        };
    });
})();