// ==================== AES-GCM 加密/解密 (Web Crypto API) ====================
// 使用 PBKDF2 从密码派生密钥，AES-GCM 加密数据
// 无需任何外部依赖，所有现代浏览器内置支持

var Crypto = {

  /** 从密码派生 AES-256-GCM 密钥 */
  deriveKey: function(password, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    ).then(function(keyMaterial) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });
  },

  /**
   * 加密明文
   * @param {string} plaintext - 要加密的文本
   * @param {string} password - 用户密码
   * @returns {Promise<{salt, iv, data}>} base64 编码的加密数据
   */
  encrypt: function(plaintext, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var self = this;
    return this.deriveKey(password, salt).then(function(key) {
      var enc = new TextEncoder();
      return crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext)
      );
    }).then(function(ciphertext) {
      return {
        salt: self.bufToBase64(salt),
        iv: self.bufToBase64(iv),
        data: self.bufToBase64(new Uint8Array(ciphertext))
      };
    });
  },

  /**
   * 解密密文
   * @param {Object} encrypted - {salt, iv, data} base64 编码
   * @param {string} password - 用户密码
   * @returns {Promise<string>} 解密后的明文
   */
  decrypt: function(encrypted, password) {
    var salt = this.base64ToBuf(encrypted.salt);
    var iv = this.base64ToBuf(encrypted.iv);
    var data = this.base64ToBuf(encrypted.data);
    return this.deriveKey(password, salt).then(function(key) {
      return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, key, data
      );
    }).then(function(decrypted) {
      return new TextDecoder().decode(decrypted);
    });
  },

  bufToBase64: function(buf) {
    var binary = '';
    for (var i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary);
  },

  base64ToBuf: function(base64) {
    var binary = atob(base64);
    var buf = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return buf;
  }
};
