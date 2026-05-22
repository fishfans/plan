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
      saveBtn.textContent = i18n.t('settings.saveConfig');

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
      if (state.isLocalMode) infoEl.textContent = i18n.t('settings.localOfflineMode');
      logoutBtn.style.display = 'none';
      saveBtn.textContent = i18n.t('settings.register');
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
      showToast(i18n.t('workPath.browserNotSupported'));
      return;
    }
    var self = this;
    // 根据当前用户角色决定 IndexedDB key（区分多用户句柄）
    var handleUsername = (state.currentUser && state.currentUser.role !== 'owner')
      ? state.currentUser.username : null;
    window.showDirectoryPicker({ mode: 'readwrite' }).then(function(handle) {
      return FileAccess.saveDirHandle(handle, handleUsername).then(function() {
        self._updateWorkPathStatus();
        showToast(i18n.t('msg.workPathSet') + handle.name);
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
      el.textContent = i18n.t('settings.path') + FileAccess._rootDirHandle.name;
      el.style.color = 'var(--color-tag-low)';
    } else if (input.value) {
      el.textContent = input.value + ' (re-select)';
      el.style.color = 'var(--color-light)';
    } else {
      input.value = '';
      el.textContent = i18n.t('settings.noPathSelected');
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
        title: i18n.t('password.title'),
        message: i18n.t('password.message'),
        mode: 'unlock',
        cancelText: 'Cancel',
        onOk: function(password) {
          GitHub.unlock(password).then(function(config) {
            self._fillForm(config);
          }).catch(function() {
            showToast(i18n.t('msg.wrongPassword'));
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
            title: i18n.t('password.title'),
            message: i18n.t('password.message'),
            mode: 'unlock',
            cancelText: 'Cancel',
            onOk: function(password) {
              GitHub.unlock(password).then(function(config) {
                self._fillForm(config);
              }).catch(function() {
                showToast(i18n.t('msg.wrongPassword'));
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
      showToast(i18n.t('msg.pleaseFillOwnerRepoToken'));
      return;
    }
    var statusEl = document.getElementById('settings-status');
    statusEl.textContent = i18n.t('msg.connecting');
    statusEl.className = 'settings-status loading';

    GitHub.testConnection(values).then(function() {
      statusEl.textContent = i18n.t('msg.connectionSuccess');
      statusEl.className = 'settings-status success';
      showToast(i18n.t('msg.connectionSuccess'));
    }).catch(function(e) {
      statusEl.textContent = i18n.t('msg.connectionFailed') + e.message;
      statusEl.className = 'settings-status error';
      showToast(i18n.t('msg.connectionFailed') + e.message);
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
      showToast(i18n.t('msg.pleaseFillOwnerRepoToken'));
      return;
    }
    if (!FileAccess.hasValidHandle()) {
      showToast(i18n.t('msg.pleaseSelectLocalPath'));
      return;
    }

    var statusEl = document.getElementById('settings-status');
    statusEl.textContent = i18n.t('msg.connecting');
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
          showToast(i18n.t('settings.configSaved'));
          self.close();
        }).catch(function(e) {
          showToast(i18n.t('msg.saveFailed') + e.message);
        });
      } else {
        // 没有内存密码（不应该发生，但兜底处理）
        statusEl.textContent = 'Please re-enter your password';
        statusEl.className = 'settings-status error';
      }
    }).catch(function(e) {
      statusEl.textContent = i18n.t('msg.connectionFailed') + e.message;
      statusEl.className = 'settings-status error';
    });
  },

  /** 未登录用户注册流程 */
  _register: function() {
    var values = this._getFormValues();
    if (!values.owner || !values.repo || !values.token) {
      showToast(i18n.t('msg.pleaseFillOwnerRepoToken'));
      return;
    }
    if (!FileAccess.hasValidHandle()) {
      showToast(i18n.t('msg.pleaseSelectLocalPath'));
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
    statusEl.textContent = i18n.t('msg.connecting');
    statusEl.className = 'settings-status loading';

    var self = this;
    var regInfo = {
      username: values.username,
      owner: values.owner,
      repo: values.repo,
      branch: values.branch,
      token: values.token,
      workDirName: values.workDirName || null
    };

    GitHub.testConnection(values).then(function() {
      statusEl.textContent = i18n.t('settings.connectedSetPassword');
      statusEl.className = 'settings-status success';

      // 设置密码
      PasswordModal.show({
        title: i18n.t('password.setTitle'),
        message: isOwner
          ? i18n.t('password.setOwnerPasswordMessage')
          : i18n.t('password.setAccountPasswordMessage'),
        mode: 'set',
        hideCancel: true,
        onOk: function(password) {
          statusEl.textContent = i18n.t('settings.savingConfig');
          statusEl.className = 'settings-status loading';

          if (isOwner) {
            // ===== 主人注册：生成 config → 保存本地 → 推送远程 =====
            Auth.registerOwner(regInfo, password).then(function() {
              showToast(i18n.t('settings.ownerRegistered'));
              self.close();
              Auth.initAfterRegister(password, { isOwner: true }).catch(function(err) {
                showToast(i18n.t('settings.autoLoginFailed') + err.message);
              });
            }).catch(function(err) {
              statusEl.textContent = i18n.t('settings.registrationFailed') + (err.message || err);
              statusEl.className = 'settings-status error';
            });
          } else {
            // ===== 普通用户注册 =====
            // Step 1: 生成 config → 保存本地 → 推送到用户仓库
            Auth.registerUserStep1(regInfo, password).then(function(encryptedJson) {
              // Step 2: 输入主人密码验证
              statusEl.textContent = i18n.t('settings.configSavedEnterOwnerPassword');
              statusEl.className = 'settings-status success';

              PasswordModal.show({
                title: i18n.t('password.ownerVerification'),
                message: i18n.t('password.ownerVerificationMessage'),
                mode: 'unlock',
                cancelText: 'Cancel',
                onOk: function(ownerPassword) {
                  statusEl.textContent = i18n.t('settings.authorizing');
                  statusEl.className = 'settings-status loading';

                  // Step 3: 验证主人密码 → 推送到项目仓库
                  Auth.registerUserStep2(regInfo, ownerPassword, encryptedJson)
                    .then(function() {
                      showToast(i18n.t('settings.registeredAs') + regInfo.username + '"!');
                      self.close();
                      Auth.initAfterRegister(password, { isOwner: false, username: regInfo.username }).catch(function(err) {
                        showToast(i18n.t('settings.autoLoginFailed') + err.message);
                      });
                    })
                    .catch(function(err) {
                      statusEl.textContent = i18n.t('settings.registrationFailed') + (err.message || err);
                      statusEl.className = 'settings-status error';
                    });
                },
                onCancel: function() {
                  statusEl.textContent = i18n.t('settings.registrationCancelled');
                  statusEl.className = 'settings-status error';
                }
              });
            }).catch(function(err) {
              statusEl.textContent = i18n.t('settings.registrationFailed') + (err.message || err);
              statusEl.className = 'settings-status error';
            });
          }
        }
      });
    }).catch(function(e) {
      statusEl.textContent = i18n.t('msg.connectionFailed') + e.message;
      statusEl.className = 'settings-status error';
    });
  },

  clearConfig: function() {
    var self = this;
    showConfirm(i18n.t('settings.clearConfirm'), function(ok) {
      if (!ok) return;
      Storage.clearConfig().then(function() {
        GitHub.lock();
        self._clearForm();
        self._updateWorkPathStatus();
        document.getElementById('settings-status').textContent = '';
        document.getElementById('settings-status').className = 'settings-status';
        showToast(i18n.t('settings.cleared'));
      });
    });
  }
};
