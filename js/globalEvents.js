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

  // 关闭浏览器警告（仅在数据有修改且未保存时）
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
    // Ctrl+S / Cmd+S 快捷保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
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

  // ---- Save / Submit 按钮 ----
  document.getElementById('btn-save').addEventListener('click', handleSave);
  document.getElementById('btn-submit').addEventListener('click', handleSubmit);

  // ---- Settings 按钮 ----
  document.getElementById('btn-settings').addEventListener('click', function() {
    Settings.open();
  });

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
    Settings.save();
  });
  document.getElementById('btn-settings-clear').addEventListener('click', function() {
    Settings.clearConfig();
  });

  // ---- 初始化 ----
  var now = new Date();
  var y = now.getFullYear();
  var m = ('0' + (now.getMonth()+1)).slice(-2);
  var d = ('0' + now.getDate()).slice(-2);
  state.currentDate = y + '-' + m + '-' + d;

  // 1. 尝试从 localStorage 加载缓存数据
  Storage.loadPlanData();
  render();

  // 2. 异步尝试加载 config.json
  FileAccess.loadConfigFile().then(function(configText) {
    if (configText) {
      // 配置文件存在 → 弹窗让用户输入密码以解锁并加载远程数据
      tryUnlockAndLoad();
    }
    // 否则静默进入离线模式
  });
})();

// ==================== Save / Submit 处理 ====================

/** 保存到 localStorage */
function handleSave() {
  if (!hasAnyData()) {
    showToast('No data to save');
    return;
  }
  Storage.savePlanData();
  showToast('Saved!');
}

/** 提交到 GitHub */
function handleSubmit() {
  if (!hasAnyData()) {
    showToast('No data to submit');
    return;
  }

  // 确保配置已加载
  var self = this;
  var doSubmitWithConfig = function() {
    // 如果内存中没有密码，需要先输入密码解锁
    if (!GitHub.hasPassword()) {
      PasswordModal.show({
        title: 'Enter Password',
        message: 'Enter password to submit to GitHub',
        mode: 'unlock',
        cancelText: 'Cancel',
        onOk: function(password) {
          GitHub.unlock(password).then(function() {
            doSubmit();
          }).catch(function() {
            showToast('Wrong password!');
          });
        }
      });
      return;
    }
    doSubmit();
  };

  // 检查是否需要先加载配置
  if (FileAccess.hasConfig()) {
    doSubmitWithConfig();
  } else {
    // 配置还没加载，尝试重新加载
    FileAccess.loadConfigFile().then(function(text) {
      if (text) {
        doSubmitWithConfig();
      } else {
        showToast('No GitHub config found. Click Settings to configure.');
      }
    });
  }
}

/** 执行 GitHub 提交 */
function doSubmit() {
  showToast('Submitting to GitHub...');
  GitHub.submitPlanData().then(function() {
    state.dirty = false;
    Storage._updateDirtyIndicator();
    // 提交成功后也更新 localStorage 缓存
    Storage.savePlanData();
    showToast('Submitted to GitHub!');
  }).catch(function(e) {
    showToast('Submit failed: ' + e.message);
  });
}

/** 页面加载时尝试解锁并从 GitHub 加载数据 */
function tryUnlockAndLoad() {
  PasswordModal.show({
    title: 'Unlock GitHub Sync',
    message: 'Enter password to load data from GitHub',
    mode: 'unlock',
    cancelText: 'Skip',
    onOk: function(password) {
      GitHub.unlock(password).then(function(config) {
        showToast('Unlocked! Loading from GitHub...');
        return GitHub.fetchPlanData();
      }).then(function(data) {
        if (data) {
          // 远程数据覆盖本地
          state.tags = data.tags || state.tags;
          state.dates = data.dates || state.dates;
          state.currentDate = data.currentDate || state.currentDate;
          state.dataLoaded = true;
          state.dirty = false;
          // 缓存到 localStorage
          Storage.savePlanData();
          render();
          showToast('Loaded from GitHub!');
        } else {
          showToast('No remote data found, using local cache');
        }
      }).catch(function(err) {
        showToast('Failed to load: ' + (err.message || err));
        // 密码错误，允许重试
        setTimeout(function() {
          tryUnlockAndLoad();
        }, 500);
      });
    }
  });
}
