(function () {
  var fs       = require('fs');
  var express  = require('express');
  var debug    = require('debug')('praha:router');
  var basename = require('path').basename;

  function funcToUri(funcName) {
    var uri = [];
    var r;
    while ((r = /^([A-Z]?[a-z]+)/.exec(funcName)) !== null) {
      uri.push(r[0].toLowerCase());
      funcName = funcName.substr(r[0].length)
    }
    return uri;
  }

  function registerRoute(app, method, route, fn) {
    app[method](route, fn.beforeAction || [], fn);
    debug('registered route %s %s', method.toUpperCase(), route);
  }

  function router(path, opts) {
    var app =  express();
    if ('undefined' === typeof path)
      path = process.cwd() + '/routes';
    debug('reading routes in %s', path);
    fs.readdirSync(path).forEach(function (file) {
      if (!/\.js$/.test(file))
        return;
      var name = basename(file, '.js');
      var controller = require(path + '/' + name);
      if (!controller._praha)
        return;
      debug('registering routes for %s', name);
      name = name.toLowerCase();
      if (controller._alias)
        name = controller._alias;
      var root = '/' + name;
      var root_id = root + '/:id';
      for (var route in controller) {
        if (route[0] === '_')
          continue;
        switch (route) {
        case 'index':
          registerRoute(app, 'get', root, controller.index);
          break;
        case 'show':
          registerRoute(app, 'get', root_id, controller.show);
          break;
        case 'create':
          registerRoute(app, 'post', root, controller.create);
          break;
        case 'update':
          registerRoute(app, 'put', root_id, controller.update);
          break;
        case 'remove':
          registerRoute(app, 'delete', root_id, controller.remove);
          break;
        default:
          var method = 'get';
          var uri = funcToUri(route);
          if (/get|post|put|delete/i.test(uri[0]))
            method = uri.shift().toLowerCase();
          if (controller[route].parameters) {
            uri = uri.map(function (p) {
              if (~controller[route].parameters.indexOf(p))
                p = ':' + p;
              return p;
            });
          }
          if (controller._alias === false)
            uri = '/' + uri.join('/');
          else
            uri = root + '/' + uri.join('/');
          registerRoute(app, method, uri, controller[route]);
        }
      }
    });
  return app;
  }

  module.exports = router;

})();
