// ==================== 日期分页 & Change Date 弹窗 ====================

function changeDate(offset) {
  state.currentDate = shiftDate(state.currentDate, offset);
  state.selectedPlanSetId = null;
  closeTagDropdown();
  render();
}

function onDateEdit(val) {
  if (!val) return;
  state.currentDate = val;
  state.selectedPlanSetId = null;
  closeTagDropdown();
  render();
}

function copyToNextDay() {
  var data = getCurrentDateData();
  if (!data.planSets || !data.planSets.length) {
    showToast('No plan sets to copy');
    return;
  }
  var nextDate = shiftDate(state.currentDate, 1);
  if (!state.dates[nextDate]) {
    state.dates[nextDate] = { planSets: [] };
  }
  state.dates[nextDate].planSets = JSON.parse(JSON.stringify(data.planSets));
  var planSets = state.dates[nextDate].planSets;
  for (var i = 0; i < planSets.length; i++) {
    planSets[i].id = uid();
    var items = planSets[i].items || [];
    for (var j = 0; j < items.length; j++) {
      items[j].id = uid();
    }
  }
  showToast('Copied to ' + formatDate(nextDate));
}

function openChangeDateModal() {
  document.getElementById('changedate-from').textContent = formatDate(state.currentDate);
  document.getElementById('changedate-to').value = state.currentDate;
  document.getElementById('changedate-overlay').classList.add('open');
}

function closeChangeDateModal(confirmed) {
  document.getElementById('changedate-overlay').classList.remove('open');
  if (!confirmed) return;
  var newDate = document.getElementById('changedate-to').value;
  if (!newDate || newDate === state.currentDate) {
    showToast('Please select a different date');
    return;
  }
  var data = getCurrentDateData();
  if (!data.planSets || !data.planSets.length) {
    showToast('No data to move on current date');
    return;
  }
  if (!state.dates[newDate]) {
    state.dates[newDate] = { planSets: [] };
  }
  state.dates[newDate].planSets = state.dates[newDate].planSets.concat(JSON.parse(JSON.stringify(data.planSets)));
  delete state.dates[state.currentDate];
  state.currentDate = newDate;
  state.selectedPlanSetId = null;
  state.dataLoaded = true;
  render();
  showToast('Data moved to ' + formatDate(newDate));
}
