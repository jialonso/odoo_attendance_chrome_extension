function setStatus(status, worked_time = null) {
    if (status == "sign_in") {
        browser.browserAction.setBadgeText({
            text: worked_time.slice(-4)
        });
        browser.browserAction.setBadgeBackgroundColor({
            color: [0, 255, 0, 255]
        });
    } else if (status == "sign_out") {
        browser.browserAction.setBadgeText({
            text: worked_time.slice(-4)
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

(function start_daemon() {
    var daemon = this;

    daemon.get_worked_time = function(records) {
        records = records.reverse();
        records.push({
            action: "sign_out",
            name: daemon.odoo.now()
        });
        var total = 0;
        for (var i = 1; i < records.length; i++) {
            if (records[i]['action'] === "sign_out" && records[i - 1]['action'] === "sign_in") {
                var current = new Date(records[i]['name']) - new Date(records[i - 1]['name']);
                total += Math.max(0, current); // Avoid problems with non-sincronized clocks
            }
        }
        var dt = new Date(total);
        var dt_str = ("0" + dt.getUTCHours()).slice(-2) + ":" + ("0" + dt.getUTCMinutes()).slice(-2);
        return dt_str;
    }

    daemon.start = function() {
        browser.storage.local.get(['server_url', 'dbname', 'user', 'password', 'uid', 'employee_id']).then(items => {
            daemon.odoo = new Odoo({
                "server_url": items.server_url,
                "dbname": items.dbname,
                "user": items.user,
                "password": items.password,
                "uid": items.uid
            });
            daemon.uid = items.uid;
            daemon.employee_id = items.employee_id;
            daemon.worked_time = "";
            if (daemon.odoo.status() === 'configured' || daemon.odoo.status() === 'connected') {
                daemon.status = "undefined";
                setStatus('undefined');
                daemon.run();
                daemon.intervalID = window.setInterval(daemon.run, 30000);
            } else {
                daemon.status = "not_configured";
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
        const status = daemon.odoo.status();
        // step: 0 -> set uid | 1 -> set employee_id | 2 -> check attendance
        if (status === 'configured') {
            daemon.odoo.connect()
                .then((uid) => {
                    browser.storage.local.set({
                        uid: uid,
                    });
                })
                .catch((error) => {
                    console.log(error);
                });
        } else if (status === 'connected') {
            if (daemon.employee_id === undefined) {
                daemon.odoo.search_read(
                        model = 'hr.employee',
                        domain = [
                            [
                                ['user_id', '=', daemon.uid]
                            ]
                        ],
                        fields = ['id'],
                        limit = 1
                    ).then((data) => {
                        var employee_id = data[0].id;
                        browser.storage.local.set({
                            employee_id: employee_id,
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } else {
                daemon.odoo.search_read(
                        model = 'hr.attendance',
                        domain = [
                            [
                                ['employee_id', '=', daemon.employee_id],
                                ['name', '>', daemon.odoo.today()]
                            ]
                        ],
                        fields = ['action', 'name'],
                        limit = 100
                    ).then((data) => {
                        var action;
                        if (data.length > 0) {
                            daemon.status = data[0]["action"];
                            daemon.worked_time = daemon.get_worked_time(data);
                        } else {
                            daemon.status = 'sign_out';
                            daemon.worked_time = "0:00";
                        }
                        setStatus(daemon.status, daemon.worked_time);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        }
    };

    daemon.start();
    browser.storage.onChanged.addListener((changes, namespace) => {
        daemon.restart();
    });

    browser.runtime.onMessage.addListener(msg => {
        if (msg === "getStatus") {
            return new Promise((resolve, reject) => {
                resolve({
                    'status': daemon.status,
                    'worked_time': daemon.worked_time
                });
            });
        } else if (msg === "sign_in" || msg === "sign_out") {
            daemon.odoo.create(
                model = 'hr.attendance',
                data = [{
                    'employee_id': daemon.employee_id,
                    'action': msg
                }]
            ).then((response) => {
                daemon.restart();
            }).catch((error) => {
                console.log(error);
            });

        }
    });

})();
