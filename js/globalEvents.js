// ==================== 全局事件 & 初始化 ====================

(function() {
  // 点击空白关闭下拉
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tag-toggle') && !e.target.closest('.tag-dropdown')) {
      closeTagDropdown();
    }
    if (!e.target.closest('.export-dropdown')) {
      closeExportMenu();
    }
  });

  // 关闭浏览器警告
  window.addEventListener('beforeunload', function(e) {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes! Are you sure you want to leave?';
    }
  });

  // ESC 关闭弹窗 & 快捷键
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeTagModal();
      closeConfirm(false);
      closeTagDropdown();
      closeExportMenu();
      closeChangeDateModal(false);
      PasswordModal.close();
      if (Settings.isOpen) Settings.close();
      return;
    }
    // Ctrl+S / Cmd+S → Save Local
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveLocal();
      return;
    }
    if (e.target.getAttribute('contenteditable') === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changeDate(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      changeDate(1);
    }
  });

  // ---- 绑定 toolbar 按钮 ----
  document.getElementById('btn-import').addEventListener('click', handleImport);
  document.getElementById('import-input').addEventListener('change', doImport);
  document.getElementById('btn-export').addEventListener('click', toggleExportMenu);
  document.querySelectorAll('#export-menu .sketch-btn')[0].addEventListener('click', exportJSON);
  document.querySelectorAll('#export-menu .sketch-btn')[1].addEventListener('click', exportZIP);
  document.getElementById('btn-add-set').addEventListener('click', addPlanSet);
  document.getElementById('btn-open-tag').addEventListener('click', openTagModal);

  // ---- Save Local / Save Remote / Toggle ----
  document.getElementById('btn-save-local').addEventListener('click', handleSaveLocal);
  document.getElementById('btn-save-remote').addEventListener('click', handleSaveRemote);
  document.getElementById('btn-toggle-source').addEventListener('click', toggleDataSource);

  // ---- Settings 按钮 ----
  document.getElementById('btn-settings').addEventListener('click', function() {
    Settings.open();
  });

  // ---- Grant Access 按钮 ----
  document.getElementById('btn-grant-access').addEventListener('click', grantAccess);

  // ---- 底部日期分页 ----
  document.querySelector('[data-action="prev-date"]').addEventListener('click', function() { changeDate(-1); });
  document.getElementById('date-display').addEventListener('change', function() { onDateEdit(this.value); });
  document.querySelector('[data-action="next-date"]').addEventListener('click', function() { changeDate(1); });
  document.querySelector('[data-action="copy-day"]').addEventListener('click', copyToNextDay);
  document.querySelector('[data-action="change-date"]').addEventListener('click', openChangeDateModal);

  // ---- Change Date 弹窗 ----
  document.getElementById('changedate-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeChangeDateModal(false);
  });
  document.getElementById('changedate-box').addEventListener('click', function(e) {
    e.stopPropagation();
  });
  document.getElementById('changedate-move').addEventListener('click', function() { closeChangeDateModal(true); });
  document.getElementById('changedate-cancel').addEventListener('click', function() { closeChangeDateModal(false); });

  // ---- Tag Modal ----
  document.getElementById('tag-modal-overlay').addEventListener('click', function(e) {
    closeTagModal(e);
  });
  document.getElementById('tag-modal').addEventListener('click', function(e) {
    e.stopPropagation();
  });
  document.getElementById('btn-tag-done').addEventListener('click', function() {
    closeTagModal();
  });
  document.getElementById('btn-add-tag').addEventListener('click', addTag);

  // ---- Confirm 弹窗 ----
  document.getElementById('confirm-overlay').addEventListener('click', function() {
    closeConfirm(false);
  });
  document.getElementById('confirm-box').addEventListener('click', function(e) {
    e.stopPropagation();
  });
  document.getElementById('confirm-yes').addEventListener('click', function() { closeConfirm(true); });
  document.getElementById('confirm-no').addEventListener('click', function() { closeConfirm(false); });

  // ---- Password 弹窗 ----
  document.getElementById('password-overlay').addEventListener('click', function() {
    PasswordModal.cancel();
  });
  document.getElementById('password-box').addEventListener('click', function(e) {
    e.stopPropagation();
  });
  document.getElementById('password-ok').addEventListener('click', function() {
    PasswordModal.ok();
  });
  document.getElementById('password-cancel').addEventListener('click', function() {
    PasswordModal.cancel();
  });
  document.getElementById('password-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') PasswordModal.ok();
  });
  document.getElementById('password-username').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('password-input').focus();
  });
  document.getElementById('password-confirm').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') PasswordModal.ok();
  });

  // ---- Settings 弹窗 ----
  document.getElementById('btn-settings-close').addEventListener('click', function() {
    Settings.close();
  });
  document.getElementById('btn-settings-test').addEventListener('click', function() {
    Settings.testConnection();
  });
  document.getElementById('btn-settings-save').addEventListener('click', function() {
    Settings.saveOrRegister();
  });
  document.getElementById('btn-settings-clear').addEventListener('click', function() {
    Settings.clearConfig();
  });
  document.getElementById('btn-settings-pickdir').addEventListener('click', function() {
    Settings.pickDir();
  });

  // ==================== 初始化 ====================
  var now = new Date();
  var y = now.getFullYear();
  var m = ('0' + (now.getMonth()+1)).slice(-2);
  var d = ('0' + now.getDate()).slice(-2);
  state.currentDate = y + '-' + m + '-' + d;

  render(); // 先渲染空状态

  // ---- 登出按钮 ----
  document.getElementById('btn-logout').addEventListener('click', function() {
    showConfirm('Logout? Unsaved changes will be lost.', function(ok) {
      if (!ok) return;
      Auth.logout();
      // 重新启动认证流程
      startAuth();
    });
  });

  // ---- 启动认证流程 ----
  startAuth();
})();

// ==================== 启动认证 ====================

/**
 * 应用启动认证流程：
 * 1. 检测环境（file:// 本地 / https GitHub Pages）
 * 2. 弹出带用户名的密码框
 * 3. 根据用户名解密对应配置 → 加载数据
 */
function startAuth() {
  state.isLocalMode = location.protocol === 'file:';
  state.currentUser = null;

  if (state.isLocalMode) {
    // 本地模式：先尝试从本地加载，失败则弹窗
    startLocalAuth();
  } else {
    // GitHub Pages 模式：弹窗输入用户名+密码
    startWebAuth();
  }
}

function startWebAuth() {
  PasswordModal.show({
    title: 'Login',
    message: 'Enter username and password to load your data',
    mode: 'unlock',
    showUsername: true,
    cancelText: 'Cancel',
    onOk: function(password, username) {
      showToast('Loading...');
      Auth.login(username, password).catch(function(err) {
        showToast(err.message || 'Login failed');
        // 失败后重新弹窗
        setTimeout(startWebAuth, 600);
      });
    },
    onCancel: function() {
      render();
    }
  });
}

function startLocalAuth() {
  // 本地模式也支持用户名输入（方便以后切换）
  PasswordModal.show({
    title: 'Login',
    message: 'Enter username and password (leave empty to skip)',
    mode: 'unlock',
    showUsername: true,
    cancelText: 'Skip (Offline)',
    onOk: function(password, username) {
      if (!username && !password) {
        // 都为空 → 直接进入离线模式
        render();
        return;
      }
      if (!username) {
        // 无用户名有密码 → 尝试作为主人本地登录
        tryLocalOwnerLogin(password);
        return;
      }
      // 有用户名 → 尝试在线登录
      showToast('Loading...');
      Auth.login(username, password).then(function() {
        // 登录成功
      }).catch(function(err) {
        showToast(err.message || 'Login failed');
        setTimeout(startLocalAuth, 600);
      });
    },
    onCancel: function() {
      // 跳过 → 离线模式
      render();
    }
  });
}

function tryLocalOwnerLogin(password) {
  FileAccess.getDirHandle(null).then(function(handle) {
    if (!handle) {
      showToast('No local work path. Use Settings to configure.');
      render();
      return;
    }
    return FileAccess.readLocalFile('config.json').then(function(configText) {
      if (!configText) {
        showToast('No local config found.');
        render();
        return;
      }
      FileAccess.updateConfigCache(configText);
      GitHub.unlock(password).then(function() {
        return GitHub.fetchPlanData().then(function(data) {
          if (data) {
            applyRemoteData(data);
            showToast('Loaded from GitHub!');
          } else {
            fallbackToLocal();
          }
        });
      }).catch(function() {
        showToast('Wrong password!');
        setTimeout(startLocalAuth, 600);
      });
    });
  }).catch(function() {
    render();
  });
}

// ==================== 数据加载流程 ====================

/** 尝试从本地工作路径加载 config → 密码 → GitHub */
function tryLoadFromLocal() {
  FileAccess.readLocalFile('config.json').then(function(configText) {
    if (configText) {
      FileAccess.updateConfigCache(configText);
      promptPasswordAndLoad(function() {
        GitHub.fetchPlanData().then(function(data) {
          if (data) {
            applyRemoteData(data);
            showToast('Loaded from GitHub!');
          } else {
            // GitHub 无数据 → 回退本地
            fallbackToLocal();
          }
        }).catch(function(err) {
          showToast('GitHub failed, loading local...');
          fallbackToLocal();
        });
      }, function() {
        // 用户跳过密码 → 本地模式
        fallbackToLocal();
      });
    } else {
      // 无 config → 直接读本地数据（不需要密码）
      fallbackToLocal();
    }
  }).catch(function(e) {
    if (e.message === 'Permission denied') {
      document.getElementById('access-prompt').style.display = 'block';
    } else {
      fallbackToLocal();
    }
  });
}

/** 授权工作目录访问权限 */
function grantAccess() {
  var btn = document.getElementById('btn-grant-access');
  btn.textContent = 'Requesting...';
  btn.disabled = true;
  FileAccess._rootDirHandle.requestPermission({ mode: 'readwrite' }).then(function(perm) {
    btn.textContent = 'Grant Workspace Access';
    btn.disabled = false;
    if (perm === 'granted') {
      document.getElementById('access-prompt').style.display = 'none';
      tryLoadFromLocal();
    } else {
      showToast('Permission denied');
    }
  }).catch(function() {
    btn.textContent = 'Grant Workspace Access';
    btn.disabled = false;
    showToast('Failed to request permission');
  });
}

/** 确保工作目录句柄可用：无句柄时根据 config 中的 workDirName 提示用户选择 */
function ensureWorkDirHandle() {
  if (FileAccess.hasValidHandle()) return Promise.resolve();
  var config = GitHub.getConfig();
  var dirName = config && config.workDirName;
  if (!dirName || !window.showDirectoryPicker) return Promise.resolve();

  return new Promise(function(resolve) {
    showConfirm('Select work directory: ' + dirName + '\n\nOK to open picker, Cancel to skip.', function(ok) {
      if (!ok) { resolve(); return; }
      window.showDirectoryPicker({ mode: 'readwrite' }).then(function(handle) {
        return FileAccess.saveDirHandle(handle).then(function() {
          showToast('Work path set!');
        });
      }).then(function() { resolve(); }).catch(function(e) {
        if (e.name !== 'AbortError') showToast('Failed: ' + e.message);
        resolve();
      });
    });
  });
}

/** GitHub Pages 回退：fetch data/config.json → 解密 → 恢复工作目录 → 加载数据 */
function tryLoadFromWeb() {
  fetch('data/config.json').then(function(res) {
    if (!res.ok) return null;
    return res.text();
  }).then(function(configText) {
    if (!configText) { render(); return; }
    FileAccess.updateConfigCache(configText);
    promptPasswordAndLoad(function() {
      // 解密成功 → 尝试恢复工作目录句柄
      ensureWorkDirHandle().then(function() {
        GitHub.fetchPlanData().then(function(data) {
          if (data) {
            applyRemoteData(data);
            showToast('Loaded from GitHub!');
          } else {
            render();
          }
        }).catch(function(err) {
          showToast('Failed to load: ' + (err.message || err));
          render();
        });
      });
    }, function() {
      render();
    });
  }).catch(function() {
    render();
  });
}

/** 弹出密码框，成功后执行 onOk 回调 */
function promptPasswordAndLoad(onOk, onCancel) {
  PasswordModal.show({
    title: 'Unlock GitHub Sync',
    message: 'Enter password to load data from GitHub',
    mode: 'unlock',
    cancelText: 'Skip (Offline)',
    onOk: function(password) {
      GitHub.unlock(password).then(function() {
        if (onOk) onOk();
      }).catch(function(err) {
        showToast('Wrong password!');
        // 允许重试
        setTimeout(function() {
          promptPasswordAndLoad(onOk, onCancel);
        }, 500);
      });
    },
    onCancel: function() {
      if (onCancel) onCancel();
    }
  });
}

/** 应用远程数据到 state 并渲染 */
function applyRemoteData(data) {
  state.tags = data.tags || state.tags;
  state.dates = data.dates || state.dates;
  state.currentDate = data.currentDate || state.currentDate;
  state.dataLoaded = true;
  state.dirty = false;
  state.dataSource = 'remote';
  // 缓存到本地
  if (FileAccess.hasValidHandle()) {
    Storage.saveLocal().catch(function() {});
  }
  updateToggleUI();
  render();
}

/** 回退到本地工作目录数据 */
function fallbackToLocal() {
  if (!FileAccess.hasValidHandle()) {
    render();
    return;
  }
  Storage.loadLocalPlanData().then(function(loaded) {
    if (loaded) {
      state.dataSource = 'local';
      updateToggleUI();
    }
    render();
  });
}

// 暴露给 auth.js 等外部模块使用的全局函数
window._app = {
  applyRemoteData: applyRemoteData,
  fallbackToLocal: fallbackToLocal,
  updateToggleUI: updateToggleUI,
  render: render,
  showToast: showToast,
  ensureWorkDirHandle: ensureWorkDirHandle
};

// ==================== Save Local / Save Remote ====================

function handleSaveLocal() {
  if (!hasAnyData()) {
    showToast('No data to save');
    return;
  }
  if (!FileAccess.hasValidHandle()) {
    showToast('No local work path configured. Click Settings.');
    return;
  }
  Storage.saveLocal().then(function() {
    showToast('Saved locally!');
  }).catch(function(e) {
    if (e.message === 'Permission denied') {
      showToast('Permission denied. Try again.');
    } else {
      showToast('Save failed: ' + e.message);
    }
  });
}

function handleSaveRemote() {
  if (!hasAnyData()) {
    showToast('No data to save');
    return;
  }
  // 需要先有 GitHub 凭据
  var doSave = function() {
    if (!GitHub.hasPassword()) {
      PasswordModal.show({
        title: 'Enter Password',
        message: 'Enter password to push to GitHub',
        mode: 'unlock',
        cancelText: 'Cancel',
        onOk: function(password) {
          GitHub.unlock(password).then(function() {
            doRemoteSave();
          }).catch(function() {
            showToast('Wrong password!');
          });
        }
      });
      return;
    }
    doRemoteSave();
  };

  if (FileAccess.hasConfig()) {
    doSave();
  } else {
    showToast('No GitHub config found. Click Settings to configure.');
  }
}

function doRemoteSave() {
  if (FileAccess.hasValidHandle()) {
    Storage.saveRemote().then(function() {
      showToast('Saved locally & pushed to GitHub!');
    }).catch(function(e) {
      if (!state.dirty) {
        showToast('Saved locally, but push failed: ' + e.message);
      } else {
        showToast('Failed: ' + e.message);
      }
    });
  } else {
    // 无本地路径 → 只推 GitHub
    GitHub.submitPlanData().then(function() {
      state.dirty = false;
      Storage._updateDirtyIndicator();
      showToast('Pushed to GitHub!');
    }).catch(function(e) {
      showToast('Push failed: ' + e.message);
    });
  }
}

// ==================== 数据源切换 ====================

function toggleDataSource() {
  if (state.dataSource === 'remote') {
    // 切换到本地
    if (!FileAccess.hasValidHandle()) {
      showToast('No local work path configured');
      return;
    }
    Storage.loadLocalPlanData().then(function(loaded) {
      if (loaded) {
        state.dataSource = 'local';
        updateToggleUI();
        render();
        showToast('Switched to local data');
      } else {
        showToast('No local data found');
      }
    }).catch(function(e) {
      showToast('Failed: ' + e.message);
    });
  } else {
    // 切换到远程
    var doSwitch = function() {
      GitHub.fetchPlanData().then(function(data) {
        if (data) {
          applyRemoteData(data);
          showToast('Switched to GitHub data');
        } else {
          showToast('No remote data yet. Use "Save Remote" to push local data.');
        }
      }).catch(function(e) {
        showToast('Failed: ' + e.message);
      });
    };

    if (!GitHub.hasPassword()) {
      PasswordModal.show({
        title: 'Enter Password',
        message: 'Enter password to load from GitHub',
        mode: 'unlock',
        cancelText: 'Cancel',
        onOk: function(password) {
          GitHub.unlock(password).then(function() { doSwitch(); })
            .catch(function() { showToast('Wrong password!'); });
        }
      });
    } else {
      doSwitch();
    }
  }
}

function updateToggleUI() {
  var btn = document.getElementById('btn-toggle-source');
  if (!btn) return;
  if (state.dataSource === 'remote') {
    btn.textContent = 'Remote';
    btn.style.background = '#e8f4fd';
    btn.style.borderColor = '#3498db';
  } else {
    btn.textContent = 'Local';
    btn.style.background = '#f0f8e8';
    btn.style.borderColor = '#27ae60';
  }
}
