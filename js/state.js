// ==================== 状态管理 & 工具函数 ====================

var state = {
  tags: [
    { id: 'tag_urgent', name: 'Urgent', color: '#e74c3c' },
    { id: 'tag_important', name: 'Important', color: '#e67e22' },
    { id: 'tag_normal', name: 'Normal', color: '#3498db' },
    { id: 'tag_low', name: 'Low', color: '#27ae60' }
  ],
  dates: {},
  currentDate: '',
  selectedPlanSetId: null,
  dataLoaded: false,
  dirty: false
};

var confirmCallback = null;

function uid() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
}

function getCurrentDateData() {
  if (!state.dates[state.currentDate]) {
    state.dates[state.currentDate] = { planSets: [] };
  }
  return state.dates[state.currentDate];
}

function getSelectedPlanSet() {
  var data = getCurrentDateData();
  if (!state.selectedPlanSetId) return null;
  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i].id === state.selectedPlanSetId) return data.planSets[i];
  }
  return null;
}

function findPlanItem(planSetId, itemId) {
  var data = getCurrentDateData();
  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i].id === planSetId) {
      var items = data.planSets[i].items;
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === itemId) return items[j];
      }
    }
  }
  return null;
}

function findPlanSet(planSetId) {
  var data = getCurrentDateData();
  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i].id === planSetId) return data.planSets[i];
  }
  return null;
}

function getTagById(tagId) {
  for (var i = 0; i < state.tags.length; i++) {
    if (state.tags[i].id === tagId) return state.tags[i];
  }
  return null;
}

function formatDate(dateStr) {
  var parts = dateStr.split('-');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(parts[1],10)-1] + ' ' + parseInt(parts[2],10) + ', ' + parts[0];
}

function shiftDate(dateStr, days) {
  var d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth()+1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + dd;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hasAnyData() {
  return Object.keys(state.dates).length > 0;
}
