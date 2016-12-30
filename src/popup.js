function get_status() {
  browser.runtime.sendMessage("getStatus").then(response => {
    var worked_time_div = document.getElementById('worked_time');
    var sign_in_btn = document.getElementById('sign_in_btn');
    var sign_out_btn = document.getElementById('sign_out_btn');

    if(response.status === 'sign_in') {
      worked_time_div.innerHTML = response.worked_time;
      sign_in_btn.style.display = 'none';
      sign_out_btn.style.display = '';
    }
    else if (response.status === 'sign_out') {
      worked_time_div.innerHTML = response.worked_time;
      sign_in_btn.style.display = '';
      sign_out_btn.style.display = 'none';
    }
    else {
      worked_time_div.innerHTML = "Not configured";
      sign_in_btn.style.display = 'none';
      sign_out_btn.style.display = 'none';
    }
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

document.addEventListener('DOMContentLoaded', get_status);
document.getElementById('sign_in_btn').addEventListener('click', sign_in);
document.getElementById('sign_out_btn').addEventListener('click', sign_out);
