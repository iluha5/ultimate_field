/**
 * Created by Iluha on 26.05.2018.
 */

(function () {
    'use strict';

    function Ulti() {
        // here will be configuration from JSON file
        this.config = {};
        this.configCopy = {};

        // test url
        this.CONFIG_URL = '//localhost:8080/server/ulti.json';

        // real sizes of the playing field in meters
        this.FIELD_WIDTH = 20;
        this.FIELD_HEIGHT = 40;
        this.PLAYERS_PER_TEAM = 5;
        this.DEFAULT_COORDS_5PLAYERS = {
            "step": 0,
            "speed": 1,
            "description": "This is example step. Please, load config file with the game.",
            "teamOneCoords": {
                "player0": [6, 5],
                "player1": [8, 5],
                "player2": [10, 5],
                "player3": [12, 5],
                "player4": [14, 5]
            },
            "teamTwoCoords": {
                "player0": [6, 34.3],
                "player1": [8, 34.3],
                "player2": [10, 34.3],
                "player3": [12, 34.3],
                "player4": [14, 34.3]
            },
            "discOwn": [0, 1]
        };
        this.DEFAULT_CONFIG = [
            {
                "name": "default game",
                "game": [
                    this.DEFAULT_COORDS_5PLAYERS
                ]
            }
        ];
        this.GAP_EDGE_END = 13;
        this.GAP_EDGE_START = 2;

        this.SHOW_GAME_MODE = 0;
        this.EDIT_GAME_MODE = 1;

        this.gameMode = 0;
        this.currStep = 0;
        this.stepsDescr = [];

        this.statusLineElement = document.querySelector('.ulti-field__status-line');
        this.descrElement = document.querySelector('.ulti-field__descript-body');
        this.discElement = document.querySelector('.ulti-field__disc');
        this.fieldWidth = parseInt(getComputedStyle(document.querySelector('.ulti-field__container')).width);
        this.fieldHeight = parseInt(getComputedStyle(document.querySelector('.ulti-field__container')).width);
        this.zoneHeight = parseInt(getComputedStyle(document.querySelector('.ulti-field__zone')).width);

        this.teamOneElements = document.querySelectorAll('.ulti-field__team1');
        this.teamTwoElements = document.querySelectorAll('.ulti-field__team2');

        this.playBut = document.querySelector('.ulti-field__controls-play');
        this.prevBut = document.querySelector('.ulti-field__controls-prev');
        this.clearBut = document.querySelector('.ulti-field__controls-clear');
        this.fileBut = document.querySelector('.ulti-field__controls-file');
        // this.saveBut = document.querySelector('.ulti-field__controls-save');
        this.saveLinkBut = document.querySelector('.ulti-field__controls-save-link');
        this.editBut = document.querySelector('.ulti-field__controls-edit');
        this.showBut = document.querySelector('.ulti-field__controls-show');

        // step list nodes
        this.stepList = document.querySelector('.step-list');
        this.stepTemplate = document.querySelector('#step-list__step-temp');
        this.stepsRowTemplate = document.querySelector('#step-list__row-temp');

        if ('content' in this.stepTemplate) {
            this.stepToClone = this.stepTemplate.content.querySelector('.step-list__step');
        } else {
            this.stepToClone = this.stepTemplate.querySelector('.step-list__step');
        }

        if ('content' in this.stepsRowTemplate) {
            this.stepRowToClone = this.stepsRowTemplate.content.querySelector('.step-list__row');
        } else {
            this.stepRowToClone = this.stepsRowTemplate.querySelector('.step-list__row');
        }



        // factor for transition real size of the field to pixels
        this.SIZE_FACTOR = this.fieldWidth / this.FIELD_WIDTH;

        // listeners
        this.listeners = {};

        /**
         * @param {Mixed} n
         * @return {boolean}
         * @private
         * @private
         */
        this._isNumeric = function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        };

        /**
         *
         * @param {Object} config
         * @return {boolean}
         * @private
         */
        this._isLastStep = function (config) {
            return this.currStep + 1 > Object.keys(config[0].game).length;
        };

        /**
         * show disc on the field with coords
         * @param {Array} playerCoords
         * @param {Number} team
         */
        this.showDisc = function (playerCoords, team) {
            // console.log(playerCoords);

            var gap = team ? -5 : 5;

            this.discElement.style.left = Math.ceil(playerCoords[0] * this.SIZE_FACTOR - gap) + 'px';
            this.discElement.style.top = Math.ceil(playerCoords[1] * this.SIZE_FACTOR + gap) + 'px';

        };

        /**
         *  Show description for current step
         * @param {String} descript
         * @param {Boolean} isClearAll
         */
        this.showCurrentDescription = function (descript, isClearAll) {
            var comment = this.fetchDescription(descript);
            var i;

            if (isClearAll) {
                this.descrElement.innerHTML = '';
                this.stepsDescr = [];
            } else {
                comment = (this.currStep + 1) + '. ' + comment + '<br><br>';
                this.stepsDescr.push(comment);

                this.descrElement.innerHTML = '';
                for (i = 0; i < this.stepsDescr.length; i++) {
                    this.descrElement.innerHTML = this.stepsDescr[i] + this.descrElement.innerHTML;
                }

                // this.descrElement.innerHTML = (this.currStep + 1) + '. ' + descript + '<br>' + this.descrElement.innerHTML;
            }
        };

        this.fetchCoordsOutField = function (coords) {
            var coordX;
            var coordY;

            // Check if coord is out of the field
            coordX = ( (coords[0] * this.SIZE_FACTOR) < (this.FIELD_WIDTH * this.SIZE_FACTOR - this.GAP_EDGE_END) ) ?
                coords[0] : (this.FIELD_WIDTH * this.SIZE_FACTOR - this.GAP_EDGE_END) / this.SIZE_FACTOR;
            coordX = ( (coordX * this.SIZE_FACTOR) > this.GAP_EDGE_START ) ? coordX : this.GAP_EDGE_START / this.SIZE_FACTOR;

            coordY = ( (coords[1] * this.SIZE_FACTOR) < (this.FIELD_HEIGHT * this.SIZE_FACTOR - this.GAP_EDGE_END) ) ?
                coords[1] : (this.FIELD_HEIGHT * this.SIZE_FACTOR - this.GAP_EDGE_END) / this.SIZE_FACTOR;
            coordY = ( (coordY * this.SIZE_FACTOR) > this.GAP_EDGE_START ) ? coordY : this.GAP_EDGE_START / this.SIZE_FACTOR;

            return [coordX, coordY];
        };

        this.isDiscCoordsCorrect = function (stepObj) {
            // Check current disc coords
            if ((stepObj.discOwn[0] > this.PLAYERS_PER_TEAM - 1) || (stepObj.discOwn[0] < 0) ||
                (!this._isNumeric(stepObj.discOwn[0]) ) || (stepObj.discOwn[1] > this.PLAYERS_PER_TEAM - 1) ||
                (stepObj.discOwn[1] < 0) || (!this._isNumeric(stepObj.discOwn[1]) )) {
                this.showError('Wrong current disc coords. Please check config file.');
                return false;
            }

            return true;

        };

        this.fetchDescription = function (string) {
            var find = ['<', '>'];
            var replace = ['&lt;', '&gt;'];
            var returnString = string;
            var regex;

            for (var i = 0; i < find.length; i++) {
                regex = new RegExp(find[i], 'g');
                returnString = returnString.replace(regex, replace[i]);
            }
            return returnString;
        };


        /**
         * Show player on the field with coords.
         * @param {HTMLElement} playerElement
         * @param {Array} coords
         * @return {Boolean}
         */
        this.showPlayer = function (playerElement, coords) {
            var fetchedCoords = [];

            if (!this._isNumeric(coords[0]) || !this._isNumeric(coords[1])) {
                this.showError('Wrong players coords from config file!');
                return false;
            }

            fetchedCoords = this.fetchCoordsOutField(coords);

            playerElement.style.left = Math.ceil(fetchedCoords[0] * this.SIZE_FACTOR) + 'px';
            playerElement.style.top = Math.ceil(fetchedCoords[1] * this.SIZE_FACTOR) + 'px';

        };

        /**
         * Show current position for all Elements on the field. Show current step's description.
         * @param {Object} stepObj
         */
        this.showStep = function (stepObj, isDefault) {
            var playerIndex;
            var playerWithDiscCoords;
            var team;
            var i;

            for (i = 0; i < this.teamOneElements.length; i++) {
                playerIndex = 'player' + i;
                this.showPlayer(this.teamOneElements[i], [stepObj.teamOneCoords[playerIndex][0], stepObj.teamOneCoords[playerIndex][1]]);
            }

            for (i = 0; i < this.teamTwoElements.length; i++) {
                playerIndex = 'player' + i;
                this.showPlayer(this.teamTwoElements[i], [stepObj.teamTwoCoords[playerIndex][0], stepObj.teamTwoCoords[playerIndex][1]]);
            }

            if (!this.isDiscCoordsCorrect(stepObj)) return;

            playerIndex = 'player' + stepObj.discOwn[1];

            if (stepObj.discOwn[0]) {
                playerWithDiscCoords = [stepObj.teamTwoCoords[playerIndex][0], stepObj.teamTwoCoords[playerIndex][1]];
                team = 1;
            } else {
                playerWithDiscCoords = [stepObj.teamOneCoords[playerIndex][0], stepObj.teamOneCoords[playerIndex][1]];
                team = 0;
            }

            this.showDisc(playerWithDiscCoords, team);

            if ( (!isDefault) && (this.gameMode !== this.EDIT_GAME_MODE) ) {
                this.showCurrentDescription(stepObj.description, false);
                this.currStep++;
            }


        };

        this.showPrevStep = function () {
            if (this.currStep === 1) return;
            if (this.currStep > 1) {
                this.currStep -= 2;
                this.stepsDescr.pop();
                this.stepsDescr.pop();

                this.showStep(this.config[0].game[this.currStep]);
            }
        };

        // this.showGrid = function () {
        //
        // };

        /**
         *
         * @param listener
         * @param elem
         */
        this.removeListener = function(listener, elem, type){
            if (listener){
                elem.removeEventListener(type, listener);
            }
        };

        this.disableBut = function(but){
            if ( (but.disabled !== 'undefined') && (!but.disabled) ){
                but.disabled = true;
            }
        };


        this.enableBut = function(but){
            if ( (but.disabled !== 'undefined') && (but.disabled) ){
                but.disabled = false;
            }
        };
        /**
         *
         * @param parent
         * @param removeListeners
         */
        this.initShowGameListeners = function (parent, isRemoveListeners) {
            if (isRemoveListeners){
                parent.removeListener(parent.listeners.prevButClick, parent.prevBut, 'click');
                parent.disableBut(parent.prevBut);

                parent.removeListener(parent.listeners.playButClick, parent.playBut, 'click');
                parent.disableBut(parent.playBut);

                parent.removeListener(parent.listeners.clearButClick, parent.clearBut, 'click');
                parent.disableBut(parent.clearBut);

                parent.removeListener(parent.listeners.fileButChange, parent.fileBut, 'change');
                parent.disableBut(parent.fileBut);

                parent.removeListener(parent.listeners.editButClick, parent.editBut, 'click');
                parent.disableBut(parent.editBut);

                return;
                // this.listeners.prevButClick = prevButClick ? parent.prevBut.removeEventListener(prevButClick) : prevButClick;
            }

            parent.enableBut(parent.prevBut);
            parent.enableBut(parent.playBut);
            parent.enableBut(parent.clearBut);
            parent.enableBut(parent.fileBut);
            parent.enableBut(parent.editBut);

            parent.playBut.addEventListener('click', parent.listeners.playButClick = function playButListener(evt) {
                if (!parent._isLastStep(parent.config)) {
                    parent.showStep(parent.config[0].game[parent.currStep]);
                }
            });

            parent.prevBut.addEventListener('click', parent.listeners.prevButClick = function (evt) {
                parent.showPrevStep();
            });

            parent.clearBut.addEventListener('click', parent.listeners.clearButClick =  function clearButListener(evt) {
                parent.currStep = 0;
                parent.showCurrentDescription('', true);
                parent.showStep(parent.DEFAULT_COORDS_5PLAYERS, true);

                parent.writeToFile(parent.config);
            });

            parent.editBut.addEventListener('click', parent.listeners.editButClick = function (evt) {
                parent.initialize(parent.config, parent, parent.EDIT_GAME_MODE);
            });


            parent.fileBut.addEventListener('change', parent.listeners.fileButChange =  function fileButListener(evt) {
                // var file = evt.target.files;
                var file = parent.fileBut.files;
                // console.log(file[0]);

                if (file[0].type !== 'application/json') {
                    parent.showError('Please check config file');
                    return;
                } else {
                    parent.showError('', true);
                }

                var reader = new FileReader();

                reader.onload = function (evt) {
                    var content = evt.target.result;

                    try {
                        var loadedData = JSON.parse(content);
                    } catch (e) {
                        parent.showError('Parsing error. Please, check config file!' + e.name + e.message);
                        return;
                    }
                    parent.config = loadedData;
                    parent.showCurrentDescription('', true);
                    parent.currStep = 0;
                    parent.showStep(parent.DEFAULT_COORDS_5PLAYERS, true);
                    // console.log(content);
                };

                reader.onerror = function (evt) {
                    parent.showError('Loaded file error!');
                };

                reader.readAsText(file[0]);
            }, false);

            // parent.saveBut.addEventListener('click', function saveButListener(evt) {
            //     parent.writeToFile(parent.config);
            // });


        };

        // this.getEditGameStep = function(parent, ){
        //
        // }

        this.initStepHeader = function(parent, stepHeader, stepNum){
            stepHeader.addEventListener('click', function(){
                var step;

                if (stepHeader.classList.contains('step-list__step-open')) return;

                step = parent.stepList.querySelector('.step-list__step-open');
                step.classList.remove('step-list__step-open');

                stepHeader.classList.add('step-list__step-open');

                parent.currStep = stepNum;

                parent.showStep(parent[0].game[stepNum]);
            });

        };

        this.showEditGameSteps = function(parent){
            var step;
            var coordsRow;
            var container = document.createElement('DIV');

            for (var i = 0; i < parent.config[0].game.length; i++){
                step = parent.stepToClone.cloneNode(true);

                step.querySelector('.step-list__step-number').innerHTML = 'Step ' + (i+1);
                parent.initStepHeader(parent, step.querySelector('.step-list__step-header'), i);

                step.classList.add( ('step-list__step' + i) );

                step.querySelector('.step-list__step-comment').value = parent.config[0].game[i].description;
                // coordsRow = parent.stepRowToClone.cloneNode(true);
                container.appendChild(step);

            }

            parent.stepList.appendChild(container);  //reflow
        };

        this.delEditGameSteps = function(parent){
            parent.stepList.innerHTML = '';
        };

        this.initEditGameListeners = function(parent, isRemoveListeners){
            if (isRemoveListeners) {
                parent.removeListener(parent.listeners.showButClick, parent.showBut, 'click');
                parent.disableBut(parent.showBut);

                return;
            }

            parent.enableBut(parent.showBut);

            parent.showBut.addEventListener('click', parent.listeners.showButClick = function(evt){
                parent.initialize(parent.config, parent, parent.SHOW_GAME_MODE);
            });
        };

        this.cloneConfig = function(config){
            return config.slice(0);
        };

        /**
         *
         * @param {gameObject} configData
         * @param {Ulti} parent
         */
        this.initialize = function (configData, parent, gameMode) {

            parent.config = configData;
            parent.gameMode = gameMode;
            parent.currStep = 0;
            parent.showCurrentDescription('', true);

            switch (parent.gameMode) {
                case parent.SHOW_GAME_MODE:
                    parent.initEditGameListeners(parent, true);
                    parent.delEditGameSteps(parent);

                    parent.initShowGameListeners(parent);
                    parent.writeToFile(parent.config);
                    parent.showStep(parent.config[0].game[parent.currStep], true);

                    break;
                case parent.EDIT_GAME_MODE :
                    parent.initShowGameListeners(parent, true);
                    parent.initEditGameListeners(parent);
                    parent.showEditGameSteps(parent);

                    parent.showStep(parent.config[0].game[parent.currStep]);

                    parent.configCopy = parent.cloneConfig(parent.config);



                    break;
            }



        };

        /**
         *  Show errors in status line Element
         * @param {String} error
         * @param {Boolean} isClear
         */
        this.showError = function (error, isClear) {
            this.statusLineElement.innerHTML = '';
            if (isClear) {
                this.statusLineElement.innerHTML = '';
                return;
            }
            this.statusLineElement.innerHTML += 'error: ' + error + '<br>'; //reflow
        };

        /**
         * Load JSON configuration file and initialize it
         * @param {Callback} callback
         * @param {Ulti} parent
         */
        this.loadConfig = function (callback, parent) {
            var xhr = new XMLHttpRequest();

            xhr.onload = function (evt) {
                if (this.status === 200) {
                    var requestObj = evt.target;

                    try {
                        var loadedData = JSON.parse(requestObj.response);
                    } catch (e) {
                        parent.showError('Parsing error. Please, check config file!' + e.name + e.message);
                        return;
                    }

                    callback(loadedData, parent);
                } else {
                    parent.showError('Server error');
                }
            };

            xhr.onerror = function () {
                parent.showError('XHR error');
            };

            xhr.timeout = 10000;
            xhr.ontimeout = function () {
                parent.showError('TimeOut');
            };

            xhr.open('GET', this.CONFIG_URL);
            xhr.send();

        };

        this.writeToFile = function (text) {
            // debugger;
            text = text || 'Something wrong. Please try again.';

            var blob = new Blob([JSON.stringify(text, null, 2)], {type: 'application/json'});
            var url = URL.createObjectURL(blob);
            var parent = this;

            var reader = new FileReader();

            reader.onloadend = function () {
                var tagUrl = reader.result;
                var event = new Event('click');

                parent.saveLinkBut.href = tagUrl;
                parent.saveLinkBut.dispatchEvent(event);

                // var temp = '<a href="' + urlHere + '" download> Сохранить разбежку </a>';
                //
                // parent.descrElement.innerHTML = "privet" + temp;
            };

            reader.onerror = function () {
                parent.showError('Download error. Please, try again!');
            };

            reader.readAsDataURL(blob);
        };
    }


    var ulti = new Ulti();

    // ulti.loadConfig(ulti.initialize, ulti);
    // TODO вывести список шагов в режиме редактирования

    ulti.initialize(ulti.DEFAULT_CONFIG, ulti, ulti.SHOW_GAME_MODE);
})();
