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
        if (isOwner) throw new Error(i18n.t('auth.noOwnerConfig') || 'No owner config found');
        throw new Error(i18n.t('auth.userNotFound', { username: username }) || 'User "' + username + '" not found');
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
    catch (e) { throw new Error(i18n.t('auth.configCorrupted') || 'Config file is corrupted'); }

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
        if (handle) {
          // 句柄存在，弹授权确认弹窗
          return new Promise(function(resolve) {
            WorkPathModal.show({
              mode: 'authorize',
              dirName: handle.name,
              onAuthorize: function(granted) {
                if (!granted) {
                  // 权限被拒，清除内存中的无效句柄
                  FileAccess._rootDirHandle = null;
                  FileAccess._handleKey = null;
                }
                resolve();
              },
              onCancel: function() { resolve(); }
            });
          });
        }
        // IndexedDB 无句柄，弹说明弹窗让用户选择
        return new Promise(function(resolve) {
          if (!window.showDirectoryPicker) { resolve(); return; }
          WorkPathModal.show({
            mode: 'select',
            onSelect: function(pickedHandle) {
              showToast(i18n.t('msg.workPathSet') + pickedHandle.name);
              resolve();
            },
            onCancel: function() { resolve(); }
          });
        });
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
        showToast(i18n.t('msg.welcome') + (state.currentUser ? state.currentUser.username : '') + '!');
      } else {
        if (FileAccess.hasValidHandle()) {
          return Storage.loadLocalPlanData().then(function(loaded) {
            if (loaded) {
              state.dataSource = 'local';
              (window._app && window._app.updateToggleUI || updateToggleUI)();
              showToast(i18n.t('msg.noRemoteDataLoadedLocal'));
            }
            (window._app && window._app.render || render)();
          });
        }
        (window._app && window._app.render || render)();
        showToast(i18n.t('msg.startFresh'));
      }
    }).catch(function(err) {
      if (FileAccess.hasValidHandle()) {
        return Storage.loadLocalPlanData().then(function(loaded) {
          if (loaded) {
            state.dataSource = 'local';
            (window._app && window._app.updateToggleUI || updateToggleUI)();
            showToast(i18n.t('msg.githubFailedLoadedLocal'));
          }
          (window._app && window._app.render || render)();
        });
      }
      (window._app && window._app.render || render)();
      showToast(i18n.t('msg.failedToLoad') + (err.message || err));
    });
  },

  // ==================== 注册 ====================

  /**
   * 主人注册：生成 config.json → 保存本地 → 推送到远程 data/config.json
   * @param {Object} regInfo - { owner, repo, token, branch }
   * @param {string} password - 主人密码
   * @returns {Promise}
   */
  registerOwner: function(regInfo, password) {
    var ownerConfig = {
      owner: regInfo.owner,
      repo: regInfo.repo,
      path: 'data/plandata.json',
      branch: regInfo.branch || 'main',
      token: regInfo.token,
      username: 'owner',
      role: 'owner',
      workDirName: regInfo.workDirName || null,
      registeredAt: new Date().toISOString()
    };

    // 加密
    return Crypto.encrypt(JSON.stringify(ownerConfig), password).then(function(encryptedObj) {
      var encryptedJson = JSON.stringify(encryptedObj, null, 2);

      // 保存到本地工作路径 config.json
      return FileAccess.writeLocalFile('config.json', encryptedJson).then(function() {
        FileAccess.updateConfigCache(encryptedJson);

        // 推送到远程 data/config.json
        var repoConfig = {
          owner: regInfo.owner,
          repo: regInfo.repo,
          branch: regInfo.branch || 'main',
          token: regInfo.token
        };
        return GitHub.pushFile(repoConfig, 'data/config.json', encryptedJson, 'Owner registration');
      });
    });
  },

  /**
   * 普通用户注册第一步：生成 config.json → 保存本地 → 推送到用户仓库 username/config.json
   * @param {Object} regInfo - { username, owner, repo, token, branch }
   * @param {string} password - 用户密码
   * @returns {Promise<string>} 返回 encryptedJson，供第二步使用
   */
  registerUserStep1: function(regInfo, password) {
    var username = regInfo.username;

    var userConfig = {
      owner: regInfo.owner,
      repo: regInfo.repo,
      path: username + '/plandata.json',
      branch: regInfo.branch || 'main',
      token: regInfo.token,
      username: username,
      role: 'user',
      workDirName: regInfo.workDirName || null,
      registeredAt: new Date().toISOString()
    };

    return Crypto.encrypt(JSON.stringify(userConfig), password).then(function(encryptedObj) {
      var encryptedJson = JSON.stringify(encryptedObj, null, 2);

      // 保存到本地工作路径 config.json
      return FileAccess.writeLocalFile('config.json', encryptedJson).then(function() {
        FileAccess.updateConfigCache(encryptedJson);

        // 推送到用户仓库 username/config.json
        var repoConfig = {
          owner: regInfo.owner,
          repo: regInfo.repo,
          branch: regInfo.branch || 'main',
          token: regInfo.token
        };
        return GitHub.pushFileWithTree(repoConfig, username + '/config.json', encryptedJson,
          'Register user: ' + username);
      }).then(function() {
        return encryptedJson;
      });
    });
  },

  /**
   * 普通用户注册第二步：获取主人配置 → 验证主人密码 → 推送用户配置到项目仓库 users/username.json
   * @param {Object} regInfo - { username, owner, repo, token, branch }
   * @param {string} ownerPassword - 主人密码
   * @param {string} encryptedJson - 第一步生成的加密配置 JSON
   * @returns {Promise}
   */
  registerUserStep2: function(regInfo, ownerPassword, encryptedJson) {
    var username = regInfo.username;

    // 1. 获取主人配置
    return UserRegistry.fetchUserConfigBlob(null).then(function(blobText) {
      if (!blobText) throw new Error(i18n.t('auth.noOwnerConfig') || 'No owner config found');
      var encryptedObj = JSON.parse(blobText);
      // 2. 用主人密码解密验证
      return Crypto.decrypt(encryptedObj, ownerPassword).then(function(decrypted) {
        var ownerConfig = JSON.parse(decrypted);
        return ownerConfig;
      });
    }).then(function(ownerConfig) {
      // 3. 检查用户名是否已存在
      return UserRegistry.checkUserExists(username, ownerConfig).then(function(exists) {
        if (exists) throw new Error(i18n.t('auth.usernameTaken', { username: username }) || 'Username "' + username + '" is already taken');
        return ownerConfig;
      });
    }).then(function(ownerConfig) {
      // 4. 推送 users/${username}.json 到项目仓库
      var safeOwnerConfig = {
        owner: ownerConfig.owner,
        repo: ownerConfig.repo,
        branch: ownerConfig.branch || 'main',
        token: ownerConfig.token
      };
      return UserRegistry.registerUser(username, encryptedJson, safeOwnerConfig);
    });
  },

  // ==================== 登出 ====================

  logout: function() {
    GitHub.lock();
    FileAccess.clearAll();
    state.currentUser = null;
    state.dataLoaded = false;
    state.dirty = false;
    state.tags = [
      { id: 'tag_done', name: 'Done', color: '#27ae60' }
    ];
    state.dates = {};
    Settings.close();
    (window._app && window._app.render || render)();
  }
};
