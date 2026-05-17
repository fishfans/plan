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
    html += '<div class="tag-option" style="color:#888;">No tags. Click "+ Item Tag" to add.</div>';
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

        // Done tag: mark item as done and move to Finished set (irreversible)
        if (tagId === 'tag_done') {
          if (it.tags.indexOf(tagId) !== -1) {
            // Already done, cannot undo
            render();
            return;
          }
          markItemDone(sId, iId);
          return;
        }

        var idx = it.tags.indexOf(tagId);
        if (idx !== -1) { it.tags.splice(idx, 1); }
        else { it.tags.push(tagId); }
        markDirty();
        render();
      });
    })(options[i]);
  }
}

/**
 * Mark an item as done: record timestamp, remove from current set, move to Finished set
 */
function markItemDone(planSetId, itemId) {
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
      order: 9999,
      _finished: true,
      items: []
    };
    data.planSets.push(finishedSet);
  }

  doneItem.order = finishedSet.items.length;
  finishedSet.items.push(doneItem);

  markDirty();
  render();
  showToast('Marked as done!');
}

function closeTagDropdown() {
  if (activeTagDropdown) {
    activeTagDropdown.el.classList.remove('open');
    activeTagDropdown = null;
  }
}
