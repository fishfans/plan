// ==================== 存储管理 ====================
// 本地存储: 通过 FileAccess 句柄读写工作目录中的文件
// 远程存储: 本地保存 + GitHub API 推送

var Storage = {

  // ==================== 计划数据 ====================

  /** 保存计划数据到本地工作目录 (plandata.json) */
  saveLocal: function() {
    var data = {
      tags: state.tags,
      dates: state.dates,
      currentDate: state.currentDate,
      savedAt: Date.now()
    };
    return FileAccess.writeLocalFile('plandata.json', JSON.stringify(data, null, 2))
      .then(function() {
        state.dirty = false;
        Storage._updateDirtyIndicator();
      });
  },

  /** 保存到本地 + 推送到 GitHub */
  saveRemote: function() {
    var data = {
      tags: state.tags,
      dates: state.dates,
      currentDate: state.currentDate,
      savedAt: Date.now()
    };
    var content = JSON.stringify(data, null, 2);
    return FileAccess.writeLocalFile('plandata.json', content).then(function() {
      state.dirty = false;
      Storage._updateDirtyIndicator();
      return GitHub.submitPlanData();
    });
  },

  /** 从本地工作目录加载计划数据 */
  loadLocalPlanData: function() {
    return FileAccess.readLocalFile('plandata.json').then(function(text) {
      if (!text) return false;
      var data = JSON.parse(text);
      if (data.tags) state.tags = data.tags;
      if (data.dates) state.dates = data.dates;
      if (data.currentDate) state.currentDate = data.currentDate;
      state.dataLoaded = true;
      state.dirty = false;
      return true;
    }).catch(function() { return false; });
  },

  // ==================== 加密配置 ====================

  /**
   * 加密配置 → 写入本地 config.json → 推送到 GitHub
   * @param {Object} configData - 配置对象
   * @param {string} password - 加密密码
   * @param {Object} [options] - 可选参数
   * @param {string} [options.remotePath] - 远程路径，默认 'data/config.json'
   * @param {string} [options.localFileName] - 本地文件名，默认 'config.json'
   */
  saveEncryptedConfig: function(configData, password, options) {
    var localFile = (options && options.localFileName) || 'config.json';
    var remotePath = (options && options.remotePath) || 'data/config.json';
    return Crypto.encrypt(JSON.stringify(configData), password).then(function(encryptedObj) {
      var jsonStr = JSON.stringify(encryptedObj, null, 2);
      return FileAccess.writeLocalFile(localFile, jsonStr).then(function() {
        FileAccess.updateConfigCache(jsonStr);
        if (remotePath === 'data/config.json') {
          return GitHub.pushConfigFile(jsonStr, configData);
        }
        return GitHub.pushFile(configData, remotePath, jsonStr);
      });
    });
  },

  /** 用密码解密内存中缓存的配置 */
  loadEncryptedConfig: function(password) {
    var encrypted = FileAccess.getEncryptedConfig();
    if (!encrypted) return Promise.reject('No config loaded');
    var encryptedObj;
    try { encryptedObj = JSON.parse(encrypted); }
    catch (e) { return Promise.reject('Config file is corrupted'); }
    return Crypto.decrypt(encryptedObj, password).then(function(decrypted) {
      return JSON.parse(decrypted);
    });
  },

  hasConfig: function() {
    return FileAccess.hasConfig();
  },

  clearConfig: function() {
    return FileAccess.clearAll();
  },

  // ==================== UI 辅助 ====================

  _updateDirtyIndicator: function() {
    var btn = document.getElementById('btn-save-local');
    if (!btn) return;
    if (state.dirty) btn.classList.add('dirty');
    else btn.classList.remove('dirty');
  }
};

/** 标记数据已修改 */
function markDirty() {
  state.dirty = true;
  Storage._updateDirtyIndicator();
}
