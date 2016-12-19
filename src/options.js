// Saves options to chrome.storage.sync.
function save_options() {
    var server_url = document.getElementById('server_url').value;
    var dbname = document.getElementById('dbname').value;
    var user = document.getElementById('user').value;
    var password = document.getElementById('password').value;
    chrome.storage.sync.set({
        server_url: server_url,
        dbname: dbname,
        user: user,
        password: password,
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Opciones guardadas.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
    chrome.storage.sync.remove(['uid', 'employee_id']);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get(
	['server_url', 'dbname', 'user', 'password'],
	function(items) {
		document.getElementById('server_url').value = items.server_url;
		document.getElementById('dbname').value = items.dbname;
		document.getElementById('user').value = items.user;
		document.getElementById('password').value = items.password;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
