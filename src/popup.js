function sync_message() {
  browser.runtime.sendMessage("getWorkedTime").then(response => {
    if(typeof response === 'string' && response.length > 0) {
      document.getElementById('worked_time').innerHTML = response;
    }
  });
}

document.addEventListener('DOMContentLoaded', sync_message);
