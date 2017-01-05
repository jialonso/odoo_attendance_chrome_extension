function translate() {
  document.getElementById('sign_in_btn').innerHTML = browser.i18n.getMessage("sign_in");
  document.getElementById('sign_out_btn').innerHTML = browser.i18n.getMessage("sign_out");
}

function get_status() {
  browser.runtime.sendMessage("getStatus").then(response => {
    // Set worked time text
    var worked_time_div = document.getElementById('worked_time');
    if (response.status === 'sign_in' || response.status === 'sign_out') {
      worked_time_div.innerHTML = response.worked_time;
    } else if (response.status === 'not_configured') {
      worked_time_div.innerHTML = browser.i18n.getMessage("not_configured");
    } else {
      worked_time_div.innerHTML = browser.i18n.getMessage("connecting");
    }

    // Display buttons
    browser.storage.local.get(['check_buttons']).then(items => {
      if (items.check_buttons) {
        if (response.status === 'sign_in') {
          var sign_out_btn = document.getElementById('sign_out_btn');
          sign_out_btn.style.display = 'inline';
        } else if (response.status === 'sign_out') {
          var sign_in_btn = document.getElementById('sign_in_btn');
          sign_in_btn.style.display = 'inline';
        }
      }
    });
  });
}

function sign_in() {
  sign_in_btn.style.display = 'none';
  browser.runtime.sendMessage("sign_in");
}

function sign_out() {
  sign_out_btn.style.display = 'none';
  browser.runtime.sendMessage("sign_out");
}

document.addEventListener('DOMContentLoaded', translate);
document.addEventListener('DOMContentLoaded', get_status);
document.getElementById('sign_in_btn').addEventListener('click', sign_in);
document.getElementById('sign_out_btn').addEventListener('click', sign_out);
