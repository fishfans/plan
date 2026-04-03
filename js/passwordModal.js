// ==================== 密码输入弹窗 ====================
// 支持两种模式：
//   'unlock' - 输入密码解锁（一个输入框）
//   'set'    - 设置新密码（密码 + 确认）

var PasswordModal = {

  _onOk: null,
  _onCancel: null,

  /**
   * 显示密码弹窗
   * @param {Object} options
   *   title      - 弹窗标题
   *   message    - 提示信息
   *   mode       - 'unlock' | 'set'
   *   cancelText - 取消按钮文字 (默认 'Skip')
   *   hideCancel - 是否隐藏取消按钮
   *   onOk       - 确认回调 (接收 password 参数)
   *   onCancel   - 取消回调
   */
  show: function(options) {
    var overlay = document.getElementById('password-overlay');
    var title = document.getElementById('password-title');
    var msg = document.getElementById('password-msg');
    var input = document.getElementById('password-input');
    var confirmInput = document.getElementById('password-confirm');
    var okBtn = document.getElementById('password-ok');
    var cancelBtn = document.getElementById('password-cancel');
    var error = document.getElementById('password-error');

    title.textContent = '~ ' + options.title + ' ~';
    msg.textContent = options.message || '';
    input.value = '';
    confirmInput.value = '';
    error.style.display = 'none';

    // 根据模式切换 UI
    if (options.mode === 'set') {
      confirmInput.style.display = 'block';
      okBtn.textContent = 'Save';
    } else {
      confirmInput.style.display = 'none';
      okBtn.textContent = 'OK';
    }

    cancelBtn.textContent = options.cancelText || 'Skip';
    cancelBtn.style.display = options.hideCancel ? 'none' : '';

    this._onOk = options.onOk || null;
    this._onCancel = options.onCancel || null;

    overlay.classList.add('open');
    setTimeout(function() { input.focus(); }, 100);
  },

  close: function() {
    document.getElementById('password-overlay').classList.remove('open');
    this._onOk = null;
    this._onCancel = null;
  },

  ok: function() {
    var input = document.getElementById('password-input');
    var confirmInput = document.getElementById('password-confirm');
    var error = document.getElementById('password-error');

    if (!input.value) {
      error.textContent = 'Password cannot be empty';
      error.style.display = 'block';
      return;
    }

    // 设置模式：检查两次密码是否一致
    if (confirmInput.style.display !== 'none' && confirmInput.value !== input.value) {
      error.textContent = 'Passwords do not match';
      error.style.display = 'block';
      return;
    }

    var password = input.value;
    if (this._onOk) this._onOk(password);
    this.close();
  },

  cancel: function() {
    if (this._onCancel) this._onCancel();
    this.close();
  }
};
