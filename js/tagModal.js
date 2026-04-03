// ==================== 标签管理弹窗 ====================

function openTagModal() {
  renderTagList();
  document.getElementById('tag-modal-overlay').classList.add('open');
  document.getElementById('new-tag-name').value = '';
}

function closeTagModal(e) {
  if (e && e.target && !e.target.closest('#tag-modal-overlay') && !e.target.closest('.tag-modal-btns')) return;
  document.getElementById('tag-modal-overlay').classList.remove('open');
  render();
}

function renderTagList() {
  var container = document.getElementById('tag-list');
  var html = '';
  for (var i = 0; i < state.tags.length; i++) {
    var tag = state.tags[i];
    html += '<div class="tag-list-item" data-tag-id="' + tag.id + '">';
    html += '<input type="color" class="tag-color-input" value="' + tag.color + '" data-tag-id="' + tag.id + '">';
    html += '<input type="text" class="tag-name-input" value="' + escapeHtml(tag.name) + '" data-tag-id="' + tag.id + '">';
    html += '<span class="tag-remove" data-tag-id="' + tag.id + '">&times;</span>';
    html += '</div>';
  }
  if (!state.tags.length) {
    html = '<div style="text-align:center;color:#888;padding:8px;">No tags yet. Add one below!</div>';
  }
  container.innerHTML = html;
  bindTagListEvents();
}

function bindTagListEvents() {
  var colorInputs = document.querySelectorAll('#tag-list .tag-color-input');
  for (var i = 0; i < colorInputs.length; i++) {
    (function(el) {
      el.addEventListener('change', function() {
        var tag = getTagById(el.getAttribute('data-tag-id'));
        if (tag) tag.color = el.value;
        markDirty();
      });
    })(colorInputs[i]);
  }
  var nameInputs = document.querySelectorAll('#tag-list .tag-name-input');
  for (var i = 0; i < nameInputs.length; i++) {
    (function(el) {
      el.addEventListener('change', function() {
        var tag = getTagById(el.getAttribute('data-tag-id'));
        if (tag && el.value.trim()) tag.name = el.value.trim();
        markDirty();
      });
    })(nameInputs[i]);
  }
  var removeBtns = document.querySelectorAll('#tag-list .tag-remove');
  for (var i = 0; i < removeBtns.length; i++) {
    (function(el) {
      el.addEventListener('click', function() {
        removeTag(el.getAttribute('data-tag-id'));
      });
    })(removeBtns[i]);
  }
}

function addTag() {
  var nameEl = document.getElementById('new-tag-name');
  var colorEl = document.getElementById('new-tag-color');
  var name = nameEl.value.trim();
  if (!name) { showToast('Please enter a tag name'); return; }
  state.tags.push({ id: uid(), name: name, color: colorEl.value });
  nameEl.value = '';
  markDirty();
  renderTagList();
}

function removeTag(tagId) {
  for (var i = 0; i < state.tags.length; i++) {
    if (state.tags[i].id === tagId) { state.tags.splice(i, 1); break; }
  }
  var allDates = Object.keys(state.dates);
  for (var d = 0; d < allDates.length; d++) {
    var planSets = state.dates[allDates[d]].planSets;
    for (var i = 0; i < planSets.length; i++) {
      var items = planSets[i].items || [];
      for (var j = 0; j < items.length; j++) {
        if (items[j].tags) {
          var idx = items[j].tags.indexOf(tagId);
          while (idx !== -1) { items[j].tags.splice(idx, 1); idx = items[j].tags.indexOf(tagId); }
        }
      }
    }
  }
  markDirty();
  renderTagList();
}