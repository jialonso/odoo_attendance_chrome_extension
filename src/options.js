// Saves options to browser.storage.local.
function save_options() {
  var server_url = document.getElementById('server_url').value;
  var dbname = document.getElementById('dbname').value;
  var user = document.getElementById('user').value;
  var password = document.getElementById('password').value;
  var interval = parseInt(document.getElementById('interval').value);
  var check_buttons = document.getElementById('check_buttons').checked;
  browser.storage.local.set({
    server_url: server_url,
    dbname: dbname,
    user: user,
    password: password,
    interval: interval,
    check_buttons: check_buttons,
    uid: 0,
    employee_id: 0
  }).then(() => {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Opciones guardadas.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.local.
function restore_options() {
  browser.storage.local.get({
    server_url: '',
    dbname: '',
    user: '',
    password: '',
    interval: 30,
    check_buttons: true
  }).then(items => {
    document.getElementById('server_url').value = items.server_url;
    document.getElementById('dbname').value = items.dbname;
    document.getElementById('user').value = items.user;
    document.getElementById('password').value = items.password;
    document.getElementById('interval').value = items.interval;
    document.getElementById('check_buttons').checked = items.check_buttons;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
