// ==================== CRUD 操作 ====================

function handleImport() {
  document.getElementById('import-input').click();
}

function doImport(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var imported = JSON.parse(ev.target.result);
      if (imported.tags) state.tags = imported.tags;
      // 确保 tag_done 始终存在
      if (!state.tags.some(function(t) { return t.id === 'tag_done'; })) {
        state.tags.push({ id: 'tag_done', name: 'Done', color: '#27ae60' });
      }
      if (imported.dates) state.dates = imported.dates;
      if (imported.currentDate) state.currentDate = imported.currentDate;
      state.dataLoaded = true;
      state.selectedPlanSetId = null;
      markDirty();
      render();
      showToast(i18n.t('msg.imported'));
    } catch(err) {
      showToast(i18n.t('msg.invalidJSON'));
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function addPlanSet() {
  var data = getCurrentDateData();
  var ps = {
    id: uid(),
    title: i18n.t('plan.newPlan'),
    order: 0,
    items: [
      { id: uid(), content: i18n.t('plan.newItem'), order: 0, tags: [] }
    ]
  };
  // Insert after Finished plan set to keep Finished at the top
  var insertIdx = 0;
  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i]._finished) {
      insertIdx = i + 1;
      break;
    }
  }
  data.planSets.splice(insertIdx, 0, ps);
  for (var i = 0; i < data.planSets.length; i++) {
    data.planSets[i].order = i;
  }
  state.selectedPlanSetId = ps.id;
  state.dataLoaded = true;
  markDirty();
  render();
}

// planSetId: 必填，在哪个 plan set 下新增
// insertAfterItemId: 可选，在该 item 下方插入；不传则追加到末尾
function addPlanItem(planSetId, insertAfterItemId) {
  var ps = findPlanSet(planSetId);
  if (!ps) return;
  if (!ps.items) ps.items = [];
  var newId = uid();
  var newItem = { id: newId, content: i18n.t('plan.newItem'), tags: [] };
  if (insertAfterItemId) {
    var insertIdx = -1;
    for (var j = 0; j < ps.items.length; j++) {
      if (ps.items[j].id === insertAfterItemId) { insertIdx = j + 1; break; }
    }
    if (insertIdx === -1) insertIdx = ps.items.length;
    ps.items.splice(insertIdx, 0, newItem);
  } else {
    ps.items.push(newItem);
  }
  // 重新编号 order
  for (var i = 0; i < ps.items.length; i++) {
    ps.items[i].order = i;
  }
  markDirty();
  render();
  // 聚焦到新 item
  var newEl = document.querySelector('.plan-item-content[data-item-id="' + newId + '"]');
  if (newEl) {
    newEl.focus();
    var range = document.createRange();
    range.selectNodeContents(newEl);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
