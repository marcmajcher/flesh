'use strict';
// var cordova = { plugins: {} };

angular.module('dynoforceApp')
	.controller('MainController', ['$scope', 'webSocketServer', 'zeroConf', 'gameState', 'nameGen', 'Pilot',
		function($scope, webSocketServer, zeroConf, gameState, nameGen, Pilot) {

			var gd = $scope.gameData;

			/* Game hosting methods */

			$scope.hostGame = function() {
				gd.foundPlayers = {};

				var serverCallbacks = {
					onStart: function(addr, port) {
						gd.hostAddr = addr;
						gd.hostPort = port;
						$scope.addPlayer(new Pilot(addr, gd.pilotName));
						console.log('Game server *' + gd.hostName + '* started.');
					},
					onStop: function(addr, port) {
						console.log('Stopped listening on %s:%d', addr, port);
						gd.state = gameState.IDLE;
					},
					onOpen: function(conn) {
						console.log('A user connected from %s', conn.remoteAddr);
					},
					onMessage: function(conn, msg) {
						var json = JSON.parse(msg);
						if (json.message === 'connect') {
							$scope.addPlayer(new Pilot(conn.remoteAddr, json.args.pilot));
							$scope.$apply();
						}
					},
					onClose: function(conn) {
						console.log('A user disconnected from %s', conn.remoteAddr);
						$scope.removePlayer(conn.remoteAddr);
						$scope.$apply();
					}
				};

				webSocketServer.start(serverCallbacks);

				zeroConf.registerHost(gd.hostName,
					function(service) {
						/* watcher */
						console.log('ZC Hosting game: ' + service.txtRecord.mech);
						console.log(service);
						if (service.txtRecord.mech === gd.hostName) {
							$scope.setGameState(gameState.HOSTING);
						}
					},
					function() {});
			};

			$scope.stopHost = function() {
				webSocketServer.stop();
				zeroConf.stop();
				$scope.setGameState(gameState.IDLE);
				gd.foundPlayers = {};
			};

			/* Game joining methods */

			$scope.findGames = function() {
				$scope.setGameState(gameState.FINDING);
				gd.foundHosts = {};

				zeroConf.registerPlayer(gd.playerName,
					function(service) {
						/* watcher */
						var hostAddr = service.addresses[0];
						console.log('Player ' + gd.playerName + ' adding ' + hostAddr + ' : ' + service.txtRecord.mech);

						gd.foundHosts[service.name] = {
							addr: hostAddr,
							name: service.txtRecord.mech,
							id: service.name
						};
						$scope.$apply();
					},
					function(service) {
						/* stopper */
						console.log('zeroConf stopper');
						console.log(service);
						delete gd.foundHosts[service.name];
						$scope.$apply();
					}
				);
			};

			$scope.joinHost = function(addr) {
				webSocketServer.joinHost(addr, gd.pilotName, function(ws) {
					gd.webSocket = ws;
					$scope.setGameState(gameState.JOINING);
				});
			};

			// websocket.onclose = function(evt) { /* do stuff */ }; //on close event
			// websocket.onmessage = function(evt) { /* do stuff */ }; //on message event
			// websocket.onerror = function(evt) { /* do stuff */ }; //on error event

			$scope.unjoinHost = function() {
				if (gd.webSocket !== undefined) {
					gd.webSocket.close();
				}
				gd.webSocket = undefined;
				$scope.setGameState(gameState.FINDING);
			};

			$scope.cancelFind = function() {
				$scope.unjoinHost();
				zeroConf.stop();
				$scope.setGameState(gameState.IDLE);
				gd.foundHosts = {};
			};

			$scope.refreshKaiju = function() {
				gd.kaijuName = nameGen.getKaijuName();
			};
		}
	]);