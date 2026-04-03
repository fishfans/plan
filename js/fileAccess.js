// ==================== 配置文件读写 ====================
// 读取: fetch('data/config.json') 相对路径直接读取
// 写入: 通过 GitHub API 推送到仓库的 data/config.json（由 github.js 负责）

var FileAccess = {
  _encryptedConfig: null,  // 内存中缓存的加密配置 JSON 字符串

  /**
   * 读取 data/config.json
   * 在线(GitHub Pages)和离线(file:// 本地克隆)都能工作
   * @returns {Promise<string|null>} 加密 JSON 字符串或 null
   */
  loadConfigFile: function() {
    var self = this;
    return fetch('data/config.json').then(function(res) {
      if (res.ok) return res.text();
      return null;
    }).then(function(text) {
      if (text) {
        self._encryptedConfig = text;
      }
      return text;
    }).catch(function() {
      return null;
    });
  },

  /** 获取内存中缓存的加密配置 */
  getEncryptedConfig: function() {
    return this._encryptedConfig;
  },

  /** 检查是否有已加载的配置 */
  hasConfig: function() {
    return !!this._encryptedConfig;
  },

  /** 更新内存缓存（推送 config 到 GitHub 后调用） */
  updateCache: function(encryptedJson) {
    this._encryptedConfig = encryptedJson;
  },

  /** 清除内存缓存 */
  clearHandle: function() {
    this._encryptedConfig = null;
    return Promise.resolve();
  }
};
