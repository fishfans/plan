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
    showToast(i18n.t('msg.noPlanSetsToCopy'));
    return;
  }
  // Filter out Finished plan set
  var setsToCopy = data.planSets.filter(function(ps) { return !ps._finished; });
  if (!setsToCopy.length) {
    showToast(i18n.t('msg.noPlanSetsToCopy'));
    return;
  }
  var nextDate = shiftDate(state.currentDate, 1);
  if (!state.dates[nextDate]) {
    state.dates[nextDate] = { planSets: [] };
  }
  state.dates[nextDate].planSets = JSON.parse(JSON.stringify(setsToCopy));
  var planSets = state.dates[nextDate].planSets;
  for (var i = 0; i < planSets.length; i++) {
    planSets[i].id = uid();
    var items = planSets[i].items || [];
    for (var j = 0; j < items.length; j++) {
      items[j].id = uid();
    }
  }
  markDirty();
  showToast(i18n.t('msg.copiedTo') + formatDate(nextDate));
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
    showToast(i18n.t('msg.selectDifferentDate'));
    return;
  }
  var data = getCurrentDateData();
  // Separate Finished and normal plan sets
  var setsToMove = data.planSets.filter(function(ps) { return !ps._finished; });
  var finishedSets = data.planSets.filter(function(ps) { return !!ps._finished; });
  if (!setsToMove.length) {
    showToast(i18n.t('msg.noDataToMove'));
    return;
  }
  if (!state.dates[newDate]) {
    state.dates[newDate] = { planSets: [] };
  }
  state.dates[newDate].planSets = state.dates[newDate].planSets.concat(JSON.parse(JSON.stringify(setsToMove)));
  // Keep Finished set on current date if it exists
  if (finishedSets.length > 0) {
    state.dates[state.currentDate].planSets = finishedSets;
  } else {
    delete state.dates[state.currentDate];
  }
  state.currentDate = newDate;
  state.selectedPlanSetId = null;
  state.dataLoaded = true;
  markDirty();
  render();
  showToast(i18n.t('msg.dataMovedTo') + formatDate(newDate));
}

function clearPage() {
  var data = getCurrentDateData();
  if (!data.planSets || !data.planSets.length) {
    showToast(i18n.t('msg.pageAlreadyEmpty'));
    return;
  }
  showConfirm(i18n.t('msg.clearConfirm'), function(ok) {
    if (!ok) return;
    state.dates[state.currentDate].planSets = [];
    state.selectedPlanSetId = null;
    markDirty();
    render();
    showToast(i18n.t('msg.pageCleared'));
  });
}
