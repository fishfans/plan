// ==================== 工作路径选择/授权弹窗 ====================
// 两种模式：
//   'select'    - 首次无路径，说明后让用户选择目录
//   'authorize' - 重新登录有路径，让用户授权访问

var WorkPathModal = {

  _onSelect: null,
  _onAuthorize: null,
  _onCancel: null,

  /**
   * 显示工作路径弹窗
   * @param {Object} options
   *   mode        - 'select' | 'authorize'
   *   dirName     - authorize 模式下显示的目录名
   *   onSelect    - select 模式回调 (接收 FileSystemDirectoryHandle)
   *   onAuthorize - authorize 模式回调 (接收 boolean granted)
   *   onCancel    - Skip 回调
   */
  show: function(options) {
    var overlay = document.getElementById('workpath-overlay');
    var msg = document.getElementById('workpath-msg');
    var selectBtn = document.getElementById('workpath-select');
    var authBtn = document.getElementById('workpath-authorize');
    var cancelBtn = document.getElementById('workpath-cancel');

    if (options.mode === 'authorize') {
      msg.textContent = 'Found existing work path: "' + options.dirName + '". Authorize access for offline storage?';
      selectBtn.style.display = 'none';
      authBtn.style.display = '';
    } else {
      msg.textContent = 'A local work path is needed to store your plan data locally for offline access.\nClick "Select" to choose a directory.';
      selectBtn.style.display = '';
      authBtn.style.display = 'none';
    }

    this._onSelect = options.onSelect || null;
    this._onAuthorize = options.onAuthorize || null;
    this._onCancel = options.onCancel || null;

    overlay.classList.add('open');
  },

  close: function() {
    document.getElementById('workpath-overlay').classList.remove('open');
    this._onSelect = null;
    this._onAuthorize = null;
    this._onCancel = null;
  },

  select: function() {
    if (!window.showDirectoryPicker) {
      showToast('Browser does not support directory picking (use Chrome)');
      return;
    }
    var callback = this._onSelect;
    this._onSelect = null;
    this._onAuthorize = null;
    this._onCancel = null;
    document.getElementById('workpath-overlay').classList.remove('open');

    var handleUsername = (state.currentUser && state.currentUser.role !== 'owner')
      ? state.currentUser.username : null;
    window.showDirectoryPicker({ mode: 'readwrite' }).then(function(handle) {
      return FileAccess.saveDirHandle(handle, handleUsername).then(function() {
        if (callback) callback(handle);
      });
    }).catch(function(e) {
      if (e.name !== 'AbortError') showToast('Failed to pick directory: ' + e.message);
    });
  },

  authorize: function() {
    var callback = this._onAuthorize;
    this._onSelect = null;
    this._onAuthorize = null;
    this._onCancel = null;
    document.getElementById('workpath-overlay').classList.remove('open');

    if (callback) {
      FileAccess._ensurePermission().then(function(granted) {
        callback(granted);
      });
    }
  },

  cancel: function() {
    var callback = this._onCancel;
    this._onSelect = null;
    this._onAuthorize = null;
    this._onCancel = null;
    document.getElementById('workpath-overlay').classList.remove('open');
    if (callback) callback();
  }
};
