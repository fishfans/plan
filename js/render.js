// ==================== 渲染 ====================

function render() {
  renderPlanList();
  renderDateDisplay();
  updateButtons();
}

function renderPlanList() {
  var container = document.getElementById('plan-list');
  var emptyState = document.getElementById('empty-state');
  var data = getCurrentDateData();

  if (!data.planSets.length) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  data.planSets.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

  var html = '';
  for (var i = 0; i < data.planSets.length; i++) {
    var ps = data.planSets[i];
    var isSelected = ps.id === state.selectedPlanSetId;
    html += '<div class="plan-set sketch-box' + (isSelected ? ' selected' : '') + '" data-id="' + ps.id + '" draggable="true">';
    html += '<div class="plan-set-header">';
    html += '<span class="drag-handle" title="Drag to reorder">&#9776;</span>';
    html += '<span class="add-item-btn" title="Add item" data-set-id="' + ps.id + '"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg></span>';
    html += '<div class="plan-set-title" contenteditable="true" data-set-id="' + ps.id + '">' + escapeHtml(ps.title) + '</div>';
    html += '<span class="plan-set-delete" title="Delete" data-set-id="' + ps.id + '">&times;</span>';
    html += '</div>';
    html += '<div class="plan-items">';
    if (ps.items) {
      ps.items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
      for (var j = 0; j < ps.items.length; j++) {
        var item = ps.items[j];
        html += '<div class="plan-item" data-set-id="' + ps.id + '" data-item-id="' + item.id + '">';
        html += '<span class="tag-toggle" data-set-id="' + ps.id + '" data-item-id="' + item.id + '">&#9660;</span>';
        html += '<span class="plan-item-body">';
        html += '<span class="plan-item-content" contenteditable="true" data-set-id="' + ps.id + '" data-item-id="' + item.id + '">' + escapeHtml(item.content) + '</span>';
        html += '<span class="tag-container">';
        if (item.tags) {
          for (var k = 0; k < item.tags.length; k++) {
            var tag = getTagById(item.tags[k]);
            if (tag) {
              html += '<span class="tag-label" style="background:' + tag.color + '">' + escapeHtml(tag.name) + '</span>';
            }
          }
        }
        html += '</span>';
        html += '</span>';
        html += '<span class="tag-dropdown" data-set-id="' + ps.id + '" data-item-id="' + item.id + '"></span>';
        html += '<span class="plan-item-delete" title="Delete" data-set-id="' + ps.id + '" data-item-id="' + item.id + '">&times;</span>';
        html += '</div>';
      }
    }
    html += '</div>';
    html += '</div>';
  }
  container.innerHTML = html;

  bindPlanSetEvents();
}

function renderDateDisplay() {
  document.getElementById('date-display').value = state.currentDate;
}

function updateButtons() {
  // buttons always visible
}

function bindPlanSetEvents() {
  var planSets = document.querySelectorAll('.plan-set');
  for (var i = 0; i < planSets.length; i++) {
    (function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.closest('.drag-handle') || e.target.closest('.add-item-btn') || e.target.closest('.plan-set-delete')
          || e.target.closest('.tag-toggle') || e.target.closest('.plan-item-delete')
          || e.target.getAttribute('contenteditable') === 'true') return;
        state.selectedPlanSetId = el.getAttribute('data-id');
        render();
      });
    })(planSets[i]);
  }

  var titles = document.querySelectorAll('.plan-set-title');
  for (var i = 0; i < titles.length; i++) {
    (function(el) {
      el.addEventListener('blur', function() {
        var ps = findPlanSet(el.getAttribute('data-set-id'));
        if (ps) ps.title = el.textContent.trim() || 'Untitled';
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
    })(titles[i]);
  }

  var setDeletes = document.querySelectorAll('.plan-set-delete');
  for (var i = 0; i < setDeletes.length; i++) {
    (function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var setId = el.getAttribute('data-set-id');
        var ps = findPlanSet(setId);
        if (!ps) return;
        showConfirm('Delete plan set "' + ps.title + '"?', function(ok) {
          if (!ok) return;
          var data = getCurrentDateData();
          for (var i = 0; i < data.planSets.length; i++) {
            if (data.planSets[i].id === setId) { data.planSets.splice(i, 1); break; }
          }
          if (state.selectedPlanSetId === setId) state.selectedPlanSetId = null;
          render();
        });
      });
    })(setDeletes[i]);
  }

  var itemContents = document.querySelectorAll('.plan-item-content');
  for (var i = 0; i < itemContents.length; i++) {
    (function(el) {
      el.addEventListener('blur', function() {
        var item = findPlanItem(el.getAttribute('data-set-id'), el.getAttribute('data-item-id'));
        if (item) item.content = el.textContent.trim();
      });
      el.addEventListener('dblclick', function() {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          el.blur();
          addPlanItem(el.getAttribute('data-set-id'), el.getAttribute('data-item-id'));
        }
      });
    })(itemContents[i]);
  }

  var itemDeletes = document.querySelectorAll('.plan-item-delete');
  for (var i = 0; i < itemDeletes.length; i++) {
    (function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var ps = findPlanSet(el.getAttribute('data-set-id'));
        if (!ps) return;
        var itemId = el.getAttribute('data-item-id');
        for (var j = 0; j < ps.items.length; j++) {
          if (ps.items[j].id === itemId) { ps.items.splice(j, 1); break; }
        }
        render();
      });
    })(itemDeletes[i]);
  }

  var tagToggles = document.querySelectorAll('.tag-toggle');
  for (var i = 0; i < tagToggles.length; i++) {
    (function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var setId = el.getAttribute('data-set-id');
        var itemId = el.getAttribute('data-item-id');
        var item = findPlanItem(setId, itemId);
        if (!item) return;
        toggleTagDropdown(setId, itemId, el);
      });
    })(tagToggles[i]);
  }

  // Add item button (per plan set)
  var addBtns = document.querySelectorAll('.add-item-btn');
  for (var i = 0; i < addBtns.length; i++) {
    (function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        addPlanItem(el.getAttribute('data-set-id'));
      });
    })(addBtns[i]);
  }

  setupDragAndDrop();
}
