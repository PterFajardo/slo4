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
    var app = angular.module('IFMapInfoBox', ['IFAssetService', 'IFIncidentService']);
    /*    .factory('infoboxCache', ['$cacheFactory', function($cacheFactory){
            return $cacheFactory('infobox-Cache');
    }]);*/
    /*TODO: get configuration*/
    /*call service to get streetlight and incident information*/

    app.directive('ifactorInfoBox',['$sce', '$http', function($sce, $http){
        return{
            restrict: 'E',
            templateUrl: 'resources/templates/infoBox.html',
            controller: ['$scope', 'IFAssetServiceProvider', 'IFIncidentServiceProvider',  function($scope, IFAssetServiceProvider, IFIncidentServiceProvider){
                var infoPanel = $('#info-panel');
                var incidentFormData;
                var contactFormData;
                var currentAsset;
                var POSITION;

                /*BEGIN: enums*/
                var infoboxBodyEnum = {streetlightInfo:1, adhocInfo:2, incidentInfo: 3, incidentForm:4,  contactForm:5, submissionResultMessage:6};
                var infoboxFooterEnum = {streetlightInfoFooter:1, adhocInfoFooter:2, incidentInfoFooter: 3, incidentFormFooter:4,  contactFormFooter:5, submissionResultMessageFooter:6};
                /*END: enums*/

                /*title*/
                createInfoBoxTitle = function(type, id){
                    infoPanel.find(".title-bar").html(getInfoBoxTitle(id));
                };

                /*BEGIN: body*/
                createInfoBoxBody = function(infoboxBodyEnum, id, position){
                    /*id: adhocId(-1), incidentId, streetlightId*/
                    /*LatLng(position.k, position.D)*/
                    var bodyContent = '';
                    var footerType = '';

                    switch(infoboxBodyEnum){
                        case 2:
                            bodyContent = getAdhocLocationMessage();
                            footerType = infoboxFooterEnum.adhocInfoFooter
                            break;
                        case 3:
                            bodyContent = getIncidentInfo(id);
                            footerType = infoboxFooterEnum.incidentInfoFooter;
                            break;
                        case 4:
                            loadIncidentFormValidator(id); /*check if overrides is applicable*/
                            bodyContent = getIncidentForm(id);
                            footerType = infoboxFooterEnum.incidentFormFooter;
                            break;
                        case 5:
                            loadContactFormValidator(id);
                            bodyContent = getContactForm(id); /*check if overrides is applicable*/
                            footerType = infoboxFooterEnum.contactFormFooter;
                            break;
                        case 6:
                            bodyContent = diplaySpinnerAlert();
                            footerType = infoboxFooterEnum.submissionResultMessageFooter;
                            break;
                        default:
                            bodyContent = getStreetlightInfo(id);
                            footerType = infoboxFooterEnum.streetlightInfoFooter;
                            break;
                    }

                    infoPanel.find("#info-box-content").html(bodyContent);

                    /*body will drive footer button*/
                    getInfoBoxFooter(footerType, id, position)
                };

                /*BEGIN: footer*/
                getInfoBoxFooter = function(footer, id, position){
                    var button1 = $('#footerButton1'),
                        button2 = $('#footerButton2');

                    resetFooterButtons();

                    button1.addClass("info-btn");
                    button2.addClass("info-btn");

                    switch (footer) {
                        case 2:
                            button1.text('Return to Map')
                                .click(function(){$scope.hideInfoPanel()});

                            button2.text('Report This Light')
                                .click(function(){createInfoBoxBody(infoboxBodyEnum.incidentForm, id, position)});
                            break;
                        case 3:
                            button1.hide();
                            button2.text('Return to Map')
                                .click(function(){$scope.hideInfoPanel()});
                            break;
                        case 4:
                            button1.text('Cancel')
                                .click(function(){$scope.hideInfoPanel()});

                            button2.text('Continue')
                                .click(function(){
                                    if (isIncidentFormValid()){
                                        incidentFormData = createFormData($('#incidentInformationForm')[0]);
                                        createInfoBoxBody(infoboxBodyEnum.contactForm, id, position);
                                    };
                                });
                            break;
                        case 5:
                            button1.text('Go Back')
                                .click(function(){createInfoBoxBody(infoboxBodyEnum.incidentForm, id, position)});

                            button2.text('Report')
                                .click(function(){
                                    if (isContactFormValid(id)) {
                                        contactFormData = createFormData($('#contactInformationForm')[0]);
                                        /*submit report*/
                                       reportIncident(id, position);
                                        createInfoBoxBody(infoboxBodyEnum.submissionResultMessage, id);
                                    };
                                });
                            break;
                        case 6:
                            button1.hide();

                            button2.text('Thank You')
                                .click(function(){$scope.hideInfoPanel()});
                            break;
                        default :
                            button1.text('Return to Map')
                                .click(function(){$scope.hideInfoPanel()});

                            button2.text('Report This Light')
                                .click(function(){
                                    createInfoBoxBody(infoboxBodyEnum.incidentForm, id, position);
                                });

                            break;
                    }
                };

                resetFooterButtons = function(){
                    var button1 = $('#footerButton1');
                    var button2 = $('#footerButton2');

                    button1.text('action1')
                        .unbind('click')
                        .removeAttr('class')
                        .show();

                    button2.text('action2')
                        .unbind('click')
                        .removeAttr('class')
                        .show();
                };
                /*END: footer*/

                /*BEGIN: infopanel*/
                $scope.showInfoPanel = function(scope, title, position){
                    $scope.$broadcast('hideAlert');
                    //POSITION = position;
                    var title = title.split(':');
                    var type = '';
                    var id = title[1] || -1;

                    switch(title[0].toLowerCase()){
                        case 'adhoc':
                            type = infoboxBodyEnum.adhocInfo;
                            break;
                        case 'incident':
                            type = infoboxBodyEnum.incidentInfo;
                            break;
                        default:
                            type = infoboxBodyEnum.streetlightInfo;
                            break;
                    }

                    $scope.$broadcast('getAddress', position); /*address to be used in form*/


                    createInfoBoxTitle(type, id);
                    createInfoBoxBody(type, id, position);
                    //$scope.getInfoBoxFooter();
                    $('#info-panel').show('slide', {direction: 'right'}, 300);
                };

                $scope.hideInfoPanel = function(){
                    $('#info-panel').hide('slide', {direction: 'right'}, 300, function(){
                        //$(this).addClass("hidden");
                    });
                };
                /*END: infopanel*/

                /*BEGIN: properties*/
                getInfoBoxTitle = function(id){
                    var defaultTitle = 'streetlight details';
                    if (id > 0){
                        return CONFIGURATION.infoBoxTitle || defaultTitle;
                    }else{
                        return CONFIGURATION.adhocInfoBoxTitle || defaultTitle;
                    };
                };

                getAdhocLocationMessage = function(){
                    /*TODO: get from configuration*/
                    /*do we need to separate the div so that a css class can be defined independently*/
                    var defaultMessage = "<div class='alert alert-info'>"
                        + "You are reporting a light that does not match our inventory and does not appear on the map. "
                        + "Please ensure that the location is accurate and click the continue button to report an outage."
                        + "</div>"
                        + "<div class='alert alert-error'>"
                        + "Maybe we can provide more information regarding this location like address."
                        + "<p><div id='assetAddress'></div></p>"
                        + "</div>";

                    return CONFIGURATION.adhocLocationMessage || defaultMessage;

                };

                getIncidentForm = function(id){
                    var defaultForm = "<form id='incidentInformationForm'>"
                        + "<h6>Can you tell us what's wrong so that we can send the best crew for the job.</h6>"
                        + "<label>Address</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-location'></span></span>"
                        + "<textarea id='sloStreetLightAddress' class='input-xlarge' rows='3' placeholder='Enter address here'>" + ASSETADDRESS + "</textarea>"
                        + "</div>"
                        /*+ "<p><div id='sloStreetLightAddress'>" + ASSETADDRESS + "</div></p>"*/
                     /*   + "<label>Street Number</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-lamp'></span></span>"
                        + "<input id='streetNumber' type='text' class='input-xlarge' placeholder='123456'>"
                        + "</div>"
                        + "<label>Street Name</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-lamp'></span></span>"
                        + "<input id='streetName' type='text' class='input-xlarge' placeholder='Main Street'>"
                        + "</div>"
                        + "<label>City</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-lamp'></span></span>"
                        + "<input id='city' type='text' class='input-xlarge' placeholder='City'>"
                        + "</div>"
                        + "<label>State</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-lamp'></span></span>"
                        + "<input id='state' type='text' class='input-xlarge' placeholder='State'>"
                        + "</div>"
                        + "<label>Zip Code</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-lamp'></span></span>"
                        + "<input id='zipCode' type='text' class='input-xlarge' placeholder='Zip Code'>"
                        + "</div>"*/
                        + "<label>Problem Type</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-wrench'></span></span>"
                        + "<select id='problemType' class='input-xlarge' required>"
                        + "<option value='Light Out' selected>Light Out</option>"
                        + "<option value='Light on during day'>Light on during day</option>"
                        + "<option value='Light dim'>Light dim</option>"
                        + "<option value='Light noisy'>Light noisy</option>"
                        + "<option value='Light cycling on/off'>Light cycling on/off</option>"
                        + "<option value='Animal nest'>Animal nest</option>"
                        + "<option value='Expose wires - base'>Expose wires - base</option>"
                        + "<option value='Other'>Other</option>"
                        + "</select>"
                        + "</div>"
                        + "<label>Pole Number</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-lamp'></span></span>"
                        + "<input id='poleNumber' type='text' class='input-xlarge' placeholder='If available, enter the pole number'>"
                        + "</div>"
                        + "<label>Description of Problem Type</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-bubble'></span></span>"
                        + "<textarea id='comment' class='input-xlarge' rows='4' placeholder='Enter comment here'></textarea>"
                        + "</div>"
                        + "<div id='incidentErrorSummary' class='alert alert-error' style='display: none'></div>"
                        + "</form>";

                    if (id > 0){
                        return CONFIGURATION.incidentForm || defaultForm;
                    }else{
                        return CONFIGURATION.adhocIncidentForm || defaultForm;
                    };
                };

                getContactForm = function(id){
                    var defaultForm = "<form id='contactInformationForm'>"
                        + "<h6>Just in case, fill-in the information below so that we can get in touch with you.</h6>"
                        + "<label>Name</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-user'></span></span>"
                        + "<input id='name' type='text' class='input-xlarge' placeholder='Enter your name' maxlength='100' pattern='^[a-zA-Z][a-zA-Z0-9-_\.]{1,40}$' required>"
                        + "</div>"
                        + "<label>Phone</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-phone'></span></span>"
                        + "<input id='phone' type='tel' class='input-xlarge' placeholder='(555) 555-5555' maxlength='14' pattern='\d{3}[\-]\d{3}[\-]\d{4}' required>"
                        + "</div>"
                        + "<label>Email</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-mail'></span></span>"
                        + "<input id='email' type='email' class='input-xlarge' placeholder='Enter your email' maxlength='100' required>"
                        + "</div>"
                        + "<label>Verify Email</label>"
                        + "<div class='input-prepend'>"
                        + "<span class='add-on'><span class='icon-mail'></span></span>"
                        + "<input id='verifyEmail' type='email' class='input-xlarge' placeholder='Verify your email' maxlength='100' required>"
                        + "</div>"
                        + "<label class='checkbox'>"
                        + "<input id='terms' type='checkbox' required>Agree to Terms and Conditions"
                        + "</label>"
                        + "<a href='http://www.example.com' target='_blank'>View Terms and Conditions</a>"
                        + "<div id='contactErrorSummary' class='alert alert-error' style='display: none'></div>"
                        + "</form>";

                    if (id > 0){
                        return CONFIGURATION.contactForm || defaultForm;
                    }else{
                        return CONFIGURATION.adhocContactForm || defaultForm;
                    };
                };

                submissionSuccessMessage = function(){
                    var defaultMessage = "Your incident report has been submitted.<br/><br/>"
                    + "StreetLightOutages.com appreciates your help in keeping our communities safe by reporting interruptions of service in your area.";
                    var message = CONFIGURATION.submissionSuccessMessage || defaultMessage;

                    return "<div id='submitIncidentResult' class='alert alert-info'>" + message + "</div>";
                };

                diplaySpinnerAlert = function(){
                    var defaultMessage = "<div id='submitIncidentResult' class='alert alert-info'>Submitting your report...</div>";/*TODO*/

                    return CONFIGURATION.submissionSuccessMessage || defaultMessage;
                };

                getSubmissionFailureMessage = function(){
                    var defaultMessage = "Your submission was not successful.  Please try again.";
                    var message = CONFIGURATION.submissionFailureMessage || defaultMessage;

                    return "<div id='submitIncidentResult' class='alert alert-info'>" + message + "</div>";
                };
                /*END: properties*/

                /*BEGIN: helpers*/
                findObjectInSloArray = function(array, id){
                    for (var i = 0; i < array.length; i++){
                        if(array[i].id === parseInt(id)){
                            return array[i];
                        };
                    };

                    return null;
                };

                createFormData = function(form){
                    var formData = {};
                    var formElements = form;

                    for (var i = 0 ; i < formElements.length; i++) {
                        var element = formElements[i];

                        if (element.type == 'checkbox') {
                            formData[element.id] = element.checked;
                        } else {
                            formData[element.id] = element.value;
                        }
                    }
                    return formData;
                };

                /*END: helpers*/

                /*BEGIN: http calls*/
                getStreetlightInfo = function(id) {
                    currentAsset = findObjectInSloArray(ASSETS, id);

                    IFAssetServiceProvider.getAssetInfo(USERTOKEN, currentAsset.polenumber, currentAsset.orgid ).then(function(result){
                        var content = result[0]['Value'][1]['Value'][0] + "<p><div id='sloStreetLightAddress' class='alert alert-info'><b>Estimated Location:</b><br/>" + ASSETADDRESS + "</div></p>";
                        infoPanel.find("#info-box-content").html(content);
                    }, function(reason){
                        var msg = '<div class="alert alert-info">' + reason + "</div>";
                        infoPanel.find("#info-box-content").html(msg);
                    });

                    /* var content = "<p><img class='preview-img' src='resources/ifactor/images/default/unknown.jpg'></p>"
                     + "<p class="info-msg">There are no known outages for this light.</p>"
                     + "<p>Pole Number: 756454-620200</p>"
                     + "<p>Light Type: High Pressure Sodium</p>"
                     + "<p>Light Style: Cobra Head</p>"
                     + "<p>Wattage: 100</p>"
                     + "<div class='alert alert-info'><p class="bold">Additional Information:</p>"
                     + "On December 25 2014 - December 31 2014, there will be a scheduled maintenance outage in this area.</div>";

                     return content;*/
                };

                getIncidentInfo = function(id) {
                    IFIncidentServiceProvider.getIncidentInfo(USERTOKEN, id).then(function(result){
                        var dispResult = result;
                        dispResult = dispResult.replace(/\\*/g, '');
                        dispResult = dispResult.substring(1, dispResult.length -1);
                        /*END: workaround*/
                        infoPanel.find("#info-box-content").html(dispResult);
                    }, function(reason){
                        var msg = '<div class="alert alert-info">' + reason + "</div>";
                        infoPanel.find("#info-box-content").html(msg);
                    });

                    /*var content = "<p><img class='preview-img' src='resources/ifactor/images/default/unknown.jpg'></p>"
                     + "<p class="info-msg">We are aware of a problem on this light.</p>"
                     + "<p>Pole Number: 756454-620200</p>"
                     + "<p>Order #: 123456</p>"
                     + "<p>Date Reported: 01/01/2015 4:10:59 PM</p>"
                     + "<div class='alert alert-error'><p class="bold">Additional Information:</p>"
                     + "On December 25 2014 - December 31 2014, there will be a scheduled maintenance outage in this area.</div>";

                     return content;*/
                };

                reportIncident = function(id, position) {

                    $scope.$broadcast('createIncidentMarker', 'pending', position); /*mark the location*/

                    var data = $.extend({}, incidentFormData, contactFormData);

                    IFIncidentServiceProvider.reportIncident(USERTOKEN, position.lat(), position.lng(), id, JSON.stringify(data)).then(function(result){
                        /*mark the position with a valid incidentId*/
                        $scope.$broadcast('createIncidentMarker', 'incident:' + result[0], position, 1);

                        infoPanel.find("#info-box-content").html(submissionSuccessMessage());

                    }, function(reason){
                        infoPanel.find("#info-box-content").html(submissionFailureMessage());
                    });
                };
                /*END:http calls*/

                /*BEGIN: form validations*/
                var ERROR_SUMMARY_HEADER = '<b>Correct the following error(s):</b>';

                /*overridable method*/
                isIncidentFormValid = function(){
                    var isValid = true;
                    /*run this validation for default form only*/
                    if (CONFIGURATION.incidentForm === undefined) {
                        var problemtTypeObj = $('#problemType');
                        var poleNumberObj = $('#poleNumber');
                        var commentObj = $('#comment');
                        var errorSummaryObj = $('#incidentErrorSummary');
                        var errorMessage = ERROR_SUMMARY_HEADER;

                        var problemtType = problemtTypeObj.val().toLowerCase();
                        var poleNumber = poleNumberObj.val().toLowerCase();
                        var comment = commentObj.val().toLowerCase();

                        errorSummaryObj.css('display', 'none');
                        commentObj.css('border-color', '');

                        if (problemtType.indexOf('other') >= 0 && comment.length === 0) {
                            isValid = false;
                            commentObj.css('border-color', 'red');
                            errorMessage = errorMessage + '<br/>We can address this issue quicker if you can provide us details.';
                        }
                        ;

                        if (!isValid) {
                            errorSummaryObj.html(errorMessage);
                            errorSummaryObj.css('display', 'block');
                        }
                        ;
                    };

                    return isValid;
                };

                loadIncidentFormValidator = function(id){
                    var validatorContent = '';

                    if (id > 0) {
                        validatorContent = CONFIGURATION.incidentFormValidator;
                    }else{
                        validatorContent = CONFIGURATION.adhocIncidentFormValidator;
                    };

                    if (validatorContent != undefined && validatorContent.length > 0){
                        isIncidentFormValid = new Function('return ' + validatorContent)();
                    };
                };

                /*overridable method*/
                isContactFormValid = function(id){
                    var isValid = true;
                    /*run this validation for default form only*/
                    if (CONFIGURATION.contactForm === undefined) {
                        var nameObj = $('#name');
                        var phoneObj = $('#phone');
                        var emailObj = $('#email');
                        var verifyEmailObj = $('#verifyEmail');
                        var errorSummaryObj = $('#contactErrorSummary');
                        var errorMessage = ERROR_SUMMARY_HEADER;

                        var name = nameObj.val();
                        var phone = phoneObj.val();
                        var email = emailObj.val();
                        var verifyEmail = verifyEmailObj.val();

                        nameObj.css('border-color', '');
                        phoneObj.css('border-color', '');
                        emailObj.css('border-color', '');
                        verifyEmailObj.css('border-color', '');
                        errorSummaryObj.css('display', 'none');

                        if (name.length === 0) {
                            nameObj.css('border-color', 'red');
                            errorMessage = errorMessage + '<br/>Name is required.';
                            isValid = false;
                        }
                        ;

                        if (phone.length === 0) {
                            errorMessage = errorMessage + '<br/>Phone is required.';
                            phoneObj.css('border-color', 'red');
                            isValid = false;
                        }
                        else {
                            if (!isPhoneValid(phone)) {
                                phoneObj.css('border-color', 'red');
                                errorMessage = errorMessage + '<br/>Check your phone entry';
                                isValid = false;
                            }
                            ;
                        }
                        ;

                        if (email.length === 0) {
                            emailObj.css('border-color', 'red');
                            errorMessage = errorMessage + '<br/>Email is required.';
                            isValid = false;
                        } else {
                            if (isEmailValid(email)) {
                                if (email != verifyEmail) {
                                    emailObj.css('border-color', 'red');
                                    verifyEmailObj.css('border-color', 'red');
                                    errorMessage = errorMessage + '<br/>Email does not match verify email.';
                                    isValid = false;
                                }
                                ;
                            } else {
                                errorMessage = errorMessage + '<br/>Email is not valid.';
                                emailObj.css('border-color', 'red');
                                isValid = false;
                            }
                            ;
                        }
                        ;

                        if (!isValid) {
                            errorSummaryObj.html(errorMessage);
                            errorSummaryObj.css('display', 'block');
                        }
                        ;
                    }
                    return isValid;
                };

                loadContactFormValidator = function(id){
                    var validatorContent = '';

                    if (id > 0) {
                        validatorContent = CONFIGURATION.contactFormValidator;
                    }else{
                        validatorContent = CONFIGURATION.adhocContactFormValidator;
                    };

                    if (validatorContent != undefined && validatorContent.length > 0){
                        isContactFormValid = new Function('return ' + validatorContent)();
                    };
                };

                isPhoneValid = function(phone){
                    var expression = /^\(?(\d{3})\)?[-. ]?(\d{3})[-. ]?(\d{4})$|\d{10}/;
                    /*will capture the following: 1234567890, (123)456-7890, 123.456.7890, 123-456-7890*/
                    return isValueValid(expression, phone);
                };

                isEmailValid = function(email){
                    var expression = /^([\w-]+(?:\.[\w-]+)*)@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum|coop)\b/i;
                    return isValueValid(expression, email);
                };

                isValueValid = function(expression, value){
                    var reg = new RegExp(expression);
                    return reg.test(value);
                };

                /*END: form validations*/
            }],
            /*scope: {},*/  /*isolated scope*/
            link: function(scope, element, attrs){
                /*BEGIN: infobox event listeners*/

                scope.$on('showInfoPanel', function(event, title, position) {
                    scope.showInfoPanel(scope, title, position);
                });

                scope.$on('hideInfoPanel', function() {
                    scope.hideInfoPanel();
                });
                /*END: infobox event listeners*/
            }
        };

    }]);
})();
