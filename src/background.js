function setStatus(status, worked_time) {
  var badgeText;
  var badgeColor;
  if (status === 'sign_in' || status === 'sign_out') {
    if (parseInt(worked_time.split(':')[0]) < 10) {
      badgeText = worked_time.slice(-4);
    } else {
      badgeText = worked_time.split(':')[0] + 'h';
    }
    badgeColor = (status === 'sign_in') ? '#00994C' : '#FF0000';
  } else if (status == 'undefined' || status == 'not_configured') {
    badgeText = (status === 'undefined') ? '  ' : '';
    badgeColor = '#D5DBDB';
  }

  browser.browserAction.setBadgeText({
    text: badgeText
  });
  browser.browserAction.setBadgeBackgroundColor({
    color: badgeColor
  });
}

(function start_daemon() {
  var daemon = this;

  daemon.get_worked_time = function (records) {
    var total = 0;
    for (var i = 0; i < records.length; i++) {
      if (records[i].worked_hours) {
        total += records[i].worked_hours * 60 * 60 * 1000;
      } else {
        var current = new Date(daemon.odoo.now()) - new Date(records[i]['check_in']);
        total += Math.max(0, current); // Avoid problems with non-sincronized clocks
      }
    }
    var dt = new Date(total);
    var dt_str = ('0' + dt.getUTCHours()).slice(-2) + ':' + ('0' + dt.getUTCMinutes()).slice(-2);
    return dt_str;
  };

  daemon.start = function() {
    const variables = ['server_url', 'dbname', 'user', 'password', 'uid', 'employee_id', 'interval'];
    browser.storage.local.get(variables)
      .then(function(items) {
        daemon.odoo = new Odoo({
          server_url: items.server_url,
          dbname: items.dbname,
          user: items.user,
          password: items.password,
          uid: items.uid
        });
        daemon.uid = items.uid;
        daemon.employee_id = items.employee_id;
        daemon.worked_time = '';
        daemon.reasons_in = null;
        daemon.reasons_out = null;
        if (daemon.odoo.status() === 'configured' || daemon.odoo.status() === 'connected') {
          daemon.status = 'undefined';
          setStatus('undefined', null);
          daemon.run();
          if (items.interval > 0) {
            daemon.intervalID = window.setInterval(daemon.run, items.interval * 1000);
          }
        } else {
          daemon.status = 'not_configured';
          setStatus('not_configured', null);
        }
      });
  };

  daemon.restart = function () {
    if (daemon.intervalID !== undefined) {
      clearInterval(daemon.intervalID);
      daemon.intervalID = undefined;
    }
    daemon.start();
  };

  daemon.run = function () {
    const status = daemon.odoo.status();
    // step: 0 -> set uid | 1 -> set employee_id | 2 -> check attendance
    if (status === 'configured') {
      daemon.odoo.connect()
        .then(function(uid) {
          browser.storage.local.set({uid: uid});
        })
        .catch(function(error) {
          console.log(error);
        });
    } else if (status === 'connected') {
      if (!daemon.employee_id > 0) {
        var domain = [
          ['user_id', '=', daemon.uid]
        ];
        daemon.odoo.search_read('hr.employee', domain, ['id'], 1)
          .then(function(data) {
            var employee_id = data[0].id;
            browser.storage.local.set({employee_id: employee_id});
          })
          .catch(function(error) {
            console.log(error);
          });
      } else {
        const domain = [
          ['employee_id', '=', daemon.employee_id],
          '|',
          ['check_in', '>', daemon.odoo.today()],
          ['check_out', '=', false]
        ];
        const variables = ['employee_id', 'check_in', 'check_out', 'worked_hours'];
        daemon.odoo.search_read('hr.attendance', domain, variables)
          .then(function(data) {
            if (data.length) {
              daemon.status = data[0].check_out ? 'sign_out' : 'sign_in';
              daemon.worked_time = daemon.get_worked_time(data);
            } else {
              daemon.status = 'sign_out';
              daemon.worked_time = '0:00';
            }
            setStatus(daemon.status, daemon.worked_time);
          })
          .catch(function(error) {
            console.log(error);
          });
      }
    }
  };

  daemon.start();
  browser.storage.onChanged.addListener(function(changes, namespace) {
    daemon.restart();
  });
})();
