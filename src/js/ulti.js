/**
 * Created by Iluha on 26.05.2018.
 */

(function () {
    'use strict';

    function Ulti() {
        // this.parent = this;
        // here will be configuration from JSON file
        this.config = {};
        this.originalConfig = {};

        // test url
        this.CONFIG_URL = '//localhost:8080/server/ulti.json';

        // real sizes of the playing field in meters
        this.FIELD_WIDTH = 20;
        this.FIELD_HEIGHT = 40;
        this.PLAYERS_PER_TEAM = 5;
        this.DEFAULT_COORDS_5PLAYERS = {
            "step": 0,
            "speed": 1,
            "description": "This is example step. Change it or load config file with the game.",
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
                    {
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
                    }
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
        this.playerInConfig = undefined;

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
        this.Team1StepsRowTemplate = document.querySelector('#step-list__team1-row-temp');
        this.Team2StepsRowTemplate = document.querySelector('#step-list__team2-row-temp');

        if ('content' in this.stepTemplate) {
            this.stepToClone = this.stepTemplate.content.querySelector('.step-list__step');
        } else {
            this.stepToClone = this.stepTemplate.querySelector('.step-list__step');
        }

        if ('content' in this.Team1StepsRowTemplate) {
            this.team1StepRowToClone = this.Team1StepsRowTemplate.content.querySelector('.step-list__row');
        } else {
            this.team1StepRowToClone = this.Team1StepsRowTemplate.querySelector('.step-list__row');
        }

        if ('content' in this.Team2StepsRowTemplate) {
            this.team2StepRowToClone = this.Team2StepsRowTemplate.content.querySelector('.step-list__row');
        } else {
            this.team2StepRowToClone = this.Team2StepsRowTemplate.querySelector('.step-list__row');
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
            var gap = team ? -5 : 5;
            var fetchedCoords = this.fetchCoordsOutField(playerCoords);

            this.discElement.style.left = Math.ceil(fetchedCoords[0] * this.SIZE_FACTOR - gap) + 'px';
            this.discElement.style.top = Math.ceil(fetchedCoords[1] * this.SIZE_FACTOR + gap) + 'px';

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

            if ((coords[0] !== fetchedCoords[0]) || (coords[1] !== fetchedCoords[1])) {
                this.showError('Players coordinates was fetched to the field!');
            }

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

            if ((!isDefault) && (this.gameMode !== this.EDIT_GAME_MODE)) {
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
        this.removeListener = function (listener, elem, type) {
            if (listener) {
                elem.removeEventListener(type, listener);
            }
        };

        this.disableBut = function (but) {
            if ((but.disabled !== 'undefined') && (!but.disabled)) {
                but.disabled = true;
            }
        };


        this.enableBut = function (but) {
            if ((but.disabled !== 'undefined') && (but.disabled)) {
                but.disabled = false;
            }
        };
        /**
         *
         * @param parent
         * @param removeListeners
         */
        this.initShowGameListeners = function (parent, isRemoveListeners) {
            if (isRemoveListeners) {
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

            // debugger;

            if (parent.listeners.playButClick) {
                parent.removeListener(parent.listeners.playButClick, parent.playBut, 'click');
            }
            parent.playBut.addEventListener('click', parent.listeners.playButClick = function playButListener(evt) {
                if (!parent._isLastStep(parent.config)) {
                    parent.showStep(parent.config[0].game[parent.currStep]);
                }
            });

            if (parent.listeners.prevButClick) {
                parent.removeListener(parent.listeners.prevButClick, parent.prevBut, 'click');
            }
            parent.prevBut.addEventListener('click', parent.listeners.prevButClick = function (evt) {
                parent.showPrevStep();
            });


            if (parent.listeners.clearButClick) {
                parent.removeListener(parent.listeners.clearButClick, parent.clearBut, 'click');
            }
            parent.clearBut.addEventListener('click', parent.listeners.clearButClick = function clearButListener(evt) {
                parent.currStep = 0;
                parent.showCurrentDescription('', true);
                parent.showStep(parent.DEFAULT_COORDS_5PLAYERS, true);

                parent.writeToFile(parent.config);
            });

            if (parent.listeners.editButClick) {
                parent.removeListener(parent.listeners.editButClick, parent.editBut, 'click');
            }
            parent.editBut.addEventListener('click', parent.listeners.editButClick = function (evt) {
                parent.initialize(parent.config, parent, parent.EDIT_GAME_MODE);
            });


            if (parent.listeners.fileButChange) {
                parent.removeListener(parent.listeners.fileButChange, parent.fileBut, 'click');
            }
            parent.fileBut.addEventListener('change', parent.listeners.fileButChange = function fileButListener(evt) {
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

        this.saveEditGameStep = function (parent, stepNum) {
            var step = document.querySelector('.step-list__step' + stepNum);
            var className;
// debugger;
            parent.config[0].game[stepNum].description = step.querySelector('.step-list__step-comment').value;

            for (var j = 0; j < parent.PLAYERS_PER_TEAM; j++) {
                className = '.step-list__step-team1-player' + (j + 1) + '-coordx';
                parent.config[0].game[stepNum].teamOneCoords[('player' + j)][0] = step.querySelector(className).value;
                className = '.step-list__step-team1-player' + (j + 1) + '-coordy';
                parent.config[0].game[stepNum].teamOneCoords[('player' + j)][1] = step.querySelector(className).value;
                // team1CoordsRow.querySelector(className).value = parent.config[0].game[i].teamOneCoords[('player' + j)][1];

                className = '.step-list__step-team2-player' + (j + 1) + '-coordx';
                parent.config[0].game[stepNum].teamTwoCoords[('player' + j)][0] = step.querySelector(className).value;
                // team2CoordsRow.querySelector(className).value = parent.config[0].game[i].teamTwoCoords[('player' + j)][0];
                className = '.step-list__step-team2-player' + (j + 1) + '-coordy';
                parent.config[0].game[stepNum].teamTwoCoords[('player' + j)][1] = step.querySelector(className).value;
                // team2CoordsRow.querySelector(className).value = parent.config[0].game[i].teamTwoCoords[('player' + j)][1];
            }

            parent.writeToFile(parent.config);
        };

        this.delEditGameStep = function (parent, stepNum) {
            var step = document.querySelector('.step-list__step' + stepNum);

            // debugger;
            if (parent.isLastEditGameStep(parent)) {
                alert('Only one step in the game. You can\'t del it.');
                return;
            }

            if (!confirm(('Are you sure to del step' + (stepNum + 1) + '?'))) {
                return;
            }

            if (!parent.config[0].game[stepNum]) {
                return;
            }

            parent.config[0].game.splice(stepNum, 1);
            parent.changeStepsNumeric(false, stepNum);
            parent.showEditGameSteps(parent);

        };

        this.addEditGameStep = function (parent, stepNum) {
            var step = document.querySelector('.step-list__step' + stepNum);
            var newStep;
            var defaultCoords = parent.cloneConfig(parent.DEFAULT_COORDS_5PLAYERS);


            parent.config[0].game.splice((stepNum + 1), 0, defaultCoords);
            parent.changeStepsNumeric(true, stepNum);
            parent.currStep = stepNum + 1;
            parent.showEditGameSteps(parent);

            newStep = document.querySelector('.step-list__step' + parent.currStep);
            newStep.classList.add('step-list__step-open');
            // debugger;
            parent.showStep(parent.config[0].game[parent.currStep]);
            // parent.initStepHeader(parent,  ,(stepNum + 1))

        };

        this.changeStepsNumeric = function (isInsert, stepNum) {
            var stepElem;
            var allSteps = document.querySelectorAll('.step-list__step');

            for (var i = (stepNum + 1); i < allSteps.length; i++) {
                stepElem = document.querySelector(('.step-list__step' + i));
                stepElem.classList.remove('step-list__step' + i);

                if (isInsert) {
                    stepElem.classList.add('step-list__step' + (i + 1));
                } else {
                    stepElem.classList.add('step-list__step' + (i - 1));
                }
            }
        };

        this.isLastEditGameStep = function (parent) {
            return (parent.config[0].game.length <= 1);
        };

        this.changePlayerCoords = function (newCoords, player, parent) {
            var team = player[0] ? 'teamTwoCoords' : 'teamOneCoords';
            var playerString = 'player' + player[1];
            parent.config[0].game[parent.currStep][team][playerString] = newCoords;
        };

        this.getOffsetRect = function (elem) {
            var box = elem.getBoundingClientRect();
            var body = document.body;
            var docElem = document.documentElement;

            var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
            var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

            var clientTop = docElem.clientTop || body.clientTop || 0;
            var clientLeft = docElem.clientLeft || body.clientLeft || 0;

            var top = box.top + scrollTop - clientTop;
            var left = box.left + scrollLeft - clientLeft;

            return {top: Math.round(top), left: Math.round(left)};
        };


        this.fetchMouseCorrdsToField = function (mouseCoords, parent) {
            var ultiField = document.querySelector('.ulti-field__container');
// debugger;
            return [
                mouseCoords[0] - parent.getOffsetRect(ultiField).left,
                mouseCoords[1] - parent.getOffsetRect(ultiField).top
            ];
        };

        this.movePlayerToCoords = function (player, playerElem, mouseCoords, parent) {
            if (!playerElem) return;

            var fetchedMouseCoords = parent.fetchMouseCorrdsToField(mouseCoords, parent);

            var newPlayerCoords = [
                parseFloat((fetchedMouseCoords[0] / parent.SIZE_FACTOR).toFixed(2)),
                parseFloat((fetchedMouseCoords[1] / parent.SIZE_FACTOR).toFixed(2))
            ];

            var fetchedPlayerCoords = parent.fetchCoordsOutField(newPlayerCoords);

            parent.changePlayerCoords(fetchedPlayerCoords, player, parent);
            parent.showStep(parent.config[0].game[parent.currStep]);
            parent.showCurrStepCoords(parent);


        };

        this.isClickOnPlayer = function (target, parent) {
            for (var j = 0; j < 2; j++) {
                for (var i = 0; i < parent.PLAYERS_PER_TEAM; i++) {
                    if (target.classList.contains(('ulti-field__player' + ( j + 1 ) + '-' + ( i + 1) ))) {
                        return [j, i];
                    }
                }
            }

            return false;

        };

        this.clearPlayerInConfig = function(parent){
            var currPlayerInConfigElem = document.querySelector('.ulti-field__player-in-config');

            if (currPlayerInConfigElem) {
                currPlayerInConfigElem.classList.remove('ulti-field__player-in-config');
                parent.playerInConfig = undefined;
            }

        };

        this.initEditGameFieldListeners = function (parent, isClear) {
            var ultiField = document.querySelector('.ulti-field__container');
            // var currPlayerInConfigElem = document.querySelector('.ulti-field__player-in-config');

            if (isClear) {
                parent.clearPlayerInConfig(parent);
                // if (currPlayerInConfigElem) {
                //     currPlayerInConfigElem.classList.remove('ulti-field__player-in-config');
                //     parent.playerInConfig = undefined;
                // }

                if (!parent.listeners.ultiFieldOnClick) return;

                parent.removeListener(parent.listeners.ultiFieldOnClick, ultiField, 'click');
                return;
            }

            if (parent.listeners.ultiFieldOnClick) {
                parent.removeListener(parent.listeners.ultiFieldOnClick, ultiField, 'click');
            }

            ultiField.addEventListener('click', parent.listeners.ultiFieldOnClick = function (evt) {
                // debugger;
                var playerCoords;
                var playerInConfigElem = document.querySelector('.ulti-field__player-in-config');

// debugger;
                if (playerInConfigElem && parent.playerInConfig && !parent.isClickOnPlayer(evt.target, parent)) {
                    parent.movePlayerToCoords(parent.playerInConfig, playerInConfigElem, [evt.pageX, evt.pageY], parent);
                    parent.saveEditGameStep(parent, parent.currStep);
                    parent.playerInConfig = undefined;
                    playerInConfigElem.classList.remove('ulti-field__player-in-config');
                }

                playerCoords = parent.isClickOnPlayer(evt.target, parent);
                if (playerCoords) {
                    if (playerInConfigElem) {
                        playerInConfigElem.classList.remove('ulti-field__player-in-config');
                    }

                    evt.target.classList.add('ulti-field__player-in-config');
                    parent.playerInConfig = playerCoords;
                }
            });
        };

        this.initStepHeader = function (parent, stepHeader, stepNum) {
            stepHeader.addEventListener('click', function (evt) {
                var step;

                // if (evt.target.id === 'step-save') {
                //     parent.saveEditGameStep(parent, stepNum);
                //     return;
                // }

                if (evt.target.id === 'step-del') {
                    parent.clearPlayerInConfig(parent);
                    parent.delEditGameStep(parent, stepNum);
                    return;
                }

                if (evt.target.id === 'step-add') {
                    parent.clearPlayerInConfig(parent);
                    parent.addEditGameStep(parent, stepNum);
                    return;
                }

                if (stepHeader.classList.contains('step-list__step-open')) return;

                step = parent.stepList.querySelector('.step-list__step-open');
                if (step) {
                    step.classList.remove('step-list__step-open');
                }

                stepHeader.parentElement.classList.add('step-list__step-open');
                parent.currStep = stepNum;

                parent.clearPlayerInConfig(parent);
                parent.initEditGameFieldListeners(parent);

                parent.showStep(parent.config[0].game[stepNum]);
            });

        };

        this.initStepBodyListener = function (parent, elem, stepNum) {

            elem.addEventListener('change', function (evt) {
                var className = this.classList[1];
                var axis = className[className.length - 1];
                var playerNum = className.replace(/\D+/g, '') + '';
                var team = (playerNum[0] === '2') ? 'teamTwoCoords' : 'teamOneCoords';
                var player = 'player' + (+playerNum[1] - 1);

                // debugger;
                if (!parent._isNumeric(this.value)) {
                    parent.showError('Not a number inputed!');
                    return;
                }

                if (axis === 'x') {
                    parent.config[0].game[parent.currStep][team][player][0] = +this.value;
                }

                if (axis === 'y') {
                    parent.config[0].game[parent.currStep][team][player][1] = +this.value;
                }

                parent.showStep(parent.config[0].game[parent.currStep]);

                // var header = this.parentNode.parentNode.parentNode.parentNode.parentNode;

                // if (header.classList.contains('step-list__step-header--not-saved')) return;
                //
                // header.classList.add('step-list__step-header--not-saved');
            });
        };

        this.showCurrStepCoords = function (parent) {
            var stepElem = document.querySelector(('.step-list__step' + parent.currStep));
            var className;

            for (var i = 0; i < parent.PLAYERS_PER_TEAM; i++) {
                className = '.step-list__step-team1-player' + (i + 1) + '-coordx';
                stepElem.querySelector(className).value = parent.config[0].game[parent.currStep].teamOneCoords[('player' + i)][0];
                className = '.step-list__step-team1-player' + (i + 1) + '-coordy';
                stepElem.querySelector(className).value = parent.config[0].game[parent.currStep].teamOneCoords[('player' + i)][1];

                className = '.step-list__step-team2-player' + (i + 1) + '-coordx';
                stepElem.querySelector(className).value = parent.config[0].game[parent.currStep].teamTwoCoords[('player' + i)][0];
                className = '.step-list__step-team2-player' + (i + 1) + '-coordy';
                stepElem.querySelector(className).value = parent.config[0].game[parent.currStep].teamTwoCoords[('player' + i)][1];
            }
        };

        this.showEditGameSteps = function (parent) {
            var step;
            var team1CoordsRow;
            var team2CoordsRow;
            var container = document.createElement('DIV');
            var className;

            parent.stepList.innerHTML = '';

            for (var i = 0; i < parent.config[0].game.length; i++) {
                step = parent.stepToClone.cloneNode(true);
                step.querySelector('.step-list__step-number').innerHTML = 'Step ' + (i + 1);

                parent.initStepHeader(parent, step.querySelector('.step-list__step-header'), i);

                step.classList.add(('step-list__step' + i));
                step.querySelector('.step-list__step-comment').innerHTML = parent.config[0].game[i].description;

                parent.currHeader = step.querySelector('.step-list__step-header');


                parent.initStepBodyListener(parent, step.querySelector('.step-list__step-comment'), i);

                team1CoordsRow = parent.team1StepRowToClone.cloneNode(true);
                team2CoordsRow = parent.team2StepRowToClone.cloneNode(true);

                for (var j = 0; j < parent.PLAYERS_PER_TEAM; j++) {
                    className = '.step-list__step-team1-player' + (j + 1) + '-coordx';
                    team1CoordsRow.querySelector(className).value = parent.config[0].game[i].teamOneCoords[('player' + j)][0];
                    parent.initStepBodyListener(parent, team1CoordsRow.querySelector(className), i);

                    className = '.step-list__step-team1-player' + (j + 1) + '-coordy';
                    team1CoordsRow.querySelector(className).value = parent.config[0].game[i].teamOneCoords[('player' + j)][1];
                    parent.initStepBodyListener(parent, team1CoordsRow.querySelector(className), i);

                    className = '.step-list__step-team2-player' + (j + 1) + '-coordx';
                    team2CoordsRow.querySelector(className).value = parent.config[0].game[i].teamTwoCoords[('player' + j)][0];
                    parent.initStepBodyListener(parent, team2CoordsRow.querySelector(className), i);

                    className = '.step-list__step-team2-player' + (j + 1) + '-coordy';
                    team2CoordsRow.querySelector(className).value = parent.config[0].game[i].teamTwoCoords[('player' + j)][1];
                    parent.initStepBodyListener(parent, team2CoordsRow.querySelector(className), i);
                }

                step.querySelector('.step-list__step-body').appendChild(team1CoordsRow);
                step.querySelector('.step-list__step-body').appendChild(team2CoordsRow);

                // parent.initStepBody(parent, step.querySelector('.step-list__step-body'), i);

                // parent.initStepBody(step.querySelector('.step-list__step-body'), parent);

                container.appendChild(step);

            }

            parent.stepList.appendChild(container);  //reflow
        };

        this.delEditGameSteps = function (parent) {
            parent.stepList.innerHTML = '';
        };

        this.initEditGameListeners = function (parent, isRemoveListeners) {
            if (isRemoveListeners) {
                parent.removeListener(parent.listeners.showButClick, parent.showBut, 'click');
                parent.disableBut(parent.showBut);

                return;
            }

            parent.enableBut(parent.showBut);

            // if (!parent.listeners.showButClick) {
            parent.showBut.addEventListener('click', parent.listeners.showButClick = function (evt) {
                parent.initialize(parent.config, parent, parent.SHOW_GAME_MODE);
            });
            // }
        };

        this.cloneConfig = function (obj) {
            var clone = {};
            for (var i in obj) {
                if (typeof (obj[i]) == "object" && obj[i] != null) {
                    clone[i] = this.cloneConfig(obj[i]);
                }
                else {
                    clone[i] = obj[i];
                }
            }
            return clone;

            // return config.slice(0);
        };

        this.initLoadTestConfig = function (parent) {
            var link = document.querySelector('.ulti-field__test-config');

            if (parent.listeners.loadTestConfigListener) return;

            link.addEventListener('click', parent.listeners.loadTestConfigListener = function () {
                parent.loadConfig(parent.initialize, parent);
            });
        };

        /**
         *
         * @param {gameObject} configData
         * @param {Ulti} parent
         */
        this.initialize = function (configData, parent, gameMode) {

            parent.config = configData.slice(0);
            parent.gameMode = gameMode;
            parent.currStep = 0;
            parent.showCurrentDescription('', true);
            parent.initLoadTestConfig(parent);

            switch (parent.gameMode) {
                case parent.SHOW_GAME_MODE:
                    parent.initEditGameFieldListeners(parent, true);
                    parent.initEditGameListeners(parent, true);
                    parent.delEditGameSteps(parent);

                    parent.initShowGameListeners(parent);
                    parent.writeToFile(parent.config);
                    parent.showStep(parent.config[0].game[parent.currStep], true);

                    // debugger;

                    break;
                case parent.EDIT_GAME_MODE :
                    parent.initShowGameListeners(parent, true);

                    parent.initEditGameListeners(parent);
                    parent.showEditGameSteps(parent);
                    parent.showStep(parent.config[0].game[parent.currStep]);

                    parent.originalConfig = parent.cloneConfig(parent.config);
                    console.log(parent.originalConfig);

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

                    callback(loadedData, parent, parent.SHOW_GAME_MODE);
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

            xhr.open('GET', parent.CONFIG_URL);
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
