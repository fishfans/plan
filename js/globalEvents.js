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
    if (state.dataLoaded && hasAnyData()) {
      e.preventDefault();
      e.returnValue = '注意确认已把编辑的内容导出!离开后系统不会保留你的更改!';
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

  // ---- 绑定底部日期分页 ----
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

  // ---- 初始化 ----
  var now = new Date();
  var y = now.getFullYear();
  var m = ('0' + (now.getMonth()+1)).slice(-2);
  var d = ('0' + now.getDate()).slice(-2);
  state.currentDate = y + '-' + m + '-' + d;
  render();
})();
