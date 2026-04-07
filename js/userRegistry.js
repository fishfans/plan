// ==================== 用户注册表管理 ====================
// 管理项目仓库中的用户注册信息 (users/${username}.json)
// 项目主人的配置在 data/config.json，其他用户在 users/ 目录下

var UserRegistry = {

  // ==================== 环境检测 ====================

  /** 是否通过 file:// 协议打开 */
  isLocalFile: function() {
    return location.protocol === 'file:';
  },

  /** 是否在 GitHub Pages 上运行 */
  isGitHubPages: function() {
    return location.protocol === 'https:' && location.hostname.indexOf('github.io') !== -1;
  },

  /**
   * 从 window.location 解析项目仓库信息
   * GitHub Pages URL 格式: https://{owner}.github.io/{repo}/
   * @returns {Object|null} { owner, repo, branch }
   */
  detectProjectRepo: function() {
    if (this.isLocalFile()) return null;
    var host = location.hostname;
    var path = location.pathname;
    var match = host.match(/^([^.]+)\.github\.io$/);
    if (match) {
      var repo = path.replace(/^\//, '').split('/')[0] || '';
      return { owner: match[1], repo: repo, branch: 'main' };
    }
    return null;
  },

  // ==================== 配置文件读取 ====================

  /**
   * 从项目仓库获取用户的加密配置
   * @param {string|null} username - 用户名，null 表示项目主人
   * @param {Object} [projectRepo] - 可选，显式指定项目仓库 {owner, repo, branch}
   *                                 用于 file:// 协议下注册时通过 GitHub API 获取
   * @returns {Promise<string|null>} 加密配置 JSON 字符串，404 返回 null
   */
  fetchUserConfigBlob: function(username, projectRepo) {
    var filePath = username ? ('users/' + username + '.json') : 'data/config.json';

    // 优先使用显式传入的项目仓库信息（file:// 注册场景）
    if (projectRepo && projectRepo.owner && projectRepo.repo) {
      var url = 'https://api.github.com/repos/' + projectRepo.owner + '/' + projectRepo.repo +
        '/contents/' + encodeURIComponent(filePath) + '?ref=' + (projectRepo.branch || 'main');
      console.log('[DEBUG fetchUserConfigBlob] 通过 GitHub API 获取:', url);
      return fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      }).then(function(res) {
        console.log('[DEBUG fetchUserConfigBlob] status:', res.status);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().then(function(data) {
          return decodeURIComponent(escape(atob(data.content)));
        });
      });
    }

    // GitHub Pages 同源获取（无 CORS 问题）
    if (this.isGitHubPages()) {
      return fetch(filePath).then(function(res) {
        if (!res.ok) return null;
        return res.text();
      }).catch(function() { return null; });
    }
    // 非 GitHub Pages 的 HTTPS（如自定义域名）通过 URL 检测项目仓库
    var project = this.detectProjectRepo();
    if (!project) return Promise.reject(new Error('Cannot detect project repo'));

    var url2 = 'https://api.github.com/repos/' + project.owner + '/' + project.repo +
      '/contents/' + encodeURIComponent(filePath) + '?ref=' + project.branch;

    return fetch(url2, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    }).then(function(res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().then(function(data) {
        return decodeURIComponent(escape(atob(data.content)));
      });
    });
  },

  // ==================== 用户存在检查 ====================

  /**
   * 检查用户名是否已被注册
   * @param {string} username
   * @param {Object} ownerConfig - 主人配置 { owner, repo, token, branch }
   * @returns {Promise<boolean>}
   */
  checkUserExists: function(username, ownerConfig) {
    var url = 'https://api.github.com/repos/' + ownerConfig.owner + '/' + ownerConfig.repo +
      '/contents/users/' + encodeURIComponent(username) + '.json?ref=' + ownerConfig.branch;

    return fetch(url, {
      headers: {
        'Authorization': 'token ' + ownerConfig.token,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(function(res) {
      return res.status === 200;
    }).catch(function() { return false; });
  },

  // ==================== 用户注册 ====================

  /**
   * 注册新用户：推送加密配置到项目仓库的 users/${username}.json
   * @param {string} username
   * @param {string} encryptedJson - 加密后的配置 JSON 字符串
   * @param {Object} ownerConfig - 主人配置（用于鉴权推送）
   * @returns {Promise}
   */
  registerUser: function(username, encryptedJson, ownerConfig) {
    var filePath = 'users/' + username + '.json';
    var commitMsg = 'Register user: ' + username + ' - ' + new Date().toISOString().slice(0, 10);
    return GitHub.pushFileWithTree(ownerConfig, filePath, encryptedJson, commitMsg);
  },

  // ==================== 用户名验证 ====================

  /**
   * 验证用户名格式
   * @param {string} username
   * @returns {string|null} 错误信息，null 表示合法
   */
  validateUsername: function(username) {
    if (!username) return 'Username is required';
    if (username.length < 2) return 'Username must be at least 2 characters';
    if (username.length > 32) return 'Username must be at most 32 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, _ and -';
    if (username === 'owner') return '"owner" is a reserved username';
    return null;
  }
};
