// ==================== GitHub 设置页面 ====================
// 全屏覆盖层，用于配置 GitHub 仓库信息 + 本地工作路径
// 加密配置保存到本地工作路径 + 推送到 GitHub 仓库 data/config.json

var Settings = {

  isOpen: false,

  open: function() {
    this.isOpen = true;
    document.getElementById('settings-overlay').classList.add('open');
    document.getElementById('settings-status').textContent = '';
    document.getElementById('settings-status').className = 'settings-status';
    this._updateWorkPathStatus();
    this._loadExistingConfig();
  },

  close: function() {
    this.isOpen = false;
    document.getElementById('settings-overlay').classList.remove('open');
  },

  // ==================== 工作路径选择 ====================

  pickDir: function() {
    if (!window.showDirectoryPicker) {
      showToast('Browser does not support directory picking (use Chrome)');
      return;
    }
    var self = this;
    window.showDirectoryPicker({ mode: 'readwrite' }).then(function(handle) {
      FileAccess.saveDirHandle(handle).then(function() {
        self._updateWorkPathStatus();
        showToast('Work path set: ' + handle.name);
      });
    }).catch(function(e) {
      if (e.name !== 'AbortError') showToast('Failed: ' + e.message);
    });
  },

  _updateWorkPathStatus: function() {
    var el = document.getElementById('workpath-status');
    var input = document.getElementById('cfg-workpath');
    if (FileAccess.hasValidHandle()) {
      input.value = FileAccess._rootDirHandle.name;
      el.textContent = 'Path: ' + FileAccess._rootDirHandle.name;
      el.style.color = 'var(--color-tag-low)';
    } else if (input.value) {
      // 有 workDirName（来自 config）但无句柄 → 提示重新选择
      el.textContent = input.value + ' (re-select)';
      el.style.color = 'var(--color-light)';
    } else {
      input.value = '';
      el.textContent = 'No path selected';
      el.style.color = 'var(--color-light)';
    }
  },

  // ==================== 加载已有配置 ====================

  _loadExistingConfig: function() {
    if (FileAccess.hasConfig() && GitHub.hasPassword() && GitHub.getConfig()) {
      this._fillForm(GitHub.getConfig());
      return;
    }
    if (FileAccess.hasConfig()) {
      var self = this;
      PasswordModal.show({
        title: 'Enter Password',
        message: 'Enter password to load existing settings',
        mode: 'unlock',
        cancelText: 'Cancel',
        onOk: function(password) {
          GitHub.unlock(password).then(function(config) {
            self._fillForm(config);
          }).catch(function() {
            showToast('Wrong password!');
            self._clearForm();
          });
        },
        onCancel: function() { self._clearForm(); }
      });
      return;
    }
    // 内存没有配置 → 尝试从工作目录读取
    if (FileAccess.hasValidHandle()) {
      var self = this;
      FileAccess.readLocalFile('config.json').then(function(text) {
        if (text) {
          FileAccess.updateConfigCache(text);
          PasswordModal.show({
            title: 'Enter Password',
            message: 'Enter password to load existing settings',
            mode: 'unlock',
            cancelText: 'Cancel',
            onOk: function(password) {
              GitHub.unlock(password).then(function(config) {
                self._fillForm(config);
              }).catch(function() {
                showToast('Wrong password!');
                self._clearForm();
              });
            },
            onCancel: function() { self._clearForm(); }
          });
        } else {
          self._clearForm();
        }
      }).catch(function() { self._clearForm(); });
    } else {
      this._clearForm();
    }
  },

  // ==================== 表单操作 ====================

  _fillForm: function(config) {
    document.getElementById('cfg-owner').value = config.owner || '';
    document.getElementById('cfg-repo').value = config.repo || '';
    document.getElementById('cfg-path').value = config.path || 'data/plandata.json';
    document.getElementById('cfg-branch').value = config.branch || 'main';
    document.getElementById('cfg-token').value = config.token || '';
    if (config.workDirName) {
      document.getElementById('cfg-workpath').value = config.workDirName;
    }
    this._updateWorkPathStatus();
  },

  _clearForm: function() {
    document.getElementById('cfg-owner').value = '';
    document.getElementById('cfg-repo').value = '';
    document.getElementById('cfg-path').value = 'data/plandata.json';
    document.getElementById('cfg-branch').value = 'main';
    document.getElementById('cfg-token').value = '';
  },

  _getFormValues: function() {
    return {
      owner: document.getElementById('cfg-owner').value.trim(),
      repo: document.getElementById('cfg-repo').value.trim(),
      path: document.getElementById('cfg-path').value.trim() || 'data/plandata.json',
      branch: document.getElementById('cfg-branch').value.trim() || 'main',
      token: document.getElementById('cfg-token').value.trim(),
      workDirName: FileAccess._rootDirHandle
        ? FileAccess._rootDirHandle.name
        : document.getElementById('cfg-workpath').value.trim()
    };
  },

  // ==================== 测试 & 保存 ====================

  testConnection: function() {
    var values = this._getFormValues();
    if (!values.owner || !values.repo || !values.token) {
      showToast('Please fill in Owner, Repo and Token');
      return;
    }
    var statusEl = document.getElementById('settings-status');
    statusEl.textContent = 'Connecting...';
    statusEl.className = 'settings-status loading';

    GitHub.testConnection(values).then(function() {
      statusEl.textContent = 'Connection successful!';
      statusEl.className = 'settings-status success';
      showToast('Connection successful!');
    }).catch(function(e) {
      statusEl.textContent = 'Connection failed: ' + e.message;
      statusEl.className = 'settings-status error';
      showToast('Connection failed: ' + e.message);
    });
  },

  /** 保存配置：检查所有字段 → 测试连接 → 密码 → 加密 → 本地 + GitHub */
  save: function() {
    var values = this._getFormValues();
    if (!values.owner || !values.repo || !values.token) {
      showToast('Please fill in Owner, Repo and Token');
      return;
    }
    if (!FileAccess.hasValidHandle()) {
      showToast('Please select a local work path');
      return;
    }

    var statusEl = document.getElementById('settings-status');
    statusEl.textContent = 'Testing connection...';
    statusEl.className = 'settings-status loading';

    var self = this;
    GitHub.testConnection(values).then(function() {
      statusEl.textContent = 'Connected! Please set a password...';
      statusEl.className = 'settings-status success';

      PasswordModal.show({
        title: 'Set Encryption Password',
        message: 'This password will encrypt your GitHub config.\nYou will need it each time you open the page.',
        mode: 'set',
        hideCancel: true,
        onOk: function(password) {
          Storage.saveEncryptedConfig(values, password).then(function() {
            GitHub.setMemoryPassword(password);
            GitHub._config = values;
            showToast('Config saved!');
            self.close();
          }).catch(function(e) {
            showToast('Failed to save: ' + e.message);
          });
        }
      });
    }).catch(function(e) {
      statusEl.textContent = 'Connection failed: ' + e.message;
      statusEl.className = 'settings-status error';
      showToast('Connection failed: ' + e.message);
    });
  },

  clearConfig: function() {
    var self = this;
    showConfirm('Clear all settings? This will remove config and work path.', function(ok) {
      if (!ok) return;
      Storage.clearConfig().then(function() {
        GitHub.lock();
        self._clearForm();
        self._updateWorkPathStatus();
        document.getElementById('settings-status').textContent = '';
        document.getElementById('settings-status').className = 'settings-status';
        showToast('Settings cleared');
      });
    });
  }
};
