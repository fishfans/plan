// ==================== localStorage 存储管理 ====================
// 计划数据存储在 localStorage，7天过期
// GitHub 配置以加密形式存储在 js/config.json（通过 FileAccess）

var Storage = {

  PLAN_KEY: 'plan_data',         // 计划数据的 localStorage key
  EXPIRE_DAYS: 7,                // 计划数据过期天数（毫秒）

  // ==================== 计划数据 ====================

  /** 保存计划数据到 localStorage（带时间戳） */
  savePlanData: function() {
    var data = {
      tags: state.tags,
      dates: state.dates,
      currentDate: state.currentDate,
      savedAt: Date.now()
    };
    localStorage.setItem(this.PLAN_KEY, JSON.stringify(data));
    state.dirty = false;
    this._updateDirtyIndicator();
  },

  /** 从 localStorage 加载计划数据（检查过期） */
  loadPlanData: function() {
    try {
      var raw = localStorage.getItem(this.PLAN_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      // 检查是否过期
      if (data.savedAt && (Date.now() - data.savedAt) > this.EXPIRE_DAYS * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.PLAN_KEY);
        return false;
      }
      if (data.tags) state.tags = data.tags;
      if (data.dates) state.dates = data.dates;
      if (data.currentDate) state.currentDate = data.currentDate;
      state.dataLoaded = true;
      state.dirty = false;
      return true;
    } catch (e) {
      return false;
    }
  },

  /** 检查是否有缓存数据 */
  hasCachedData: function() {
    return !!localStorage.getItem(this.PLAN_KEY);
  },

  /** 清除计划数据缓存 */
  clearPlanData: function() {
    localStorage.removeItem(this.PLAN_KEY);
  },

  // ==================== 加密配置 (推送到 GitHub 仓库 data/config.json) ====================

  /**
   * 加密配置并推送到 GitHub 仓库的 data/config.json
   * @param {Object} configData - {owner, repo, path, branch, token}
   * @param {string} password - 用户密码
   */
  saveEncryptedConfig: function(configData, password) {
    return Crypto.encrypt(JSON.stringify(configData), password).then(function(encryptedObj) {
      var jsonStr = JSON.stringify(encryptedObj, null, 2);
      return GitHub.pushConfigFile(jsonStr, configData).then(function() {
        FileAccess.updateCache(jsonStr);
      });
    });
  },

  /**
   * 从已加载的加密配置中解密
   * @param {string} password - 用户密码
   */
  loadEncryptedConfig: function(password) {
    var encrypted = FileAccess.getEncryptedConfig();
    if (!encrypted) return Promise.reject('No config loaded');
    var encryptedObj;
    try {
      encryptedObj = JSON.parse(encrypted);
    } catch (e) {
      return Promise.reject('Config file is corrupted');
    }
    return Crypto.decrypt(encryptedObj, password).then(function(decrypted) {
      return JSON.parse(decrypted);
    });
  },

  /** 检查是否有已加载的加密配置 */
  hasConfig: function() {
    return FileAccess.hasConfig();
  },

  /** 清除加密配置（文件句柄 + 内存缓存） */
  clearConfig: function() {
    return FileAccess.clearHandle();
  },

  // ==================== UI 辅助 ====================

  /** 更新 Save 按钮的脏数据指示器 */
  _updateDirtyIndicator: function() {
    var btn = document.getElementById('btn-save');
    if (!btn) return;
    if (state.dirty) {
      btn.classList.add('dirty');
    } else {
      btn.classList.remove('dirty');
    }
  }
};

/** 标记数据已修改（需要保存） */
function markDirty() {
  state.dirty = true;
  Storage._updateDirtyIndicator();
}
