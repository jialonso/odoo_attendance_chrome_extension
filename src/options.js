// Saves options to browser.storage.local.
function save_options() {
    var server_url = document.getElementById('server_url').value;
    var dbname = document.getElementById('dbname').value;
    var user = document.getElementById('user').value;
    var password = document.getElementById('password').value;
    browser.storage.local.set({
        server_url: server_url,
        dbname: dbname,
        user: user,
        password: password,
    }).then(() => {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Opciones guardadas.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
    browser.storage.local.remove(['uid', 'employee_id']);
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.local.
function restore_options() {
    browser.storage.local.get({
        server_url: '',
        dbname: '',
        user: '',
        password: ''
    }).then(items => {
    	document.getElementById('server_url').value = items.server_url;
    	document.getElementById('dbname').value = items.dbname;
    	document.getElementById('user').value = items.user;
    	document.getElementById('password').value = items.password;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
