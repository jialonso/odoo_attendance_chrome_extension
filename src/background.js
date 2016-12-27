function odoo_today() {
  var ts = new Date().setHours(0, 0, 0, 0);
  return odoo_dt(new Date(ts));
}

function odoo_now() {
  return odoo_dt(new Date());
}

function odoo_dt(dt) {
  var Y = dt.getUTCFullYear().toString();
  var m = ("0" + (dt.getUTCMonth() + 1)).slice(-2);
  var d = ("0" + dt.getUTCDate()).slice(-2);

  var H = ("0" + dt.getUTCHours()).slice(-2);
  var M = ("0" + dt.getUTCMinutes()).slice(-2);
  var S = ("0" + dt.getUTCSeconds()).slice(-2);
  return Y + "-" + m + "-" + d + " " + H + ":" + M + ":" + S;
}

function setStatus(status, worked_time = null) {
  if (status == "sign_in") {
    browser.browserAction.setBadgeText({
      text: worked_time
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: [0, 255, 0, 255]
    });
  } else if (status == "sign_out") {
    browser.browserAction.setBadgeText({
      text: worked_time
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: [255, 0, 0, 255]
    });
  } else if (status == "undefined") {
    browser.browserAction.setBadgeText({
      text: "  "
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: [213, 219, 219, 255]
    });
  } else if (status == "not_configured") {
    browser.browserAction.setBadgeText({
      text: ""
    });
  }
}

function get_worked_time(records) {
  records = records.reverse();
  records.push({
    action: "sign_out",
    name: odoo_now()
  });
  var total = 0;
  for (var i = 1; i < records.length; i++) {
    if (records[i]['action'] === "sign_out" && records[i - 1]['action'] === "sign_in") {
      var current = new Date(records[i]['name']) - new Date(records[i - 1]['name']);
      total += current;
    }
  }
  var dt = new Date(total);
  var dt_str = dt.getUTCHours() + ":" + ("0" + dt.getUTCMinutes()).slice(-2);
  return dt_str;
}

(function start_daemon() {
  var daemon = this;

  daemon.is_configured = function() {
    if (typeof daemon.server_url !== 'string' || daemon.server_url.length === 0) {
      return false;
    }
    if (typeof daemon.dbname !== 'string' || daemon.dbname.length === 0) {
      return false;
    }
    if (typeof daemon.user !== 'string' || daemon.user.length === 0) {
      return false;
    }
    if (typeof daemon.password !== 'string' || daemon.password.length === 0) {
      return false;
    }
    return true;
  };

  daemon.start = function() {
    browser.storage.local.get(['server_url', 'dbname', 'user', 'password', 'uid', 'employee_id']).then(items => {
        daemon.server_url = items.server_url;
        daemon.dbname = items.dbname;
        daemon.user = items.user;
        daemon.password = items.password;
        daemon.uid = items.uid;
        daemon.employee_id = items.employee_id;
        if (daemon.is_configured()) {
          setStatus('undefined');

          // start timer
          daemon.run();
          daemon.intervalID = window.setInterval(daemon.run, 30000);
        } else {
          setStatus('not_configured');
        }
      });
  };

  daemon.restart = function() {
    if (daemon.intervalID !== undefined) {
      clearInterval(daemon.intervalID);
      daemon.intervalID = undefined;
    }
    daemon.start();
  };

  daemon.run = function() {
    // step: 0 -> set uid | 1 -> set employee_id | 2 -> check attendance
    if (daemon.uid === undefined) {
      var step = 0;
      var url = daemon.server_url + '/xmlrpc/common';
      var methodName = 'login';
      var params = [
        $.xmlrpc.force('string', daemon.dbname),
        $.xmlrpc.force('string', daemon.user),
        $.xmlrpc.force('string', daemon.password)
      ]
    } else if (daemon.employee_id === undefined) {
      var step = 1;
      var url = daemon.server_url + '/xmlrpc/object';
      var methodName = 'execute_kw';
      var params = [
        $.xmlrpc.force('string', daemon.dbname),
        $.xmlrpc.force('int', daemon.uid),
        $.xmlrpc.force('string', daemon.password),
        $.xmlrpc.force('string', 'hr.employee'),
        $.xmlrpc.force('string', 'search_read'), [
          [
            ['user_id', '=', daemon.uid]
          ]
        ], {
          'fields': ['id'],
          'limit': 1
        }
      ]
    } else {
      var step = 2;
      var url = daemon.server_url + '/xmlrpc/object';
      var methodName = 'execute_kw';
      var params = [
        $.xmlrpc.force('string', daemon.dbname),
        $.xmlrpc.force('int', daemon.uid),
        $.xmlrpc.force('string', daemon.password),
        $.xmlrpc.force('string', 'hr.attendance'),
        $.xmlrpc.force('string', 'search_read'), [
          [
            ['employee_id', '=', daemon.employee_id],
            ['name', '>', odoo_today()]
          ]
        ], {
          'fields': ['action', 'name'],
          'limit': 100
        }
      ]
    }
    $.xmlrpc({
      url: url,
      methodName: methodName,
      dataType: 'jsonrpc',
      params: params,
      success: function(response, status, jqXHR) {
        if (step == 0) {
          var uid = jqXHR.responseJSON[0];
          browser.storage.local.set({
              uid: uid,
          });
          // console.log(daemon.uid);
        } else if (step == 1) {
          var employee_id = jqXHR.responseJSON[0][0]["id"];
          browser.storage.local.set({
              employee_id: employee_id,
          });
          // console.log(daemon.employee_id);
        } else { // step = 2
          var action;
          if(jqXHR.responseJSON[0].length > 0) {
            action = jqXHR.responseJSON[0][0]["action"];
            daemon.worked_time = get_worked_time(jqXHR.responseJSON[0]);
          }
          else {
            action = 'sign_out';
            daemon.worked_time = "0:00";
          }
          setStatus(action, daemon.worked_time);
        }
      },
      error: function(jqXHR, status, error) {
        // console.log(error);
        setStatus("undefined");
      }
    });
  };

  daemon.start();
  browser.storage.onChanged.addListener((changes, namespace) => {
    daemon.restart();
  });

  browser.runtime.onMessage.addListener(msg => {
    if (msg === "getWorkedTime") {
      return new Promise((resolve, reject) => {
        resolve(daemon.worked_time);
      });
    }
  });

})();
