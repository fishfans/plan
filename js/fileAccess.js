// ==================== 文件访问 & IndexedDB 句柄管理 ====================
// 本地工作路径的句柄存储在 IndexedDB（7天过期）
// 通过句柄读写本地文件（config.json / plandata.json）

var FileAccess = {
  _rootDirHandle: null,    // 内存中缓存的工作目录句柄
  _encryptedConfig: null,  // 内存中缓存的加密配置 JSON 字符串
  _DB_NAME: 'PlanAppDB',
  _DB_STORE: 'appData',
  _EXPIRE_DAYS: 7,

  // ==================== IndexedDB ====================

  _openDB: function() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(this._DB_NAME, 1);
      req.onupgradeneeded = function(e) {
        e.target.result.createObjectStore(this._DB_STORE);
      }.bind(this);
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function() { reject(req.error); };
    }.bind(this));
  },

  /** 保存工作目录句柄到 IndexedDB（含时间戳，7天过期）
   * @param {FileSystemDirectoryHandle} handle
   * @param {string} [username] - 用户名，用于多用户区分句柄
   */
  saveDirHandle: function(handle, username) {
    this._rootDirHandle = handle;
    var key = username ? ('dirHandle_' + username) : 'dirHandle';
    return this._openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(this._DB_STORE, 'readwrite');
        tx.objectStore(this._DB_STORE).put({
          handle: handle,
          savedAt: Date.now()
        }, key);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      }.bind(this));
    }.bind(this));
  },

  /** 从 IndexedDB 恢复工作目录句柄（检查过期）
   * @param {string} [username] - 用户名，用于多用户区分句柄
   */
  getDirHandle: function(username) {
    if (this._rootDirHandle) return Promise.resolve(this._rootDirHandle);
    var key = username ? ('dirHandle_' + username) : 'dirHandle';
    return this._openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(this._DB_STORE, 'readonly');
        var getReq = tx.objectStore(this._DB_STORE).get(key);
        getReq.onsuccess = function() {
          var record = getReq.result;
          if (!record) { resolve(null); return; }
          if (Date.now() - record.savedAt > this._EXPIRE_DAYS * 24 * 60 * 60 * 1000) {
            // 过期，清除
            var tx2 = db.transaction(this._DB_STORE, 'readwrite');
            tx2.objectStore(this._DB_STORE).delete(key);
            resolve(null);
            return;
          }
          this._rootDirHandle = record.handle;
          resolve(record.handle);
        }.bind(this);
        getReq.onerror = function() { reject(getReq.error); };
      }.bind(this));
    }.bind(this));
  },

  /** 检查是否有有效的工作目录句柄 */
  hasValidHandle: function() {
    return !!this._rootDirHandle;
  },

  // ==================== 权限管理 ====================

  /** 确保拥有读写权限（无权限时自动 requestPermission） */
  _ensurePermission: function() {
    if (!this._rootDirHandle) return Promise.resolve(false);
    return this._rootDirHandle.queryPermission({ mode: 'readwrite' }).then(function(perm) {
      if (perm === 'granted') return true;
      return this._rootDirHandle.requestPermission({ mode: 'readwrite' }).then(function(p) {
        return p === 'granted';
      });
    }.bind(this)).catch(function() { return false; });
  },

  // ==================== 本地文件读写 ====================

  /** 从工作目录读取文件 */
  readLocalFile: function(fileName) {
    var self = this;
    return this._ensurePermission().then(function(granted) {
      if (!granted) return Promise.reject(new Error('Permission denied'));
      return self._rootDirHandle.getFileHandle(fileName).then(function(fh) {
        return fh.getFile();
      }).then(function(file) {
        return file.text();
      });
    });
  },

  /** 写入文件到工作目录 */
  writeLocalFile: function(fileName, content) {
    var self = this;
    return this._ensurePermission().then(function(granted) {
      if (!granted) return Promise.reject(new Error('Permission denied'));
      return self._rootDirHandle.getFileHandle(fileName, { create: true }).then(function(fh) {
        return fh.createWritable();
      }).then(function(writable) {
        return writable.write(content).then(function() { return writable.close(); });
      });
    });
  },

  // ==================== 加密配置缓存 ====================

  getEncryptedConfig: function() {
    return this._encryptedConfig;
  },

  hasConfig: function() {
    return !!this._encryptedConfig;
  },

  updateConfigCache: function(json) {
    this._encryptedConfig = json;
  },

  /** 清除所有缓存和 IndexedDB 句柄 */
  clearAll: function(username) {
    this._rootDirHandle = null;
    this._encryptedConfig = null;
    var keysToDelete = username
      ? ['dirHandle', 'dirHandle_' + username]
      : ['dirHandle'];
    return this._openDB().then(function(db) {
      return new Promise(function(resolve) {
        var tx = db.transaction(this._DB_STORE, 'readwrite');
        var store = tx.objectStore(this._DB_STORE);
        keysToDelete.forEach(function(key) { store.delete(key); });
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { resolve(); };
      }.bind(this));
    }.bind(this)).catch(function() {});
  }
};
