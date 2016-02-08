'use strict';

angular.module('dynoforceApp')
.factory('Pilot', function() {

	function Pilot(pilotAddress, pilotName) {
		this.addr = pilotAddress;
		this.name = pilotName;
	}

	return Pilot;
});
