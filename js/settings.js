// ==================== GitHub 设置页面 ====================
// 全屏覆盖层，用于配置 GitHub 仓库信息 + 本地工作路径
// 已登录用户 → 保存配置；未登录用户 → 注册流程

var Settings = {

  isOpen: false,

  open: function() {
    this.isOpen = true;
    document.getElementById('settings-overlay').classList.add('open');
    document.getElementById('settings-status').textContent = '';
    document.getElementById('settings-status').className = 'settings-status';
    this._updateUI();
    this._updateWorkPathStatus();
    // 未登录时不加载已有配置，避免弹窗干扰注册流程
    if (state.currentUser && state.currentUser.role !== 'local') {
      this._loadExistingConfig();
    } else {
      this._clearForm();
    }
  },

  close: function() {
    this.isOpen = false;
    document.getElementById('settings-overlay').classList.remove('open');
  },

  // ==================== UI 状态 ====================

  _updateUI: function() {
    var infoEl = document.getElementById('current-user-info');
    var logoutBtn = document.getElementById('btn-logout');
    var saveBtn = document.getElementById('btn-settings-save');
    var usernameInput = document.getElementById('cfg-username');
    var pathGroup = document.getElementById('settings-path-group');

    if (state.currentUser && state.currentUser.role !== 'local') {
      // 已登录 → 显示用户信息，Save Config
      infoEl.style.display = 'block';
      var roleText = state.currentUser.role === 'owner' ? 'Owner' : 'User';
      infoEl.textContent = 'Logged in as: ' + state.currentUser.username + ' (' + roleText + ')';
      logoutBtn.style.display = 'inline-block';
      saveBtn.textContent = 'Save Config';

      // username 字段：主人可编辑，用户只读
      document.getElementById('settings-username-group').style.display = 'block';
      if (state.currentUser.role === 'owner') {
        usernameInput.removeAttribute('readonly');
        usernameInput.style.color = '';
      } else {
        usernameInput.setAttribute('readonly', true);
        usernameInput.style.color = 'var(--color-light)';
      }
      // 非主人隐藏 file path（自动用 ${username}/plandata.json）
      pathGroup.style.display = state.currentUser.role === 'owner' ? 'block' : 'none';
    } else {
      // 未登录 → Register 模式
      infoEl.style.display = state.isLocalMode ? 'block' : 'none';
      if (state.isLocalMode) infoEl.textContent = 'Local offline mode';
      logoutBtn.style.display = 'none';
      saveBtn.textContent = 'Register';
      // 注册时 username 可编辑，file path 隐藏（自动生成）
      document.getElementById('settings-username-group').style.display = 'block';
      usernameInput.removeAttribute('readonly');
      usernameInput.style.color = '';
      pathGroup.style.display = 'none';
    }
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
    document.getElementById('cfg-branch').value = config.branch || 'main';
    document.getElementById('cfg-token').value = config.token || '';
    document.getElementById('cfg-username').value = config.username || '';
    document.getElementById('cfg-path').value = config.path || 'data/plandata.json';

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
    document.getElementById('cfg-username').value = '';
  },

  _getFormValues: function() {
    return {
      username: document.getElementById('cfg-username').value.trim(),
      owner: document.getElementById('cfg-owner').value.trim(),
      repo: document.getElementById('cfg-repo').value.trim(),
      branch: document.getElementById('cfg-branch').value.trim() || 'main',
      token: document.getElementById('cfg-token').value.trim(),
      workDirName: FileAccess._rootDirHandle
        ? FileAccess._rootDirHandle.name
        : document.getElementById('cfg-workpath').value.trim()
    };
  },

  // ==================== 测试连接 ====================

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

  // ==================== 保存/注册 ====================

  /** 保存按钮点击：根据当前状态决定是保存配置还是注册 */
  saveOrRegister: function() {
    if (state.currentUser && state.currentUser.role !== 'local') {
      this._saveConfig();
    } else {
      this._register();
    }
  },

  /** 已登录用户保存配置（用当前密码重新加密） */
  _saveConfig: function() {
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
      // 补充 path 和 role 字段
      var isOwner = state.currentUser.role === 'owner';
      if (isOwner) {
        values.path = document.getElementById('cfg-path').value.trim() || 'data/plandata.json';
        values.role = 'owner';
      } else {
        values.path = values.username + '/plandata.json';
        values.role = 'user';
      }

      // 用内存中的当前密码重新加密并推送（不需要弹窗）
      if (GitHub.hasPassword()) {
        var password = GitHub._memoryPassword;
        Storage.saveEncryptedConfig(values, password).then(function() {
          GitHub._config = values;
          showToast('Config saved!');
          self.close();
        }).catch(function(e) {
          showToast('Failed to save: ' + e.message);
        });
      } else {
        // 没有内存密码（不应该发生，但兜底处理）
        statusEl.textContent = 'Please re-enter your password';
        statusEl.className = 'settings-status error';
      }
    }).catch(function(e) {
      statusEl.textContent = 'Connection failed: ' + e.message;
      statusEl.className = 'settings-status error';
    });
  },

  /** 未登录用户注册流程 */
  _register: function() {
    var values = this._getFormValues();
    if (!values.owner || !values.repo || !values.token) {
      showToast('Please fill in Owner, Repo and Token');
      return;
    }
    if (!FileAccess.hasValidHandle()) {
      showToast('Please select a local work path');
      return;
    }

    var isOwner = !values.username;
    if (!isOwner) {
      if (location.protocol === 'file:') {
        showToast('User registration requires HTTPS (GitHub Pages)');
        return;
      }
      var usernameErr = UserRegistry.validateUsername(values.username);
      if (usernameErr) {
        showToast(usernameErr);
        return;
      }
    }

    var statusEl = document.getElementById('settings-status');
    statusEl.textContent = 'Testing connection...';
    statusEl.className = 'settings-status loading';

    var self = this;
    var regInfo = {
      username: values.username,
      owner: values.owner,
      repo: values.repo,
      branch: values.branch,
      token: values.token
    };

    GitHub.testConnection(values).then(function() {
      statusEl.textContent = 'Connected! Set your password...';
      statusEl.className = 'settings-status success';

      // 设置密码
      PasswordModal.show({
        title: 'Set Password',
        message: isOwner
          ? 'Set your owner password.\nYou need it to login later.'
          : 'Set your account password.\nYou need it to login later.',
        mode: 'set',
        hideCancel: true,
        onOk: function(password) {
          statusEl.textContent = 'Saving config...';
          statusEl.className = 'settings-status loading';

          if (isOwner) {
            // ===== 主人注册：生成 config → 保存本地 → 推送远程 =====
            Auth.registerOwner(regInfo, password).then(function() {
              showToast('Owner registered!');
              self.close();
              Auth.login(null, password).catch(function(err) {
                showToast('Registered, but auto-login failed: ' + err.message);
              });
            }).catch(function(err) {
              statusEl.textContent = 'Registration failed: ' + (err.message || err);
              statusEl.className = 'settings-status error';
            });
          } else {
            // ===== 普通用户注册 =====
            // Step 1: 生成 config → 保存本地 → 推送到用户仓库
            Auth.registerUserStep1(regInfo, password).then(function(encryptedJson) {
              // Step 2: 输入主人密码验证
              statusEl.textContent = 'Config saved! Enter owner password...';
              statusEl.className = 'settings-status success';

              PasswordModal.show({
                title: 'Owner Verification',
                message: 'Enter the project owner password to authorize registration',
                mode: 'unlock',
                cancelText: 'Cancel',
                onOk: function(ownerPassword) {
                  statusEl.textContent = 'Authorizing...';
                  statusEl.className = 'settings-status loading';

                  // Step 3: 验证主人密码 → 推送到项目仓库
                  Auth.registerUserStep2(regInfo, ownerPassword, encryptedJson)
                    .then(function() {
                      showToast('Registered as "' + regInfo.username + '"!');
                      self.close();
                      Auth.login(regInfo.username, password).catch(function(err) {
                        showToast('Registered, but auto-login failed: ' + err.message);
                      });
                    })
                    .catch(function(err) {
                      statusEl.textContent = 'Registration failed: ' + (err.message || err);
                      statusEl.className = 'settings-status error';
                    });
                },
                onCancel: function() {
                  statusEl.textContent = 'Registration cancelled (config saved locally)';
                  statusEl.className = 'settings-status error';
                }
              });
            }).catch(function(err) {
              statusEl.textContent = 'Registration failed: ' + (err.message || err);
              statusEl.className = 'settings-status error';
            });
          }
        }
      });
    }).catch(function(e) {
      statusEl.textContent = 'Connection failed: ' + e.message;
      statusEl.className = 'settings-status error';
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
