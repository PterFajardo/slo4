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
    var app = angular.module('IFMapMenu', []);

    app.directive('ifactorMenu', function(){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/menu.html',
            controller: ['$scope', function($scope){

             /*   $scope.showMenu = function(scope, message){

                    *//*alert('showing menu');*//*
                    *//*$('#menu').show('slide', {direction: 'left'}, 1000);*//*
                   // $('#menu-panel').show();
                    *//*$('#menu-panel').show('slide', {direction: 'left'}, 1000);*//*
                    //$('#ifactorMenuButton').animate({width: 'toggle'}).css({"margin-left": "25%"});
                    $('#ifactorMenuButton').css({"margin-left": "25%"});
                };

                $scope.hideMenu = function(scope){
                    //$('#alert-message').html('');
                    $('#ifactorAlert').fadeOut('3000');
                    *//*.hide('slow');*//*
                };

                $scope.toggle = function(){
                    $('#ifactorMenuButton').click(function(){

                        $('#menu-panel').toggle('slow');
                    });
                };*/

               // $scope.openMenu = function()

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
            controllerAs: 'menuCtrl',
            link: function(scope, element, attrs){

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
