function translate() {
  document.getElementById('sign_in_btn').innerHTML = browser.i18n.getMessage("sign_in");
  document.getElementById('sign_out_btn').innerHTML = browser.i18n.getMessage("sign_out");
}

function get_status() {
  browser.runtime.sendMessage({action: "getStatus"}).then(response => {
    // Set worked time text
    var worked_time_div = document.getElementById('worked_time');
    if (response.status === 'sign_in' || response.status === 'sign_out') {
      worked_time_div.innerHTML = response.worked_time;
      
      // Display buttons
      browser.storage.local.get(['check_buttons']).then(items => {
        if (items.check_buttons) {
          var buttons_div = document.getElementById('buttons_container');
          buttons_div.style.display = 'inline';

          const reasons = response.reasons;
          if (reasons.length) {
            const reasonsSelect = document.getElementById('reasons_select');
            reasonsSelect.style.display = 'inline';
            reasonsSelect.options[0] = new Option('', null);
            for(var i=0; i < reasons.length; i++) {
              reasonsSelect.options[i+1] = new Option(reasons[i].name, reasons[i].id);
            }
            reasonsSelect.value = reasonsSelect.options[1].value;
          }

          if (response.status === 'sign_in') {
            var sign_out_btn = document.getElementById('sign_out_btn');
            sign_out_btn.style.display = 'inline';
          } else if (response.status === 'sign_out') {
            var sign_in_btn = document.getElementById('sign_in_btn');
            sign_in_btn.style.display = 'inline';
          }
        }
      });
    } else if (response.status === 'not_configured') {
      worked_time_div.innerHTML = browser.i18n.getMessage("not_configured");
    } else {
      worked_time_div.innerHTML = browser.i18n.getMessage("connecting");
    }
  });
}

function sign_in() {
  var buttons_div = document.getElementById('buttons_container');
  var reasonsSelect = document.getElementById('reasons_select');
  buttons_div.style.display = 'none';
  browser.runtime.sendMessage({action: "sign_in", reason: reasonsSelect.value});
}

function sign_out() {
  var buttons_div = document.getElementById('buttons_container');
  var reasonsSelect = document.getElementById('reasons_select');
  buttons_div.style.display = 'none';
  browser.runtime.sendMessage({action: "sign_out", reason: reasonsSelect.value});
}

document.addEventListener('DOMContentLoaded', translate);
document.addEventListener('DOMContentLoaded', get_status);
document.getElementById('sign_in_btn').addEventListener('click', sign_in);
document.getElementById('sign_out_btn').addEventListener('click', sign_out);
