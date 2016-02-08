'use strict';

angular.module('dynoforceApp')
.constant('gameState', Object.freeze({
	ERROR: -1,
	IDLE: 0,
	HOSTING: 1,
	FINDING: 2,
	JOINING: 3
}))
.run(function($rootScope, gameState) {
	$rootScope.gameState = gameState;
})
.controller('GameController', ['$scope', 'gameState', 'nameGen',
	function($scope, gameState, nameGen) {

		$scope.safeApply = function() {
			if ($scope.$root.$$phase !== '$apply' && $scope.$root.$$phase !== '$digest') {
				$scope.$apply();
			}
		};

		$scope.gameData = {
			state: gameState.IDLE,
			hostAddr: undefined,
			hostPort: undefined,
			hostName: nameGen.getHostName(),
			kaijuName: nameGen.getKaijuName(),
			pilotName: nameGen.getPilotName(),
			foundHosts: {},
			foundPlayers: {},
			webSocket: undefined,
			pilotCount: -1
		};

		$scope.addPlayer = function(pilot) {
			$scope.gameData.foundPlayers[pilot.addr] = pilot;
			$scope.gameData.pilotCount = Object.keys($scope.gameData.foundPlayers).length;
			console.log($scope.gameData.foundPlayers);
			$scope.safeApply();
		};

		$scope.removePlayer = function(addr) {
			delete $scope.gameData.foundPlayers[addr];
			$scope.gameData.pilotCount = Object.keys($scope.gameData.foundPlayers).length;
			$scope.safeApply();
		};

		$scope.setGameState = function(state) {
			$scope.gameData.state = state;
			$scope.safeApply();
		};
	}
	]);