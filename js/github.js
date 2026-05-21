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
        console.error('[DEBUG pushFile] FAILED url:', url, 'status:', res.status, 'error:', err);
        if (res.status === 409) throw new Error('SHA conflict - file was modified by others');
        throw new Error(err.message || 'HTTP ' + res.status);
      });
      return res.json();
    });
  },

  /**
   * 推送文件到指定仓库路径
   * @param {Object} config - {owner, repo, branch, token}
   * @param {string} remotePath - 远程路径，如 'data/config.json' 或 'users/alice.json'
   * @param {string} content - 文件内容字符串
   * @param {string} commitMsg - 可选，提交消息
   * @returns {Promise}
   */
  pushFile: function(config, remotePath, content, commitMsg) {
    var url = 'https://api.github.com/repos/' + config.owner + '/' + config.repo +
      '/contents/' + encodeURIComponent(remotePath) + '?ref=' + config.branch;

    return fetch(url, {
      headers: {
        'Authorization': 'token ' + config.token,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(function(res) {
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json().then(function(data) { return data.sha; });
    }).catch(function() { return null; }).then(function(sha) {
      var encoded = btoa(unescape(encodeURIComponent(content)));
      var body = {
        message: commitMsg || 'Update ' + remotePath + ' - ' + new Date().toISOString().slice(0, 10),
        content: encoded,
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
        console.error('[DEBUG pushFile] FAILED url:', url, 'status:', res.status, 'error:', err);
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
    return this.pushFile(config, 'data/config.json', encryptedJson, 'Update config - ' + new Date().toISOString().slice(0, 10));
  },

  /**
   * 使用 Git Trees API 创建/更新文件（自动创建中间目录）
   * GitHub Contents API 不支持自动创建中间目录，当目录不存在时会报
   * "A requested file or directory could not be found"，此方法通过 Trees API 绕过该限制
   * @param {Object} config - {owner, repo, branch, token}
   * @param {string} remotePath - 远程路径，如 'users/alice.json'
   * @param {string} content - 文件内容字符串
   * @param {string} commitMsg - 提交消息
   * @returns {Promise}
   */
  pushFileWithTree: function(config, remotePath, content, commitMsg) {
    var self = this;
    var headers = {
      'Authorization': 'token ' + config.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    var repoUrl = 'https://api.github.com/repos/' + config.owner + '/' + config.repo;
    console.log('[DEBUG pushFileWithTree] 开始:', remotePath, '→', config.owner + '/' + config.repo, 'branch:', config.branch);

    // 先创建 blob（blob 不依赖分支状态，只需创建一次）
    return fetch(repoUrl + '/git/blobs', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ content: content, encoding: 'utf-8' })
    }).then(function(res) {
      if (!res.ok) return res.text().then(function(t) { throw new Error('Step1 failed (' + res.status + '): ' + t); });
      return res.json();
    }).then(function(blob) {
      console.log('[DEBUG pushFileWithTree] blobSha:', blob.sha);

      // 用 retry 机制推送（处理 fast-forward 冲突）
      return self._doPushWithTree(repoUrl, headers, config.branch, remotePath, blob.sha, commitMsg, 3);
    });
  },

  /**
   * @private 执行 tree+commit+push 流程，支持重试
   */
  _doPushWithTree: function(repoUrl, headers, branch, remotePath, blobSha, commitMsg, retries) {
    var self = this;

    // 1. 获取 branch ref → commit SHA → tree SHA
    return fetch(repoUrl + '/git/ref/heads/' + branch, { headers: headers })
      .then(function(res) {
        if (!res.ok) return res.text().then(function(t) { throw new Error('Ref fetch failed (' + res.status + '): ' + t); });
        return res.json();
      })
      .then(function(ref) {
        var commitSha = ref.object.sha;
        return fetch(repoUrl + '/git/commits/' + commitSha, { headers: headers })
          .then(function(res) {
            if (!res.ok) return res.text().then(function(t) { throw new Error('Commit fetch failed (' + res.status + '): ' + t); });
            return res.json();
          })
          .then(function(commit) {
            return { commitSha: commitSha, treeSha: commit.tree.sha };
          });
      })
      // 2. 创建 tree
      .then(function(data) {
        var treePayload = {
          base_tree: data.treeSha,
          tree: [{ path: remotePath, mode: '100644', type: 'blob', sha: blobSha }]
        };
        return fetch(repoUrl + '/git/trees', {
          method: 'POST', headers: headers,
          body: JSON.stringify(treePayload)
        }).then(function(res) {
          if (!res.ok) return res.text().then(function(t) { throw new Error('Tree create failed (' + res.status + '): ' + t); });
          return res.json();
        }).then(function(tree) {
          data.newTreeSha = tree.sha;
          return data;
        });
      })
      // 3. 创建 commit
      .then(function(data) {
        return fetch(repoUrl + '/git/commits', {
          method: 'POST', headers: headers,
          body: JSON.stringify({
            message: commitMsg || ('Update ' + remotePath + ' - ' + new Date().toISOString().slice(0, 10)),
            tree: data.newTreeSha,
            parents: [data.commitSha]
          })
        }).then(function(res) {
          if (!res.ok) return res.text().then(function(t) { throw new Error('Commit create failed (' + res.status + '): ' + t); });
          return res.json();
        }).then(function(commit) {
          data.newCommitSha = commit.sha;
          return data;
        });
      })
      // 4. 更新 branch ref（带重试）
      .then(function(data) {
        return fetch(repoUrl + '/git/refs/heads/' + branch, {
          method: 'PATCH', headers: headers,
          body: JSON.stringify({ sha: data.newCommitSha })
        }).then(function(res) {
          if (res.ok) return;
          if (res.status === 422 && retries > 0) {
            console.log('[DEBUG pushFileWithTree] fast-forward 冲突，重试... (剩余', retries, '次)');
            // 用新的 commitSha 重新推，blob 和 tree 不需要重建
            return self._doPushWithTree(repoUrl, headers, branch, remotePath, blobSha, commitMsg, retries - 1);
          }
          return res.text().then(function(t) { throw new Error('Ref update failed (' + res.status + '): ' + t); });
        });
      });
  },

  /** 清除内存中的配置和密码 */
  lock: function() {
    this._memoryPassword = null;
    this._config = null;
  }
};
