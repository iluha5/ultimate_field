(function () {
    'use strict';

    function Ulti() {
        this.config = {};
        this.originalConfig = {};

        this.CONFIG_URL = 'server/ulti.json';

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
        this.discInConfig = undefined;

        this.statusLineElement = document.querySelector('.ulti-field__status-line');
        this.descrElement = document.querySelector('.ulti-field__descript-body');
        this.discElement = document.querySelector('.ulti-field__disc');
        this.fieldWidth = parseInt(getComputedStyle(document.querySelector('.ulti-field__container')).width);

        this.teamOneElements = document.querySelectorAll('.ulti-field__team1');
        this.teamTwoElements = document.querySelectorAll('.ulti-field__team2');

        this.playBut = document.querySelector('.ulti-field__controls-play');
        this.prevBut = document.querySelector('.ulti-field__controls-prev');
        this.clearBut = document.querySelector('.ulti-field__controls-clear');
        this.fileBut = document.querySelector('.ulti-field__controls-file');
        this.saveLinkBut = document.querySelector('.ulti-field__controls-save-link');
        this.editBut = document.querySelector('.ulti-field__controls-edit');
        this.showBut = document.querySelector('.ulti-field__controls-show');

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

        this.listeners = {};

        /**
         *
         * @param {Mixed} n
         * @return {boolean}
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
         * show disc on the field by coords
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

        /**
         * Fetch wrong coords wich are out of the field to coords into the field
         * @param coords
         * @return {[*,*]}
         */
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

        /**
         * Check if disc coord are correct (own by some of players)
         * @param stepObj
         * @return {boolean}
         */
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

        /**
         * Fetch description of the step. Del tags.
         * @param string
         * @return {*}
         */
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
         * @param {Object} stepObj - Step obj from config file
         * @param {Boolean} isDefault - If needed to show default step
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

        /**
         * Show previous step of the game
         */
        this.showPrevStep = function () {
            if (this.currStep === 1) return;
            if (this.currStep > 1) {
                this.currStep -= 2;
                this.stepsDescr.pop();
                this.stepsDescr.pop();

                this.showStep(this.config[0].game[this.currStep]);
            }
        };

        /**
         *
         * @param {EventListener} listener
         * @param {HTMLElement} elem
         * @param {String} type - Type of Event
         */
        this.removeListener = function (listener, elem, type) {
            if (listener) {
                elem.removeEventListener(type, listener);
            }
        };

        /**
         *
         * @param {HTMLElement} but
         */
        this.disableBut = function (but) {
            if ((but.disabled !== 'undefined') && (!but.disabled)) {
                but.disabled = true;
            }
        };


        /**
         *
         * @param {HTMLElement} but
         */
        this.enableBut = function (but) {
            if ((but.disabled !== 'undefined') && (but.disabled)) {
                but.disabled = false;
            }
        };

        /**
         *
         * @param {Ulti} parent
         * @param {Boolean} isRemoveListeners - If needed to remove listeners
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
            }

            parent.enableBut(parent.prevBut);
            parent.enableBut(parent.playBut);
            parent.enableBut(parent.clearBut);
            parent.enableBut(parent.fileBut);
            parent.enableBut(parent.editBut);

            if (parent.listeners.playButClick) {
                parent.removeListener(parent.listeners.playButClick, parent.playBut, 'click');
            }

            /**
             * @param {Event} evt
             */
            parent.playBut.addEventListener('click', parent.listeners.playButClick = function playButListener(evt) {
                if (!parent._isLastStep(parent.config)) {
                    parent.showStep(parent.config[0].game[parent.currStep]);
                }
            });

            if (parent.listeners.prevButClick) {
                parent.removeListener(parent.listeners.prevButClick, parent.prevBut, 'click');
            }

            /**
             * @param {Event} evt
             */
            parent.prevBut.addEventListener('click', parent.listeners.prevButClick = function (evt) {
                parent.showPrevStep();
            });

            if (parent.listeners.clearButClick) {
                parent.removeListener(parent.listeners.clearButClick, parent.clearBut, 'click');
            }

            /**
             * @param {Event} evt
             */
            parent.clearBut.addEventListener('click', parent.listeners.clearButClick = function clearButListener(evt) {
                parent.currStep = 0;
                parent.showCurrentDescription('', true);
                parent.showStep(parent.DEFAULT_COORDS_5PLAYERS, true);

                parent.writeToFile(parent.config);
            });

            if (parent.listeners.editButClick) {
                parent.removeListener(parent.listeners.editButClick, parent.editBut, 'click');
            }

            /**
             * @param {Event} evt
             */
            parent.editBut.addEventListener('click', parent.listeners.editButClick = function (evt) {
                parent.initialize(parent.config, parent, parent.EDIT_GAME_MODE);
            });

            if (parent.listeners.fileButChange) {
                parent.removeListener(parent.listeners.fileButChange, parent.fileBut, 'click');
            }

            /**
             * @param {Event} evt
             */
            parent.fileBut.addEventListener('change', parent.listeners.fileButChange = function fileButListener(evt) {
                var file = parent.fileBut.files;

                if (file[0].type !== 'application/json') {
                    parent.showError('Please check config file');
                    return;
                } else {
                    parent.showError('', true);
                }

                var reader = new FileReader();

                /**
                 * @param {Event} evt
                 */
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
                };

                /**
                 * @param {Event} evt
                 */
                reader.onerror = function (evt) {
                    parent.showError('Loaded file error!');
                };

                reader.readAsText(file[0]);
            }, false);

        };

        /**
         * Save step in Edit Mode with user data
         * @param {Ulti} parent
         * @param {Number} stepNum - step to save
         */
        this.saveEditGameStep = function (parent, stepNum) {
            var step = document.querySelector('.step-list__step' + stepNum);
            var className;

            parent.config[0].game[stepNum].description = step.querySelector('.step-list__step-comment').value;

            for (var j = 0; j < parent.PLAYERS_PER_TEAM; j++) {
                className = '.step-list__step-team1-player' + (j + 1) + '-coordx';
                parent.config[0].game[stepNum].teamOneCoords[('player' + j)][0] = step.querySelector(className).value;
                className = '.step-list__step-team1-player' + (j + 1) + '-coordy';
                parent.config[0].game[stepNum].teamOneCoords[('player' + j)][1] = step.querySelector(className).value;

                className = '.step-list__step-team2-player' + (j + 1) + '-coordx';
                parent.config[0].game[stepNum].teamTwoCoords[('player' + j)][0] = step.querySelector(className).value;
                className = '.step-list__step-team2-player' + (j + 1) + '-coordy';
                parent.config[0].game[stepNum].teamTwoCoords[('player' + j)][1] = step.querySelector(className).value;
            }

            parent.writeToFile(parent.config);
        };

        /**
         * Del step in Edit Mode
         * @param {Ulti} parent
         * @param {Number} stepNum - step to del
         */
        this.delEditGameStep = function (parent, stepNum) {
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

        /**
         * Add step in Edit Mode
         * @param {Ulti} parent
         * @param {Number} stepNum - Step to add
         */
        this.addEditGameStep = function (parent, stepNum) {
            var newStep;
            var defaultCoords = parent.cloneConfig(parent.DEFAULT_COORDS_5PLAYERS);

            parent.config[0].game.splice((stepNum + 1), 0, defaultCoords);
            parent.changeStepsNumeric(true, stepNum);
            parent.currStep = stepNum + 1;
            parent.showEditGameSteps(parent);

            newStep = document.querySelector('.step-list__step' + parent.currStep);
            newStep.classList.add('step-list__step-open');

            parent.initEditGameFieldListeners(parent);
            parent.showStep(parent.config[0].game[parent.currStep]);
        };

        /**
         * Recount steps numeric in DOM. Change class names.
         * @param {Boolean} isInsert - Insert - true, del - false
         * @param stepNum - step to insert or del
         */
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

        /**
         * Check if it is last step in list of steps in Edit Mode
         * @param {Ulti} parent
         * @return {boolean}
         */
        this.isLastEditGameStep = function (parent) {
            return (parent.config[0].game.length <= 1);
        };

        /**
         * Change players coords in config
         * @param {[*,*]} newCoords
         * @param {[*,*]} player - Team and number of player
         * @param {Ulti} parent
         */
        this.changePlayerCoords = function (newCoords, player, parent) {
            var team = player[0] ? 'teamTwoCoords' : 'teamOneCoords';
            var playerString = 'player' + player[1];
            parent.config[0].game[parent.currStep][team][playerString] = newCoords;
        };

        /**
         * Get offset coords from web page
         * @param {HTMLElement} elem
         * @return {{top: number, left: number}}
         */
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

        /**
         * Get real mouse coords and fetch it according field offset
         * @param {[Number,Number]} mouseCoords - real mouse coords
         * @param {Ulti} parent
         * @return {[Number,Number]}
         */
        this.fetchMouseCorrdsToField = function (mouseCoords, parent) {
            var ultiField = document.querySelector('.ulti-field__container');

            return [
                mouseCoords[0] - parent.getOffsetRect(ultiField).left,
                mouseCoords[1] - parent.getOffsetRect(ultiField).top
            ];
        };

        /**
         * Move player by coords. Fetch coords, change it in config, show step on the field, show coords in DOM inputs
         * @param {[Number,Number]} player - Team and number of player
         * @param {HTMLElement} playerElem
         * @param {[Number,Number]} mouseCoords - mouse coords
         * @param {Ulti} parent
         */
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

        /**
         * Move disc to player on the field
         * @param {[Number, Number]} playerNum - Team and number of the player
         * @param {Ulti} parent
         */
        this.moveDiscToPlayer = function (playerNum, parent) {
            parent.config[0].game[parent.currStep].discOwn = playerNum;
            parent.showStep(parent.config[0].game[parent.currStep]);
            parent.showCurrStepCoords(parent);
        };

        /**
         * Check if was click on the player Element
         * @param {EventTarget} target
         * @param {Ulti} parent
         * @return {*} - [Number, Number] coords of clicked player or false if wasn't click on any players
         */
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

        /**
         * Check if was click on the disc Element
         * @param {EventTarget} target
         * @return {boolean}
         */
        this.isClickOnDisc = function (target) {
            return target.classList.contains('ulti-field__disc');
        };

        /**
         * Clean Ulti.playerInConfig param and remove plaeyr-in-config class for Element if needed
         * @param {Ulti} parent
         */
        this.clearPlayerInConfig = function (parent) {
            var currPlayerInConfigElem = document.querySelector('.ulti-field__player-in-config');

            if (currPlayerInConfigElem) {
                currPlayerInConfigElem.classList.remove('ulti-field__player-in-config');
                parent.playerInConfig = undefined;
            }

        };

        /**
         * Initialize field listeners (bubbling)
         * @param {Ulti} parent
         * @param {Boolean} isClear - if needs to clear the listeners
         */
        this.initEditGameFieldListeners = function (parent, isClear) {
            var ultiField = document.querySelector('.ulti-field__container');

            if (isClear) {
                parent.clearPlayerInConfig(parent);

                if (!parent.listeners.ultiFieldOnClick) return;

                parent.removeListener(parent.listeners.ultiFieldOnClick, ultiField, 'click');
                return;
            }

            if (parent.listeners.ultiFieldOnClick) {
                parent.removeListener(parent.listeners.ultiFieldOnClick, ultiField, 'click');
            }

            /**
             * Init listeners for all players and the disc on the field (bubbling)
             * @param {Event} evt
             */
            ultiField.addEventListener('click', parent.listeners.ultiFieldOnClick = function (evt) {
                var playerCoords;
                var playerInConfigElem = document.querySelector('.ulti-field__player-in-config');
                var discInConfigElem = document.querySelector('.ulti-field__disc-in-config');
                var discElem = document.querySelector('.ulti-field__disc');

                if (discInConfigElem && parent.discInConfig && parent.isClickOnPlayer(evt.target, parent)) {
                    parent.moveDiscToPlayer(parent.isClickOnPlayer(evt.target, parent), parent);
                    parent.saveEditGameStep(parent, parent.currStep);
                    parent.discInConfig = undefined;
                    discInConfigElem.classList.remove('ulti-field__disc-in-config');
                    return;
                }

                if (parent.isClickOnDisc(evt.target) && !discInConfigElem && !parent.discInConfig) {
                    parent.discInConfig = true;
                    discElem.classList.add('ulti-field__disc-in-config');
                }

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

        /**
         * Init step header listeners in Edit Mode (Bubbling)
         * @param {Ulti} parent
         * @param {HTMLElement} stepHeader - Header of the step
         * @param {Number} stepNum - Current game step
         */
        this.initStepHeader = function (parent, stepHeader, stepNum) {
            stepHeader.addEventListener('click', function (evt) {
                var step;

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

        /**
         * Init step body listener for Input Element in the DOM. Check inputed coords. Show step.
         * @param {Ulti} parent
         * @param {HTMLElement} elem - Input Element with player's coord.
         */
        this.initStepBodyListener = function (parent, elem) {
            elem.addEventListener('change', function (evt) {
                var className = this.classList[1];
                var axis = className[className.length - 1];
                var playerNum = className.replace(/\D+/g, '') + '';
                var team = (playerNum[0] === '2') ? 'teamTwoCoords' : 'teamOneCoords';
                var player = 'player' + (+playerNum[1] - 1);

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
            });
        };

        /**
         * Show coord from config into Inputs Elemens on the web page
         * @param {Ulti} parent
         */
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

        /**
         * Show all steps on the web page in Edit Mode
         * @param {Ulti} parent
         */
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

                container.appendChild(step);
            }

            parent.stepList.appendChild(container);  //reflow
        };

        /**
         * Clear all steps in Edit Mode
         * @param {Ulti} parent
         */
        this.delEditGameSteps = function (parent) {
            parent.stepList.innerHTML = '';
        };

        /**
         * Init listeners in Edit Mode
         * @param {Ulti} parent
         * @param {Boolean} isRemoveListeners - true - if needed to remove Edit Game listeners
         */
        this.initEditGameListeners = function (parent, isRemoveListeners) {
            if (isRemoveListeners) {
                parent.removeListener(parent.listeners.showButClick, parent.showBut, 'click');
                parent.disableBut(parent.showBut);

                return;
            }

            parent.enableBut(parent.showBut);

            parent.showBut.addEventListener('click', parent.listeners.showButClick = function (evt) {
                parent.initialize(parent.config, parent, parent.SHOW_GAME_MODE);
            });
        };

        /**
         * Deep clone config obj
         * @param {Object} obj
         * @return {{}}
         */
        this.cloneConfig = function (obj) {
            var clone = {};
            for (var i in obj) {
                if (typeof (obj[i]) === "object" && obj[i] !== null) {
                    clone[i] = this.cloneConfig(obj[i]);
                }
                else {
                    clone[i] = obj[i];
                }
            }
            return clone;
        };

        /**
         * Init test config loading
         * @param {Ulti} parent
         */
        this.initLoadTestConfig = function (parent) {
            var link = document.querySelector('.ulti-field__test-config');

            if (parent.listeners.loadTestConfigListener) return;

            link.addEventListener('click', parent.listeners.loadTestConfigListener = function () {
                parent.loadConfig(parent.initialize, parent);
            });
        };

        /**
         * Init game. Prepare variables and field nodes
         * @param {Object} configData - Ulti config
         * @param {Ulti} parent
         * @param {Number} gameMode - ShowGame or EditGame
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
         * @param {requestCallback} callback - Handle the response
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

        /**
         * Write config to file to download by user
         * @param {String} text
         */
        this.writeToFile = function (text) {
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
            };

            reader.onerror = function () {
                parent.showError('Download error. Please, try again!');
            };

            reader.readAsDataURL(blob);
        };
    }


    var ulti = new Ulti();

    ulti.initialize(ulti.DEFAULT_CONFIG, ulti, ulti.SHOW_GAME_MODE);
})();
