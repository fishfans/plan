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
      e.returnValue = i18n.t('confirm.unsavedChanges');
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
      WorkPathModal.cancel();
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

  // ---- Language Toggle 按钮 ----
  document.getElementById('btn-lang-toggle').addEventListener('click', function() { i18n.toggle(); });

  // ---- Grant Access 按钮 ----
  document.getElementById('btn-grant-access').addEventListener('click', grantAccess);

  // ---- 底部日期分页 ----
  document.querySelector('[data-action="prev-date"]').addEventListener('click', function() { changeDate(-1); });
  document.getElementById('date-display').addEventListener('change', function() { onDateEdit(this.value); });
  document.querySelector('[data-action="next-date"]').addEventListener('click', function() { changeDate(1); });
  document.querySelector('[data-action="copy-day"]').addEventListener('click', copyToNextDay);
  document.querySelector('[data-action="change-date"]').addEventListener('click', openChangeDateModal);
  document.querySelector('[data-action="clear-page"]').addEventListener('click', clearPage);

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

  // ---- WorkPath 弹窗 ----
  document.getElementById('workpath-overlay').addEventListener('click', function() {
    WorkPathModal.cancel();
  });
  document.getElementById('workpath-box').addEventListener('click', function(e) {
    e.stopPropagation();
  });
  document.getElementById('workpath-select').addEventListener('click', function() {
    WorkPathModal.select();
  });
  document.getElementById('workpath-authorize').addEventListener('click', function() {
    WorkPathModal.authorize();
  });
  document.getElementById('workpath-cancel').addEventListener('click', function() {
    WorkPathModal.cancel();
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
  i18n.init(); // 初始化语言设置

  var now = new Date();
  var y = now.getFullYear();
  var m = ('0' + (now.getMonth()+1)).slice(-2);
  var d = ('0' + now.getDate()).slice(-2);
  state.currentDate = y + '-' + m + '-' + d;

  render(); // 先渲染空状态

  // ---- 登出按钮 ----
  document.getElementById('btn-logout').addEventListener('click', function() {
    showConfirm(i18n.t('confirm.logout'), function(ok) {
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
 * 1. 检测环境（localhost 本地 / https GitHub Pages）
 * 2. 本地模式：直接选择文件夹加载本地数据
 * 3. GitHub Pages 模式：弹窗输入用户名+密码，成功加载远程数据，失败提示选择本地文件夹
 */
function isLocalEnv() {
  if (location.protocol === 'file:') return true;
  var host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function startAuth() {
  state.isLocalMode = isLocalEnv();
  state.currentUser = null;

  if (state.isLocalMode) {
    // 本地模式：直接选择文件夹加载本地数据
    fallbackToLocalWithFolderSelection();
  } else {
    startWebAuth();
  }
}

function startWebAuth() {
  PasswordModal.show({
    title: i18n.t('login.title'),
    message: i18n.t('login.webMessage'),
    mode: 'unlock',
    showUsername: true,
    cancelText: i18n.t('login.cancelLocal'),
    onOk: function(password, username) {
      showToast(i18n.t('msg.loading'));
      Auth.login(username, password).catch(function(err) {
        showToast(err.message || i18n.t('login.failed'));
        // 失败后提示选择本地文件夹，加载本地数据
        fallbackToLocalWithFolderSelection();
      });
    },
    onCancel: function() {
      // 跳过 → 提示选择本地文件夹
      fallbackToLocalWithFolderSelection();
    }
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
            showToast(i18n.t('msg.loadedFromGithub'));
          } else {
            // GitHub 无数据 → 回退本地
            fallbackToLocal();
          }
        }).catch(function(err) {
          showToast(i18n.t('msg.githubFailedLoadedLocal'));
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
  btn.textContent = i18n.t('access.requesting');
  btn.disabled = true;
  FileAccess._rootDirHandle.requestPermission({ mode: 'readwrite' }).then(function(perm) {
    btn.textContent = i18n.t('access.btn');
    btn.disabled = false;
    if (perm === 'granted') {
      document.getElementById('access-prompt').style.display = 'none';
      tryLoadFromLocal();
    } else {
      showToast(i18n.t('msg.permissionDenied'));
    }
  }).catch(function() {
    btn.textContent = i18n.t('access.btn');
    btn.disabled = false;
    showToast(i18n.t('msg.connectionFailed') + 'permission');
  });
}

/** 确保工作目录句柄可用：无句柄时根据 config 中的 workDirName 提示用户选择 */
function ensureWorkDirHandle() {
  if (FileAccess.hasValidHandle()) return Promise.resolve();
  var config = GitHub.getConfig();
  var dirName = config && config.workDirName;
  if (!dirName || !window.showDirectoryPicker) return Promise.resolve();

  var handleUsername = (state.currentUser && state.currentUser.role !== 'owner')
    ? state.currentUser.username : null;

  return new Promise(function(resolve) {
    showConfirm(i18n.t('msg.selectWorkDir', { dirName: dirName }), function(ok) {
      if (!ok) { resolve(); return; }
      window.showDirectoryPicker({ mode: 'readwrite' }).then(function(handle) {
        return FileAccess.saveDirHandle(handle, handleUsername).then(function() {
          showToast(i18n.t('msg.workPathSet'));
        });
      }).then(function() { resolve(); }).catch(function(e) {
        if (e.name !== 'AbortError') showToast(i18n.t('msg.saveFailed') + e.message);
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
            showToast(i18n.t('msg.loadedFromGithub'));
          } else {
            render();
          }
        }).catch(function(err) {
          showToast(i18n.t('msg.connectionFailed') + (err.message || err));
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
    title: i18n.t('unlock.title'),
    message: i18n.t('login.webMessage'),
    mode: 'unlock',
    cancelText: i18n.t('login.cancelLocal'),
    onOk: function(password) {
      GitHub.unlock(password).then(function() {
        if (onOk) onOk();
      }).catch(function(err) {
        showToast(i18n.t('msg.wrongPassword'));
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
  // 确保 tag_done 始终存在
  if (!state.tags.some(function(t) { return t.id === 'tag_done'; })) {
    state.tags.push({ id: 'tag_done', name: 'Done', color: '#27ae60' });
  }
  state.dates = data.dates || state.dates;
  state.currentDate = data.currentDate || state.currentDate;
  state.dataLoaded = true;
  state.dirty = false;
  state.dataSource = 'remote';
  updateToggleUI();
  render();
}

/** 回退到本地工作目录数据 */
function fallbackToLocal() {
  if (!FileAccess.hasValidHandle()) {
    render();
    return;
  }
  // 先尝试加载本地 config.json 到内存缓存
  FileAccess.readLocalFile('config.json').then(function(configText) {
    if (configText) FileAccess.updateConfigCache(configText);
  }).catch(function() {}).then(function() {
    return Storage.loadLocalPlanData().then(function(loaded) {
      if (loaded) {
        state.dataSource = 'local';
        updateToggleUI();
      }
      render();
    });
  });
}

/**
 * 登录失败后：提示用户选择本地文件夹 → 加载本地数据
 * 如果已有有效句柄，直接加载本地数据
 * 如果没有，弹出 WorkPathModal 让用户选择文件夹
 */
function fallbackToLocalWithFolderSelection() {
  if (FileAccess.hasValidHandle()) {
    // 已有句柄，直接加载本地数据
    _loadConfigAndLocalData(i18n.t('msg.loginFailedUseLocal'));
  } else if (window.showDirectoryPicker) {
    // 无句柄，弹出文件夹选择弹窗
    WorkPathModal.show({
      mode: 'select',
      onSelect: function(handle) {
        // 用户选择了文件夹，加载本地数据
        _loadConfigAndLocalData(i18n.t('msg.loginFailedUseLocal'));
      },
      onCancel: function() {
        // 用户取消选择，直接渲染空状态
        render();
      }
    });
  } else {
    // 浏览器不支持目录选择 API
    showToast(i18n.t('msg.loginFailedNoLocal'));
    render();
  }
}

/** 加载本地 config.json 缓存到内存，然后加载 plandata.json */
function _loadConfigAndLocalData(successMsg) {
  FileAccess.readLocalFile('config.json').then(function(configText) {
    if (configText) FileAccess.updateConfigCache(configText);
  }).catch(function() {}).then(function() {
    return Storage.loadLocalPlanData().then(function(loaded) {
      state.dataSource = 'local';
      updateToggleUI();
      if (loaded) {
        if (successMsg) showToast(successMsg);
      } else {
        // 没有本地数据，初始化空白状态
        state.dataLoaded = true;
      }
      render();
    });
  });
}

// 暴露给 auth.js 等外部模块使用的全局函数
window._app = {
  applyRemoteData: applyRemoteData,
  fallbackToLocal: fallbackToLocal,
  fallbackToLocalWithFolderSelection: fallbackToLocalWithFolderSelection,
  updateToggleUI: updateToggleUI,
  render: render,
  showToast: showToast,
  ensureWorkDirHandle: ensureWorkDirHandle
};

// ==================== Save Local / Save Remote ====================

function handleSaveLocal() {
  if (!hasAnyData()) {
    showToast(i18n.t('msg.noDataToSave'));
    return;
  }
  if (!FileAccess.hasValidHandle()) {
    showToast(i18n.t('msg.noLocalPath'));
    return;
  }
  Storage.saveLocal().then(function() {
    showToast(i18n.t('msg.savedLocally'));
  }).catch(function(e) {
    if (e.message === 'Permission denied') {
      showToast(i18n.t('msg.permissionDenied'));
    } else {
      showToast(i18n.t('msg.saveFailed') + e.message);
    }
  });
}

function handleSaveRemote() {
  if (!hasAnyData()) {
    showToast(i18n.t('msg.noDataToSave'));
    return;
  }
  // 需要先有 GitHub 凭据
  var doSave = function() {
    if (!GitHub.hasPassword()) {
      PasswordModal.show({
        title: i18n.t('password.title'),
        message: i18n.t('login.webMessage'),
        mode: 'unlock',
        cancelText: i18n.t('login.cancelLocal'),
        onOk: function(password) {
          GitHub.unlock(password).then(function() {
            doRemoteSave();
          }).catch(function() {
            showToast(i18n.t('msg.wrongPassword'));
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
    showToast(i18n.t('msg.noGithubConfig'));
  }
}

function doRemoteSave() {
  if (FileAccess.hasValidHandle()) {
    Storage.saveRemote().then(function() {
      showToast(i18n.t('msg.savedLocalAndRemote'));
    }).catch(function(e) {
      if (!state.dirty) {
        showToast(i18n.t('msg.savedLocalPushFailed') + e.message);
      } else {
        showToast(i18n.t('msg.saveFailed') + e.message);
      }
    });
  } else {
    // 无本地路径 → 只推 GitHub
    GitHub.submitPlanData().then(function() {
      state.dirty = false;
      Storage._updateDirtyIndicator();
      showToast(i18n.t('msg.pushedToGithub'));
    }).catch(function(e) {
      showToast(i18n.t('msg.pushFailed') + e.message);
    });
  }
}

// ==================== 数据源切换 ====================

function toggleDataSource() {
  if (state.dataSource === 'remote') {
    // 切换到本地
    if (!FileAccess.hasValidHandle()) {
      // 没有本地路径，弹窗让用户选择
      _loadConfigAndLocalData(i18n.t('msg.switchedToLocal'));
      return;
    }
    Storage.loadLocalPlanData().then(function(loaded) {
      if (loaded) {
        state.dataSource = 'local';
        updateToggleUI();
        render();
        showToast(i18n.t('msg.switchedToLocal'));
      } else {
        showToast(i18n.t('msg.noLocalData'));
      }
    }).catch(function(e) {
      showToast(i18n.t('msg.saveFailed') + e.message);
    });
  } else {
    // 切换到远程
    var doSwitch = function() {
      GitHub.fetchPlanData().then(function(data) {
        if (data) {
          applyRemoteData(data);
          showToast(i18n.t('msg.switchedToRemote'));
        } else {
          showToast(i18n.t('msg.noRemoteData'));
        }
      }).catch(function(e) {
        showToast(i18n.t('msg.saveFailed') + e.message);
      });
    };

    if (!GitHub.hasPassword()) {
      PasswordModal.show({
        title: i18n.t('password.title'),
        message: i18n.t('login.webMessage'),
        mode: 'unlock',
        cancelText: i18n.t('login.cancelLocal'),
        onOk: function(password) {
          GitHub.unlock(password).then(function() { doSwitch(); })
            .catch(function(e) {
              if (e === 'No config loaded' || (e && e.message === 'No config loaded')) {
                showToast(i18n.t('msg.noLocalConfig'));
              } else {
                showToast(i18n.t('msg.wrongPassword'));
              }
            });
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
    btn.textContent = i18n.t('btn.remote');
    btn.style.background = '#e8f4fd';
    btn.style.borderColor = '#3498db';
  } else {
    btn.textContent = i18n.t('btn.local');
    btn.style.background = '#f0f8e8';
    btn.style.borderColor = '#27ae60';
  }
}
