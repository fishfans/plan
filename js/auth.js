// ==================== 认证逻辑 ====================
// 提供登录解密、初始化、注册、登出等核心功能
// 不包含 UI，由 passwordModal 和 settings 调用

var Auth = {

  /**
   * 登录：根据用户名获取加密配置 → 解密 → 初始化应用
   * @param {string} username - 用户名（空视为主人）
   * @param {string} password - 密码
   * @returns {Promise}
   */
  login: function(username, password) {
    var isOwner = !username;

    return UserRegistry.fetchUserConfigBlob(isOwner ? null : username).then(function(blobText) {
      if (!blobText) {
        if (isOwner) throw new Error('No owner config found');
        throw new Error('User "' + username + '" not found');
      }
      return Auth._decryptAndInit(blobText, password, username, isOwner);
    });
  },

  /**
   * 解密配置并初始化应用
   * @private
   */
  _decryptAndInit: function(blobText, password, username, isOwner) {
    var encryptedObj;
    try { encryptedObj = JSON.parse(blobText); }
    catch (e) { throw new Error('Config file is corrupted'); }

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

      // 尝试恢复本地工作目录句柄
      var handleUsername = isOwner ? null : username;
      return FileAccess.getDirHandle(handleUsername).then(function(handle) {
        if (!handle) return;
        return FileAccess._ensurePermission();
      }).catch(function() {}).then(function() {
        return Auth._loadPlanData();
      });
    });
  },

  /**
   * 加载用户 GitHub 仓库中的计划数据
   * @private
   */
  _loadPlanData: function() {
    return GitHub.fetchPlanData().then(function(data) {
      if (data) {
        (window._app && window._app.applyRemoteData || applyRemoteData)(data);
        showToast('Welcome, ' + (state.currentUser ? state.currentUser.username : '') + '!');
      } else {
        if (FileAccess.hasValidHandle()) {
          return Storage.loadLocalPlanData().then(function(loaded) {
            if (loaded) {
              state.dataSource = 'local';
              (window._app && window._app.updateToggleUI || updateToggleUI)();
              showToast('No remote data. Loaded local data.');
            }
            (window._app && window._app.render || render)();
          });
        }
        (window._app && window._app.render || render)();
        showToast('No existing plan data. Start fresh!');
      }
    }).catch(function(err) {
      if (FileAccess.hasValidHandle()) {
        return Storage.loadLocalPlanData().then(function(loaded) {
          if (loaded) {
            state.dataSource = 'local';
            (window._app && window._app.updateToggleUI || updateToggleUI)();
            showToast('GitHub failed. Loaded local data.');
          }
          (window._app && window._app.render || render)();
        });
      }
      (window._app && window._app.render || render)();
      showToast('Failed to load plan data: ' + (err.message || err));
    });
  },

  // ==================== 注册 ====================

  /**
   * 在设置页面执行注册流程
   * @param {Object} regInfo - { username, password, owner, repo, token }
   * @param {string} ownerPassword - 项目主人密码
   * @returns {Promise}
   */
  register: function(regInfo, ownerPassword) {
    var username = regInfo.username;

    // 1. 验证主人密码 → 获取主人配置
    return UserRegistry.fetchUserConfigBlob(null).then(function(blobText) {
      if (!blobText) throw new Error('No owner config found in project repo');
      var encryptedObj = JSON.parse(blobText);
      return Crypto.decrypt(encryptedObj, ownerPassword).then(function(decrypted) {
        return JSON.parse(decrypted);
      });
    }).then(function(ownerConfig) {
      // 2. 检查用户名是否已存在
      return UserRegistry.checkUserExists(username, ownerConfig).then(function(exists) {
        if (exists) throw new Error('Username "' + username + '" is already taken');
        return ownerConfig;
      });
    }).then(function(ownerConfig) {
      // 3. 创建用户配置并加密
      var userConfig = {
        owner: regInfo.owner,
        repo: regInfo.repo,
        path: username + '/plandata.json',
        branch: 'main',
        token: regInfo.token,
        username: username,
        role: 'user',
        registeredAt: new Date().toISOString()
      };

      return Crypto.encrypt(JSON.stringify(userConfig), regInfo.password).then(function(encryptedObj) {
        return {
          encryptedJson: JSON.stringify(encryptedObj, null, 2),
          ownerConfig: ownerConfig
        };
      });
    }).then(function(result) {
      // 4. 推送 users/${username}.json 到项目仓库
      return UserRegistry.registerUser(username, result.encryptedJson, result.ownerConfig);
    });
  },

  // ==================== 登出 ====================

  logout: function() {
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
    (window._app && window._app.render || render)();
  }
};
