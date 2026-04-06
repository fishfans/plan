// ==================== 登录 & 注册流程 ====================
// 管理用户登录、注册的 UI 交互和业务逻辑

// 依赖 globalEvents.js 中暴露的全局函数（通过 window._app）
// 这些函数在 auth.js 加载时可能还未定义，所以通过运行时访问
function _applyRemoteData(data) { return (window._app && window._app.applyRemoteData || applyRemoteData)(data); }
function _fallbackToLocal() { return (window._app && window._app.fallbackToLocal || fallbackToLocal)(); }
function _updateToggleUI() { return (window._app && window._app.updateToggleUI || updateToggleUI)(); }
function _render() { return (window._app && window._app.render || render)(); }

var Auth = {

  // ==================== 启动入口 ====================

  /**
   * 应用启动时调用：根据环境显示登录页面
   */
  init: function() {
    if (UserRegistry.isLocalFile()) {
      state.isLocalMode = true;
    }
    this.showLoginScreen();
  },

  // ==================== 登录页面 ====================

  showLoginScreen: function() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';

    // 本地模式时提示
    var localHint = document.getElementById('login-local-hint');
    if (localHint) {
      localHint.style.display = state.isLocalMode ? 'block' : 'none';
    }

    // 聚焦
    document.getElementById('login-username').focus();
  },

  hideLoginScreen: function() {
    document.getElementById('login-overlay').style.display = 'none';
  },

  /** 处理登录 */
  handleLogin: function() {
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value;
    var statusEl = document.getElementById('login-status');

    if (!password) {
      statusEl.textContent = 'Please enter your password';
      statusEl.className = 'settings-status error';
      return;
    }

    // 空用户名视为项目主人
    var isOwner = !username;
    statusEl.textContent = 'Loading...';
    statusEl.className = 'settings-status loading';

    var self = this;
    UserRegistry.fetchUserConfigBlob(isOwner ? null : username).then(function(blobText) {
      if (!blobText) {
        statusEl.textContent = isOwner
          ? 'No owner config found. Please configure in Settings.'
          : 'User "' + username + '" not found. Please register first.';
        statusEl.className = 'settings-status error';
        return;
      }
      return self._decryptAndInit(blobText, password, username, isOwner, statusEl);
    }).catch(function(err) {
      statusEl.textContent = 'Login failed: ' + (err.message || err);
      statusEl.className = 'settings-status error';
    });
  },

  /**
   * 解密配置并初始化应用
   * @private
   */
  _decryptAndInit: function(blobText, password, username, isOwner, statusEl) {
    var encryptedObj;
    try { encryptedObj = JSON.parse(blobText); }
    catch (e) {
      statusEl.textContent = 'Config file is corrupted';
      statusEl.className = 'settings-status error';
      return Promise.resolve();
    }

    var self = this;
    return Crypto.decrypt(encryptedObj, password).then(function(decrypted) {
      var config = JSON.parse(decrypted);

      // 设置当前用户状态
      state.currentUser = {
        username: config.username || (isOwner ? 'owner' : username),
        role: config.role || (isOwner ? 'owner' : 'user'),
        configPath: isOwner ? 'data/config.json' : ('users/' + username + '.json')
      };

      // 初始化 GitHub 模块
      GitHub._config = config;
      GitHub.setMemoryPassword(password);

      // 缓存配置
      FileAccess.updateConfigCache(blobText);

      // 隐藏登录页
      self.hideLoginScreen();

      // 尝试恢复本地工作目录（按用户名查找句柄）
      var handleUsername = isOwner ? null : username;
      return FileAccess.getDirHandle(handleUsername).then(function(handle) {
        if (!handle) return;
        return FileAccess._ensurePermission();
      }).catch(function() {}).then(function() {
        // 加载用户的计划数据
        return self._loadPlanData(statusEl);
      });
    }).catch(function(err) {
      statusEl.textContent = 'Wrong password!';
      statusEl.className = 'settings-status error';
    });
  },

  /**
   * 加载用户自己的 GitHub 仓库中的计划数据
   * @private
   */
  _loadPlanData: function(statusEl) {
    var self = this;
    return GitHub.fetchPlanData().then(function(data) {
      if (data) {
        _applyRemoteData(data);
        showToast('Welcome, ' + (state.currentUser ? state.currentUser.username : '') + '!');
      } else {
        // GitHub 无数据 → 尝试本地
        if (FileAccess.hasValidHandle()) {
          return Storage.loadLocalPlanData().then(function(loaded) {
            if (loaded) {
              state.dataSource = 'local';
              _updateToggleUI();
              showToast('No remote data. Loaded local data.');
            }
            _render();
          });
        }
        _render();
        showToast('No existing plan data. Start fresh!');
      }
    }).catch(function(err) {
      // GitHub 加载失败 → 尝试本地
      if (FileAccess.hasValidHandle()) {
        return Storage.loadLocalPlanData().then(function(loaded) {
          if (loaded) {
            state.dataSource = 'local';
            _updateToggleUI();
            showToast('GitHub failed. Loaded local data.');
          }
          _render();
        });
      }
      _render();
      showToast('Failed to load plan data: ' + (err.message || err));
    });
  },

  // ==================== 注册页面 ====================

  showRegisterScreen: function() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('register-status').textContent = '';
    document.getElementById('register-status').className = 'settings-status';
    document.getElementById('reg-username').focus();
  },

  showLoginFromRegister: function() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('login-status').textContent = '';
    document.getElementById('login-status').className = 'settings-status';
  },

  /** 处理注册 */
  handleRegister: function() {
    var username = document.getElementById('reg-username').value.trim();
    var password = document.getElementById('reg-password').value;
    var passwordConfirm = document.getElementById('reg-password-confirm').value;
    var ghOwner = document.getElementById('reg-owner').value.trim();
    var ghRepo = document.getElementById('reg-repo').value.trim();
    var ghToken = document.getElementById('reg-token').value.trim();
    var statusEl = document.getElementById('register-status');

    // 验证字段
    var usernameErr = UserRegistry.validateUsername(username);
    if (usernameErr) {
      statusEl.textContent = usernameErr;
      statusEl.className = 'settings-status error';
      return;
    }
    if (!password) {
      statusEl.textContent = 'Please set a password';
      statusEl.className = 'settings-status error';
      return;
    }
    if (password !== passwordConfirm) {
      statusEl.textContent = 'Passwords do not match';
      statusEl.className = 'settings-status error';
      return;
    }
    if (!ghOwner || !ghRepo || !ghToken) {
      statusEl.textContent = 'Please fill in GitHub Owner, Repo and Token';
      statusEl.className = 'settings-status error';
      return;
    }

    // Step 1: 测试连接到用户自己的 GitHub 仓库
    var testConfig = { owner: ghOwner, repo: ghRepo, branch: 'main', token: ghToken };
    statusEl.textContent = 'Testing GitHub connection...';
    statusEl.className = 'settings-status loading';

    var self = this;
    var cachedOwnerConfig = null; // 缓存主人配置，避免重复弹窗

    GitHub.testConnection(testConfig).then(function() {
      // Step 2: 弹窗输入项目主人密码
      statusEl.textContent = 'Connected! Verifying owner authorization...';
      statusEl.className = 'settings-status loading';

      return new Promise(function(resolve, reject) {
        PasswordModal.show({
          title: 'Owner Verification',
          message: 'Enter the project owner password to authorize registration',
          mode: 'unlock',
          cancelText: 'Cancel',
          onOk: function(ownerPassword) {
            resolve(ownerPassword);
          },
          onCancel: function() {
            reject(new Error('Registration cancelled'));
          }
        });
      });
    }).then(function(ownerPassword) {
      // Step 3: 验证主人密码 — 获取并解密 data/config.json
      statusEl.textContent = 'Verifying owner password...';
      statusEl.className = 'settings-status loading';

      return UserRegistry.fetchUserConfigBlob(null).then(function(blobText) {
        if (!blobText) throw new Error('No owner config found in project repo');
        var encryptedObj = JSON.parse(blobText);
        return Crypto.decrypt(encryptedObj, ownerPassword).then(function(decrypted) {
          cachedOwnerConfig = JSON.parse(decrypted); // 缓存到闭包变量
          return cachedOwnerConfig;
        });
      });
    }).then(function(ownerConfig) {
      // Step 4: 检查用户名是否已存在
      statusEl.textContent = 'Checking username availability...';
      statusEl.className = 'settings-status loading';

      return UserRegistry.checkUserExists(username, ownerConfig).then(function(exists) {
        if (exists) throw new Error('Username "' + username + '" is already taken');
      });
    }).then(function() {
      // Step 5: 创建用户配置并加密
      statusEl.textContent = 'Creating account...';
      statusEl.className = 'settings-status loading';

      var userConfig = {
        owner: ghOwner,
        repo: ghRepo,
        path: 'data/plandata.json',
        branch: 'main',
        token: ghToken,
        username: username,
        role: 'user',
        registeredAt: new Date().toISOString()
      };

      return Crypto.encrypt(JSON.stringify(userConfig), password).then(function(encryptedObj) {
        return JSON.stringify(encryptedObj, null, 2);
      });
    }).then(function(encryptedJson) {
      // Step 6: 推送 users/${username}.json 到项目仓库
      statusEl.textContent = 'Registering...';
      statusEl.className = 'settings-status loading';

      return UserRegistry.registerUser(username, encryptedJson, cachedOwnerConfig);
    }).then(function() {
      // Step 7: 注册成功 → 自动登录
      statusEl.textContent = 'Registration successful!';
      statusEl.className = 'settings-status success';
      showToast('Registered as "' + username + '"!');

      // 自动登录
      setTimeout(function() {
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = password;
        self.showLoginFromRegister();
        self.handleLogin();
      }, 800);
    }).catch(function(err) {
      if (err.message === 'Registration cancelled') {
        statusEl.textContent = '';
        statusEl.className = 'settings-status';
        self.showLoginFromRegister();
        return;
      }
      statusEl.textContent = 'Registration failed: ' + (err.message || err);
      statusEl.className = 'settings-status error';
    });
  },

  // ==================== 本地模式 ====================

  /** 跳过登录，进入本地离线模式 */
  enterLocalMode: function() {
    state.isLocalMode = true;
    state.currentUser = { username: 'local', role: 'local', configPath: null };
    this.hideLoginScreen();

    // 尝试从 IndexedDB 获取句柄并加载本地数据
    var self = this;
    FileAccess.getDirHandle(null).then(function(handle) {
      if (!handle) {
        _render();
        return;
      }
      // 读取本地 config.json
      return FileAccess.readLocalFile('config.json').then(function(configText) {
        if (!configText) {
          // 无 config → 直接读本地 plandata.json
          return Storage.loadLocalPlanData().then(function(loaded) {
            if (loaded) {
              state.dataSource = 'local';
              _updateToggleUI();
            }
            _render();
          });
        }
        // 有 config → 提示输入密码（可选）
        FileAccess.updateConfigCache(configText);
        PasswordModal.show({
          title: 'Unlock GitHub Sync',
          message: 'Enter password to load data, or skip for offline mode',
          mode: 'unlock',
          cancelText: 'Skip (Offline)',
          onOk: function(password) {
            GitHub.unlock(password).then(function() {
              GitHub.fetchPlanData().then(function(data) {
                if (data) {
                  _applyRemoteData(data);
                  showToast('Loaded from GitHub!');
                } else {
                  _fallbackToLocal();
                }
              }).catch(function() {
                _fallbackToLocal();
              });
            }).catch(function() {
              showToast('Wrong password!');
              _fallbackToLocal();
            });
          },
          onCancel: function() {
            _fallbackToLocal();
          }
        });
      });
    }).catch(function() {
      _render();
    });
  },

  // ==================== 登出 ====================

  logout: function() {
    var self = this;
    showConfirm('Logout? Unsaved changes will be lost.', function(ok) {
      if (!ok) return;
      GitHub.lock();
      state.currentUser = null;
      state.dataLoaded = false;
      state.dirty = false;
      state.tags = [
        { id: 'tag_urgent', name: 'Urgent', color: '#e74c3c' },
        { id: 'tag_important', name: 'Important', color: '#e67e22' },
        { id: 'tag_normal', name: 'Normal', color: '#3498db' },
        { id: 'tag_low', name: 'Low', color: '#27ae60' }
      ];
      state.dates = {};
      Settings.close();
      _render();
      self.showLoginScreen();
    });
  }
};
