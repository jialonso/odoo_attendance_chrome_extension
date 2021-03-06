var Odoo = function (config) {
  config = config || {};

  this.server_url = config.server_url;
  this.dbname = config.dbname;
  this.user = config.user;
  this.uid = config.uid;
  this.password = config.password;
  this.version = config.version;
};

Odoo.prototype.connect = function () {
  odoo = this;

  var uid$ = new Promise(function (resolve, reject) {
    $.xmlrpc({
      url: odoo.server_url + "/xmlrpc/common",
      methodName: "login",
      dataType: "jsonrpc",
      params: [
        $.xmlrpc.force("string", odoo.dbname),
        $.xmlrpc.force("string", odoo.user),
        $.xmlrpc.force("string", odoo.password)
      ],
      success: function (response, status, jqXHR) {
        odoo.uid = jqXHR.responseJSON[0];
        resolve(odoo.uid);
      },
      error: function (jqXHR, status, error) {
        reject(error);
      }
    });
  });

  var version$ = new Promise(function (resolve, reject) {
    $.xmlrpc({
      url: odoo.server_url + "/xmlrpc/common",
      methodName: "version",
      dataType: "jsonrpc",
      params: [],
      success: function (response, status, jqXHR) {
        odoo.version = jqXHR.responseJSON[0].server_version_info[0];
        resolve(odoo.version);
      },
      error: function (jqXHR, status, error) {
        reject(error);
      }
    });
  });

  return Promise.all([uid$, version$]);
};

Odoo.prototype.status = function () {
  if (typeof this.server_url !== 'string' || this.server_url.length === 0) {
    return 'not_configured';
  }
  if (typeof this.dbname !== 'string' || this.dbname.length === 0) {
    return 'not_configured';
  }
  if (typeof this.user !== 'string' || this.user.length === 0) {
    return 'not_configured';
  }
  if (typeof this.password !== 'string' || this.password.length === 0) {
    return 'not_configured';
  }
  if (typeof this.uid === 'number' && this.uid > 0 && typeof this.version === 'number') {
    return 'connected';
  } else {
    return 'configured';
  }
};

Odoo.prototype.search_read = function (model, domain, fields = [], limit = 100) {
  odoo = this;
  return new Promise(function (resolve, reject) {
    $.xmlrpc({
      url: odoo.server_url + "/xmlrpc/object",
      methodName: "execute_kw",
      dataType: "jsonrpc",
      params: [
        $.xmlrpc.force("string", odoo.dbname),
        $.xmlrpc.force("int", odoo.uid),
        $.xmlrpc.force("string", odoo.password),
        $.xmlrpc.force("string", model),
        $.xmlrpc.force("string", "search_read"), [domain], {
          "fields": fields,
          "limit": limit
        }
      ],
      success: function (response, status, jqXHR) {
        response = jqXHR.responseJSON[0];
        resolve(response);
      },
      error: function (jqXHR, status, error) {
        reject(error);
      }
    });
  });
};

Odoo.prototype.create = function (model, data) {
  odoo = this;
  return new Promise(function (resolve, reject) {
    $.xmlrpc({
      url: odoo.server_url + "/xmlrpc/object",
      methodName: "execute_kw",
      dataType: "jsonrpc",
      params: [
        $.xmlrpc.force("string", odoo.dbname),
        $.xmlrpc.force("int", odoo.uid),
        $.xmlrpc.force("string", odoo.password),
        $.xmlrpc.force("string", model),
        $.xmlrpc.force("string", "create"),
        data
      ],
      success: function (response, status, jqXHR) {
        response = jqXHR.responseJSON[0];
        resolve(response);
      },
      error: function (jqXHR, status, error) {
        reject(error);
      }
    });
  });
};

Odoo.prototype.today = function () {
  var ts = new Date().setHours(0, 0, 0, 0);
  return this.dt_to_string(new Date(ts));
};

Odoo.prototype.now = function () {
  return this.dt_to_string(new Date());
};

Odoo.prototype.dt_to_string = function (dt) {
  var Y = dt.getUTCFullYear().toString();
  var m = ("0" + (dt.getUTCMonth() + 1)).slice(-2);
  var d = ("0" + dt.getUTCDate()).slice(-2);

  var H = ("0" + dt.getUTCHours()).slice(-2);
  var M = ("0" + dt.getUTCMinutes()).slice(-2);
  var S = ("0" + dt.getUTCSeconds()).slice(-2);
  return Y + "-" + m + "-" + d + " " + H + ":" + M + ":" + S;
};
