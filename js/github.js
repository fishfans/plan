// ==================== GitHub API 集成 ====================
// 基于 git_as_remote_db demo，实现文件的读取和写入
// 计划数据以 JSON 文件存储在 GitHub 仓库中

var GitHub = {

  // 内存中缓存的密码（不持久化，页面关闭即消失）
  _memoryPassword: null,
  // 解密后的配置
  _config: null,

  setMemoryPassword: function(pwd) {
    this._memoryPassword = pwd;
  },

  hasPassword: function() {
    return !!this._memoryPassword;
  },

  getConfig: function() {
    return this._config;
  },

  /** 用密码解密配置并缓存到内存 */
  unlock: function(password) {
    var self = this;
    return Storage.loadEncryptedConfig(password).then(function(config) {
      self._memoryPassword = password;
      self._config = config;
      return config;
    });
  },

  /** 构造请求头 */
  _getHeaders: function(token) {
    var t = token || (this._config && this._config.token);
    return {
      'Authorization': 'token ' + t,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  },

  /** 构造文件操作 URL */
  _getFileURL: function() {
    var c = this._config;
    return 'https://api.github.com/repos/' + c.owner + '/' + c.repo +
      '/contents/' + encodeURIComponent(c.path) + '?ref=' + c.branch;
  },

  /**
   * 测试连接（使用传入的 config，不依赖内存中的配置）
   * @param {Object} config - {owner, repo, token}
   */
  testConnection: function(config) {
    var url = 'https://api.github.com/repos/' + config.owner + '/' + config.repo;
    return fetch(url, {
      headers: {
        'Authorization': 'token ' + config.token,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(function(res) {
      if (!res.ok) return res.json().then(function(err) {
        throw new Error(err.message || 'HTTP ' + res.status);
      });
      return true;
    });
  },

  /** 获取远程文件的 SHA（用于乐观锁更新） */
  _getFileSHA: function() {
    var self = this;
    return fetch(this._getFileURL(), {
      headers: this._getHeaders()
    }).then(function(res) {
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json().then(function(data) { return data.sha; });
    }).catch(function() { return null; });
  },

  /** 从 GitHub 拉取计划数据 */
  fetchPlanData: function() {
    var self = this;
    return fetch(this._getFileURL(), {
      headers: this._getHeaders()
    }).then(function(res) {
      if (res.status === 404) return null;
      if (!res.ok) return res.json().then(function(err) {
        throw new Error(err.message || 'HTTP ' + res.status);
      });
      return res.json();
    }).then(function(data) {
      if (!data) return null;
      var content = decodeURIComponent(escape(atob(data.content)));
      return JSON.parse(content);
    });
  },

  /** 提交计划数据到 GitHub */
  submitPlanData: function() {
    var self = this;
    var planData = {
      tags: state.tags,
      dates: state.dates,
      currentDate: state.currentDate
    };
    var content = btoa(unescape(encodeURIComponent(JSON.stringify(planData, null, 2))));

    return this._getFileSHA().then(function(sha) {
      var body = {
        message: 'Update plan data - ' + new Date().toISOString().slice(0, 10),
        content: content,
        branch: self._config.branch
      };
      if (sha) body.sha = sha;

      return fetch(self._getFileURL(), {
        method: 'PUT',
        headers: self._getHeaders(),
        body: JSON.stringify(body)
      });
    }).then(function(res) {
      if (!res.ok) return res.json().then(function(err) {
        if (res.status === 409) throw new Error('SHA conflict - file was modified by others');
        throw new Error(err.message || 'HTTP ' + res.status);
      });
      return res.json();
    });
  },

  /**
   * 推送加密配置到仓库的 data/config.json
   * 用于首次设置和修改设置时
   * @param {string} encryptedJson - 加密后的 JSON 字符串
   * @param {Object} tempConfig - 临时配置 {owner, repo, branch, token}，用于首次推送时 _config 还是 null 的情况
   */
  pushConfigFile: function(encryptedJson, tempConfig) {
    var config = tempConfig || this._config;
    var url = 'https://api.github.com/repos/' + config.owner + '/' + config.repo +
      '/contents/data/config.json?ref=' + config.branch;

    var self = this;
    return fetch(url, {
      headers: this._getHeaders(config.token)
    }).then(function(res) {
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json().then(function(data) { return data.sha; });
    }).catch(function() { return null; }).then(function(sha) {
      var content = btoa(unescape(encodeURIComponent(encryptedJson)));
      var body = {
        message: 'Update config - ' + new Date().toISOString().slice(0, 10),
        content: content,
        branch: config.branch
      };
      if (sha) body.sha = sha;

      return fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + config.token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }).then(function(res) {
      if (!res.ok) return res.json().then(function(err) {
        throw new Error(err.message || 'HTTP ' + res.status);
      });
      return res.json();
    });
  },

  /** 清除内存中的配置和密码 */
  lock: function() {
    this._memoryPassword = null;
    this._config = null;
  }
};
