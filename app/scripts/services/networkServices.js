'use strict';
/* global cordova */
/* global device */

angular.module('dynoforceApp')
  .constant('socketPort', 1337)
  .factory('webSocketServer', ['socketPort', function(socketPort) {

    return {
      wsserver: cordova.plugins.wsserver,

      /* host-facing methods */

      /* Start a websocket server to host a game on the default port */
      start: function(events) {
        events.protocols = ['json'];
        this.wsserver.start(socketPort, events);
      },

      stop: function() {
        this.wsserver.stop();
      },

      sendToPlayer: function(uuid, message) {
        this.wsserver.send({
          'uuid': uuid
        }, message);
      },

      removePlayer: function(uuid) {
        this.wsserver.close({
          'uuid': uuid
        });
      },

      /* player-facing methods */

      joinHost: function(addr, pilot, callback) {
        var ws = new WebSocket('ws://' + addr + ':' + socketPort, ['json']);
        ws.onopen = function() {
          var message = JSON.stringify({
            'message': 'connect',
            'args': {
              'pilot': pilot
            }
          });
          ws.send(message);
          callback(ws);
        };
      }
    };
  }])
  .factory('zeroConf', [function() {

    return {
      zc: cordova.plugins.zeroconf,
      stopper: undefined,

      /* Register a game server host on the local network. */
      registerHost: function(mechName, watcher, stopper) {
        this.stopper = stopper;
        this._register({
          id: 'DynoForce',
          role: 'host',
          mech: mechName
        }, watcher);
      },

      /* Register as a potential player on the local network. */
      registerPlayer: function(pilotName, watcher, stopper) {
        this.stopper = stopper;
        this._register({
          id: 'DynoForce',
          role: 'player',
          pilot: pilotName
        }, watcher);
      },

      _register: function(data, watcher) {
        this.zc.register('_http._tcp.local.', 'DynoForce-' + device.model + '-' + device.uuid, 80, data);
        var self = this;

        this.zc.watch('_http._tcp.local', function(result) {
          var action = result.action;
          var text = result.service.txtRecord;

          if (action === 'added' && text.id === 'DynoForce' && text.role === 'host') {
            watcher(result.service);
          }
          else if (action === 'removed') {
            self.stopper(result.service);
          }
        });
      },

      stop: function() {
        this.zc.unwatch('_http._tcp.local.');
        this.zc.stop();
        this.zc = cordova.plugins.zeroconf;
      }
    };
  }]);