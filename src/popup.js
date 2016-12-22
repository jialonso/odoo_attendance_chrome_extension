function sync_message() {
  chrome.runtime.sendMessage({method:"getWorkedTime"},function(response){
    document.getElementById('worked_time').innerHTML = response;
  });
}

document.addEventListener('DOMContentLoaded', sync_message);
