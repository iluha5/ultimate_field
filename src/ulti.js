/**
 * Created by Iluha on 26.05.2018.
 */

(function () {
    'use strict';

    function Ulti() {
        // here will be configuration from JSON file
        this.config = {};

        // test url
        this.CONFIG_PATH = '//localhost:8080/server/ulti.json';

        // real width of the playing field
        this.FIELD_WIDTH_IN_METERS = 20;

        //counter for showing description 1. 2. 3... etc.
        this.descriptionCounter = 1;

        // get status line for error showing
        this.statusLineElement = document.querySelector('.ulti-field__status-line');

        // get description Element for showing descriptions
        this.descriptionElement = document.querySelector('.ulti-field__descript-body');

        // get disc Element
        this.discElement = document.querySelector('.ulti-field__disc');

        // get current field's width from layout
        this.fieldWidth = parseInt( getComputedStyle(document.querySelector('.ulti-field__container') ).width);

        // get current field's height from layout
        this.fieldHeight = parseInt( getComputedStyle(document.querySelector('.ulti-field__container') ).width);

        // get current zone's height from layout
        this.zoneHeight = parseInt( getComputedStyle(document.querySelector('.ulti-field__zone') ).width);

        // factor for transition real size of the field to pixels
        this.sizeFactor = this.fieldWidth / this.FIELD_WIDTH_IN_METERS;

        // get array of team1 players (Elements)
        this.teamOneElements = document.querySelectorAll('.ulti-field__team1');

        // get array of team2 players (Elements)
        this.teamTwoElements = document.querySelectorAll('.ulti-field__team2');

        /**
         * show disc on the field with coords
         * @param {Array} playerCoords
         * @param {Number} team
         */
        this.showDisc = function(playerCoords, team){
            console.log(playerCoords);

            var gap = team ? -5 : 5;

            this.discElement.style.left = Math.ceil( playerCoords[0] * this.sizeFactor - gap ) + 'px';
            this.discElement.style.top = Math.ceil( playerCoords[1] * this.sizeFactor + gap ) + 'px';

        };

        /**
         *  Show description for current step
         * @param {String} descript
         * @param {Boolean} isClearAll
         */
        this.showCurrentDescription = function (descript, isClearAll){
            if (isClearAll) {
                this.descriptionElement.innerHTML = this.descriptionCounter + '. ' + descript + '<br>';
            } else {
                this.descriptionElement.innerHTML += this.descriptionCounter + '. ' + descript + '<br>';
            }
        };

        /**
         * Show current position for all Elements on the field. Show current step's description.
         * @param {Object} stepObj
         */
        this.showStep = function(stepObj){
            var playerIndex;
            var playerWithDiscCoords;
            var team;

            console.log(this.fieldWidth);

            for (let i = 0; i < this.teamOneElements.length; i++){
                playerIndex = 'player' + i;
                this.teamOneElements[i].style.left = Math.ceil(stepObj.teamOneCoords[playerIndex][0] * this.sizeFactor) + 'px';
                this.teamOneElements[i].style.top = Math.ceil(stepObj.teamOneCoords[playerIndex][1] * this.sizeFactor) + 'px';
            }

            for (let i = 0; i < this.teamTwoElements.length; i++){
                playerIndex = 'player' + i;
                this.teamTwoElements[i].style.left = Math.ceil(stepObj.teamTwoCoords[playerIndex][0] * this.sizeFactor) + 'px';
                this.teamTwoElements[i].style.top = Math.ceil(stepObj.teamTwoCoords[playerIndex][1] * this.sizeFactor) + 'px';
            }

            playerIndex = 'player' + stepObj.discOwn[1];

            if ( stepObj.discOwn[0] ) {
                playerWithDiscCoords = [ stepObj.teamTwoCoords[playerIndex][0], stepObj.teamTwoCoords[playerIndex][1] ];
                team = 1;
            } else {
                playerWithDiscCoords = [ stepObj.teamOneCoords[playerIndex][0], stepObj.teamOneCoords[playerIndex][1] ];
                team = 0;
            }

            this.showDisc(playerWithDiscCoords, team);

            this.showCurrentDescription(stepObj.description, false);

        };

        /**
         *
         * @param {JSONParseObject} config
         * @param {Ulti} parent
         */
        this.initialize = function (config, parent) {
            parent.showStep(config[0]);
        };

        /**
         *  Show errors in status line Element
         * @param {String} error
         */
        this.showError = function(error){
            this.statusLineElement.innerHTML += 'error: ' + error + '<br>'; //reflow
        };

        /**
         * Load JSON configuration file and initialize it
         * @param {Callback} callback
         * @param {Ulti} parent
         */
        this.loadConfig = function(callback, parent){
            var xhr = new XMLHttpRequest();

            xhr.onload = function (evt){
                if (this.status === 200){
                    var requestObj = evt.target;
                    var loadedData = JSON.parse(requestObj.response);
                    callback(loadedData, parent);
                } else {
                    parent.showError('Server error');
                }
            };

            xhr.onerror = function(){
                parent.showError('XHR error');
            };

            xhr.timeout = 10000;
            xhr.ontimeout = function(){
                showError('TimeOut');
            };

            xhr.open('GET', this.CONFIG_PATH);
            xhr.send();

        };
    }


    var configJSON;

    var ulti = new Ulti();
    ulti.loadConfig(ulti.initialize, ulti);

})();
