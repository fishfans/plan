// ==================== GitHub 设置页面 ====================
// 全屏覆盖层，用于配置 GitHub 仓库信息
// 加密配置推送到 GitHub 仓库的 data/config.json

var Settings = {

  isOpen: false,

  open: function() {
    this.isOpen = true;
    document.getElementById('settings-overlay').classList.add('open');
    document.getElementById('settings-status').textContent = '';
    document.getElementById('settings-status').className = 'settings-status';
    this._loadExistingConfig();
  },

  close: function() {
    this.isOpen = false;
    document.getElementById('settings-overlay').classList.remove('open');
  },

  /** 尝试加载已有配置并填充表单 */
  _loadExistingConfig: function() {
    // 配置已在内存中（页面加载时读取）且密码已解锁
    if (FileAccess.hasConfig() && GitHub.hasPassword() && GitHub.getConfig()) {
      this._fillForm(GitHub.getConfig());
      return;
    }
    // 有配置但还没解锁
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
        onCancel: function() {
          self._clearForm();
        }
      });
      return;
    }
    // 没有配置文件 → 尝试读取
    var self = this;
    FileAccess.loadConfigFile().then(function(text) {
      if (text) {
        // 读取成功但还没解锁，需要密码
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
          onCancel: function() {
            self._clearForm();
          }
        });
      } else {
        self._clearForm();
      }
    });
  },

  _fillForm: function(config) {
    document.getElementById('cfg-owner').value = config.owner || '';
    document.getElementById('cfg-repo').value = config.repo || '';
    document.getElementById('cfg-path').value = config.path || 'data/plandata.json';
    document.getElementById('cfg-branch').value = config.branch || 'main';
    document.getElementById('cfg-token').value = config.token || '';
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
      token: document.getElementById('cfg-token').value.trim()
    };
  },

  /** 测试连接（使用表单当前值） */
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

  /** 保存配置：测试连接 → 弹窗设置密码 → 加密 → 推送到 GitHub 仓库 data/config.json */
  save: function() {
    var values = this._getFormValues();
    if (!values.owner || !values.repo || !values.token) {
      showToast('Please fill in Owner, Repo and Token');
      return;
    }

    var statusEl = document.getElementById('settings-status');
    statusEl.textContent = 'Testing connection...';
    statusEl.className = 'settings-status loading';

    var self = this;
    GitHub.testConnection(values).then(function() {
      statusEl.textContent = 'Connected! Please set a password...';
      statusEl.className = 'settings-status success';

      // 连接成功 → 弹窗让用户设置加密密码
      PasswordModal.show({
        title: 'Set Encryption Password',
        message: 'This password will be used to encrypt your GitHub config.\nYou will need it each time you open the page.',
        mode: 'set',
        hideCancel: true,
        onOk: function(password) {
          Storage.saveEncryptedConfig(values, password).then(function() {
            GitHub.setMemoryPassword(password);
            GitHub._config = values;
            showToast('Config pushed to GitHub!');
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

  /** 清除配置 */
  clearConfig: function() {
    var self = this;
    showConfirm('Clear GitHub settings? This will remove the config file reference.', function(ok) {
      if (!ok) return;
      Storage.clearConfig().then(function() {
        GitHub.lock();
        self._clearForm();
        document.getElementById('settings-status').textContent = '';
        document.getElementById('settings-status').className = 'settings-status';
        showToast('Settings cleared');
      });
    });
  }
};
