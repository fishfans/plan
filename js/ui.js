// ==================== Toast & Confirm ====================

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2000);
}

function showConfirm(msg, callback) {
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-overlay').classList.add('open');
  confirmCallback = callback;
}

function closeConfirm(result) {
  document.getElementById('confirm-overlay').classList.remove('open');
  if (confirmCallback) {
    confirmCallback(result);
    confirmCallback = null;
  }
}
