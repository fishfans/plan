// ==================== 标签下拉 ====================

var activeTagDropdown = null;

function toggleTagDropdown(setId, itemId, anchorEl) {
  closeTagDropdown();

  var item = findPlanItem(setId, itemId);
  if (!item) return;
  if (!item.tags) item.tags = [];

  var dropdown = document.querySelector('.tag-dropdown[data-set-id="' + setId + '"][data-item-id="' + itemId + '"]');
  if (!dropdown) return;

  var html = '';
  for (var i = 0; i < state.tags.length; i++) {
    var tag = state.tags[i];
    var checked = item.tags.indexOf(tag.id) !== -1;
    html += '<div class="tag-option" data-tag-id="' + tag.id + '" data-set-id="' + setId + '" data-item-id="' + itemId + '">';
    html += '<span class="tag-dot" style="background:' + tag.color + '"></span>';
    html += escapeHtml(tag.name);
    html += '<span class="check">' + (checked ? '&#10003;' : '') + '</span>';
    html += '</div>';
  }
  if (!state.tags.length) {
    html += '<div class="tag-option" style="color:#888;">' + i18n.t('tagModal.empty') + '</div>';
  }
  dropdown.innerHTML = html;
  dropdown.classList.add('open');
  activeTagDropdown = { planSetId: setId, planItemId: itemId, el: dropdown };

  var rect = anchorEl.getBoundingClientRect();
  dropdown.style.left = rect.left + 'px';
  dropdown.style.top = (rect.bottom + 2) + 'px';

  // 如果下拉框超出视口底部，改为向上展开
  requestAnimationFrame(function() {
    var dropRect = dropdown.getBoundingClientRect();
    if (dropRect.bottom > window.innerHeight) {
      dropdown.style.top = Math.max(0, rect.top - dropRect.height - 2) + 'px';
    }
  });

  var options = dropdown.querySelectorAll('.tag-option[data-tag-id]');
  for (var i = 0; i < options.length; i++) {
    (function(opt) {
      opt.addEventListener('click', function(e) {
        e.stopPropagation();
        var tagId = opt.getAttribute('data-tag-id');
        var sId = opt.getAttribute('data-set-id');
        var iId = opt.getAttribute('data-item-id');
        var it = findPlanItem(sId, iId);
        if (!it) return;
        if (!it.tags) it.tags = [];

        // Done tag: mark item as done and move to Finished set
        if (tagId === 'tag_done') {
          if (it.tags.indexOf(tagId) !== -1) {
            // Already done, cannot re-mark
            closeTagDropdown();
            return;
          }
          markItemDone(sId, iId);
          return;
        }

        var idx = it.tags.indexOf(tagId);
        if (idx !== -1) { it.tags.splice(idx, 1); }
        else { it.tags.push(tagId); }
        markDirty();
        closeTagDropdown();
        render();
      });
    })(options[i]);
  }
}

/**
 * Mark an item as done: record timestamp, remove from current set, move to Finished set
 */
function markItemDone(planSetId, itemId) {
  closeTagDropdown();
  var data = getCurrentDateData();
  var sourceSet = null;
  var sourceIdx = -1;
  var itemIdx = -1;
  var doneItem = null;

  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i].id === planSetId) {
      sourceSet = data.planSets[i];
      sourceIdx = i;
      for (var j = 0; j < sourceSet.items.length; j++) {
        if (sourceSet.items[j].id === itemId) {
          doneItem = sourceSet.items[j];
          itemIdx = j;
          break;
        }
      }
      break;
    }
  }

  if (!doneItem) return;

  // Store source plan set id for undo
  doneItem._sourcePlanSetId = planSetId;

  // Record done timestamp and tag
  doneItem.doneAt = new Date().toISOString();
  doneItem.tags = ['tag_done'];

  // Remove from source set
  sourceSet.items.splice(itemIdx, 1);
  // Remove empty source set if no items left
  if (sourceSet.items.length === 0) {
    data.planSets.splice(sourceIdx, 1);
    if (state.selectedPlanSetId === planSetId) state.selectedPlanSetId = null;
  }

  // Find or create "Finished" plan set
  var finishedSet = null;
  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i]._finished) {
      finishedSet = data.planSets[i];
      break;
    }
  }
  if (!finishedSet) {
    finishedSet = {
      id: uid(),
      title: 'Finished',
      order: -1,
      _finished: true,
      items: []
    };
    data.planSets.unshift(finishedSet);
  }

  doneItem.order = finishedSet.items.length;
  finishedSet.items.push(doneItem);

  markDirty();
  render();
  showToast(i18n.t('msg.markedAsDone'));
}

/**
 * Undo a done item: move it back to its original plan set
 */
function undoItemDone(finishedSetId, itemId, sourceSetId) {
  var data = getCurrentDateData();

  // Find the finished set and item
  var finishedSet = null;
  var finishedIdx = -1;
  for (var i = 0; i < data.planSets.length; i++) {
    if (data.planSets[i].id === finishedSetId) {
      finishedSet = data.planSets[i];
      finishedIdx = i;
      break;
    }
  }
  if (!finishedSet) return;

  var itemIdx = -1;
  var undoneItem = null;
  for (var j = 0; j < finishedSet.items.length; j++) {
    if (finishedSet.items[j].id === itemId) {
      undoneItem = finishedSet.items[j];
      itemIdx = j;
      break;
    }
  }
  if (!undoneItem) return;

  // Remove done state
  delete undoneItem.doneAt;
  delete undoneItem._sourcePlanSetId;
  // Remove tag_done from tags
  if (undoneItem.tags) {
    var doneIdx = undoneItem.tags.indexOf('tag_done');
    if (doneIdx !== -1) undoneItem.tags.splice(doneIdx, 1);
  }

  // Remove from finished set
  finishedSet.items.splice(itemIdx, 1);

  // If source set exists, add item back there
  var targetSet = null;
  if (sourceSetId) {
    for (var i = 0; i < data.planSets.length; i++) {
      if (data.planSets[i].id === sourceSetId) {
        targetSet = data.planSets[i];
        break;
      }
    }
  }

  if (targetSet) {
    undoneItem.order = targetSet.items.length;
    targetSet.items.push(undoneItem);
  } else {
    // Source set no longer exists, create a new one
    var newSet = {
      id: uid(),
      title: i18n.t('plan.newPlan'),
      order: 0,
      items: [undoneItem]
    };
    undoneItem.order = 0;
    // Insert after Finished set
    var insertIdx = 0;
    for (var i = 0; i < data.planSets.length; i++) {
      if (data.planSets[i]._finished) {
        insertIdx = i + 1;
        break;
      }
    }
    data.planSets.splice(insertIdx, 0, newSet);
    for (var i = 0; i < data.planSets.length; i++) {
      data.planSets[i].order = i;
    }
  }

  // Remove finished set if empty
  if (finishedSet.items.length === 0) {
    data.planSets.splice(finishedIdx, 1);
  }

  // Re-order finished set items
  if (finishedSet.items.length > 0) {
    for (var i = 0; i < finishedSet.items.length; i++) {
      finishedSet.items[i].order = i;
    }
  }

  markDirty();
  render();
  showToast(i18n.t('finished.undoDone') || 'Undone!');
}

function closeTagDropdown() {
  if (activeTagDropdown) {
    activeTagDropdown.el.classList.remove('open');
    activeTagDropdown = null;
  }
}
