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
      if (imported.dates) state.dates = imported.dates;
      if (imported.currentDate) state.currentDate = imported.currentDate;
      state.dataLoaded = true;
      state.selectedPlanSetId = null;
      render();
      showToast('Imported successfully!');
    } catch(err) {
      showToast('Invalid JSON file!');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function addPlanSet() {
  var data = getCurrentDateData();
  var ps = {
    id: uid(),
    title: 'New Plan',
    order: 0,
    items: [
      { id: uid(), content: 'New Item', order: 0, tags: [] }
    ]
  };
  data.planSets.unshift(ps);
  for (var i = 0; i < data.planSets.length; i++) {
    data.planSets[i].order = i;
  }
  state.selectedPlanSetId = ps.id;
  state.dataLoaded = true;
  render();
}

// planSetId: 必填，在哪个 plan set 下新增
// insertAfterItemId: 可选，在该 item 下方插入；不传则追加到末尾
function addPlanItem(planSetId, insertAfterItemId) {
  var ps = findPlanSet(planSetId);
  if (!ps) return;
  if (!ps.items) ps.items = [];
  var newId = uid();
  var newItem = { id: newId, content: 'New Item', tags: [] };
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
