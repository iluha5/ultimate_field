/**
 * Created by Iluha on 26.05.2018.
 */

(function () {
    'use strict';

    function Ulti() {
        // here will be configuration from JSON file
        this.config = {};

        // test url
        this.CONFIG_URL = '//localhost:8080/server/ulti.json';

        // real sizes of the playing field in meters
        this.FIELD_WIDTH = 20;
        this.FIELD_HEIGHT = 40;
        this.PLAYERS_PER_TEAM = 5;
        this.DEFAULT_COORDS_5PLAYERS = {
            "step" : 0,
            "speed" : 1,
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
        this.saveBut = document.querySelector('.ulti-field__controls-save');
        this.saveLinkBut = document.querySelector('.ulti-field__controls-save-link');
        this.editBut = document.querySelector('.ulti-field__controls-edit');

        // factor for transition real size of the field to pixels
        this.SIZE_FACTOR = this.fieldWidth / this.FIELD_WIDTH;

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
            if (isClearAll) {
                this.descrElement.innerHTML = '';
                this.stepsDescr = [];
            } else {
                descript = (this.currStep + 1) + '. ' + descript + '<br>';
                this.stepsDescr.push(descript);

                this.descrElement.innerHTML = '';
                for (let i = 0; i < this.stepsDescr.length; i++){
                    this.descrElement.innerHTML =  this.stepsDescr[i] + this.descrElement.innerHTML;
                }

                // this.descrElement.innerHTML = (this.currStep + 1) + '. ' + descript + '<br>' + this.descrElement.innerHTML;
            }
        };

        this.fetchCoordsOutField = function(coords){
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

            for (let i = 0; i < this.teamOneElements.length; i++) {
                playerIndex = 'player' + i;
                this.showPlayer(this.teamOneElements[i], [stepObj.teamOneCoords[playerIndex][0], stepObj.teamOneCoords[playerIndex][1]]);
            }

            for (let i = 0; i < this.teamTwoElements.length; i++) {
                playerIndex = 'player' + i;
                this.showPlayer(this.teamTwoElements[i], [stepObj.teamTwoCoords[playerIndex][0], stepObj.teamTwoCoords[playerIndex][1]]);
            }

            // Check current disc coords
            if ((stepObj.discOwn[0] > this.PLAYERS_PER_TEAM - 1) || (stepObj.discOwn[0] < 0) ||
                (!this._isNumeric(stepObj.discOwn[0]) ) || (stepObj.discOwn[1] > this.PLAYERS_PER_TEAM - 1) ||
                (stepObj.discOwn[1] < 0) || (!this._isNumeric(stepObj.discOwn[1]) )) {
                this.showError('Wrong current disc coords. Please check config file.');
                return;
            }

            playerIndex = 'player' + stepObj.discOwn[1];

            if (stepObj.discOwn[0]) {
                playerWithDiscCoords = [stepObj.teamTwoCoords[playerIndex][0], stepObj.teamTwoCoords[playerIndex][1]];
                team = 1;
            } else {
                playerWithDiscCoords = [stepObj.teamOneCoords[playerIndex][0], stepObj.teamOneCoords[playerIndex][1]];
                team = 0;
            }

            this.showDisc(playerWithDiscCoords, team);

            if (!isDefault) {
                this.showCurrentDescription(stepObj.description, false);
                this.currStep++;
            }


        };

        this.showPrevStep = function(){
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
         * @param {gameObject} configData
         * @param {Ulti} parent
         */
        this.initialize = function (configData, parent, gameMode) {
            parent.config = configData;
            // console.log(config);
            // parent.showGrid();
            var prevButClick;

            parent.showStep(parent.DEFAULT_COORDS_5PLAYERS, true);

            switch (gameMode) {
                case parent.SHOW_GAME_MODE:

                    parent.playBut.addEventListener('click', function playButListener (evt) {
                        if (!parent._isLastStep(parent.config)) {
                            parent.showStep(parent.config[0].game[parent.currStep]);
                        }
                    });

                    parent.prevBut.addEventListener('click', prevButClick = function (evt) {
                        parent.showPrevStep();
                    });

                    parent.clearBut.addEventListener('click', function clearButListener (evt) {
                        parent.currStep = 0;
                        parent.showCurrentDescription('', true);
                        parent.showStep(parent.DEFAULT_COORDS_5PLAYERS, true);

                        parent.writeToFile();
                    });

                    parent.fileBut.addEventListener('change', function fileButListener  (evt) {
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

                    parent.saveBut.addEventListener('click', function saveButListener  (evt) {
                        parent.writeToFile(parent.config);
                    });

                    break;
                case parent.EDIT_GAME_MODE :
                    prevButClick = prevButClick ? parent.prevBut.removeEventListener(prevButClick) : prevButClick;

                    parent.editBut.addEventListener('click', function(evt){
                        parent.editGame(parent.config);
                    });

                    break;
                }

        };

        /**
         *  Show errors in status line Element
         * @param {String} error
         * @param {Boolean} isClear
         */
        this.showError = function (error, isClear) {
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

        this.writeToFile = function(text){
            // debugger;
            text = text || 'Hello, world';

            var blob = new Blob([JSON.stringify(text, null, 2)], {type : 'application/json'});
            var url = URL.createObjectURL(blob);
            var parent = this;

            var reader = new FileReader();

            reader.onloadend = function(){
                var tagUrl = reader.result;
                var event = new Event('click');

                parent.saveLinkBut.href = tagUrl;
                parent.saveLinkBut.dispatchEvent(event);

                // var temp = '<a href="' + urlHere + '" download> Сохранить разбежку </a>';
                //
                // parent.descrElement.innerHTML = "privet" + temp;
            };

            reader.onerror = function(){
                parent.showError('Download error. Please, try again!');
            };

            reader.readAsDataURL(blob);
        };
    }


    var ulti = new Ulti();

    // ulti.loadConfig(ulti.initialize, ulti);
    ulti.initialize(ulti.DEFAULT_CONFIG, ulti, ulti.EDIT_GAME_MODE);
})();
