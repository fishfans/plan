// ==================== Plan Item 拖拽排序 (Continuous Swap) ====================
// 双击 plan-item 后出现拖拽手柄，拖拽手柄按住即可拖拽，逻辑与 plan set 完全一致

var itemDragState = {
  active: false,
  draggedEl: null,
  draggedOrigIndex: -1,
  draggedElHeight: 0,
  startY: 0,
  planSetId: null,
  itemId: null,
  allowDrag: false
};

function setupItemDragAndDrop() {
  var items = document.querySelectorAll('.plan-set:not(.finished-set) .plan-item');
  for (var i = 0; i < items.length; i++) {
    (function(el) {
      var handle = el.querySelector('.item-drag-handle');
      var content = el.querySelector('.plan-item-content');

      // 双击显示拖拽手柄
      if (content) {
        content.addEventListener('dblclick', function(e) {
          e.preventDefault();
          e.stopPropagation();
          // 显示这个 item 的拖拽手柄
          showItemDragHandle(el);
        });
      }

      // 如果已有拖拽手柄，绑定事件
      if (handle) {
        handle.addEventListener('mousedown', function(e) {
          itemDragState.allowDrag = true;
          itemDragState.startY = e.clientY;
          var planSet = el.closest('.plan-set');
          itemDragState.planSetId = planSet ? planSet.getAttribute('data-id') : null;
          itemDragState.itemId = el.getAttribute('data-item-id');
        });
      }

      // dragstart - 只有 allowDrag 时才允许拖拽
      el.addEventListener('dragstart', function(e) {
        if (!itemDragState.allowDrag) {
          e.preventDefault();
          return;
        }

        var itemsContainer = el.closest('.plan-items');
        if (!itemsContainer) { e.preventDefault(); return; }

        var allItems = itemsContainer.querySelectorAll(':scope > .plan-item');
        itemDragState.active = true;
        itemDragState.draggedEl = el;
        itemDragState.draggedOrigIndex = Array.prototype.indexOf.call(allItems, el);
        itemDragState.draggedElHeight = el.offsetHeight;

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'item-drag');

        requestAnimationFrame(function() {
          el.classList.add('drag-placeholder');
        });

        itemDragState.allowDrag = false;
      });

      el.addEventListener('dragend', function() {
        finishItemDrag();
      });

      el.addEventListener('dragover', function(e) {
        e.preventDefault();
      });

      // 点击其他地方隐藏拖拽手柄
      el.addEventListener('click', function(e) {
        if (!e.target.closest('.item-drag-handle')) {
          hideItemDragHandle(el);
        }
      });
    })(items[i]);
  }

  // Container-level dragover and drop
  var containers = document.querySelectorAll('.plan-set:not(.finished-set) .plan-items');
  for (var i = 0; i < containers.length; i++) {
    (function(container) {
      container.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!itemDragState.active) return;

        var currentSet = itemDragState.draggedEl && itemDragState.draggedEl.closest('.plan-items');
        if (currentSet !== container) return;

        e.dataTransfer.dropEffect = 'move';
        var deltaY = e.clientY - itemDragState.startY;
        applyItemContinuousShift(container, deltaY);

        // Auto-scroll
        var mainEl = document.getElementById('main-content');
        if (mainEl) {
          var mainRect = mainEl.getBoundingClientRect();
          if (e.clientY - mainRect.top < 60) {
            mainEl.scrollTop -= 10;
          } else if (mainRect.bottom - e.clientY < 60) {
            mainEl.scrollTop += 10;
          }
        }
      });

      container.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!itemDragState.active) return;

        var currentSet = itemDragState.draggedEl && itemDragState.draggedEl.closest('.plan-items');
        if (currentSet !== container) { finishItemDrag(); return; }

        var deltaY = e.clientY - itemDragState.startY;
        var h = itemDragState.draggedElHeight;
        var positionsMoved = Math.round(deltaY / h);
        var origIdx = itemDragState.draggedOrigIndex;
        var allItems = container.querySelectorAll(':scope > .plan-item');
        var finalIdx = Math.max(0, Math.min(allItems.length - 1, origIdx + positionsMoved));

        if (finalIdx === origIdx) { finishItemDrag(); return; }

        // Update data model
        var planSetId = itemDragState.planSetId;
        var ps = findPlanSet(planSetId);
        if (!ps || !ps.items) { finishItemDrag(); return; }

        ps.items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

        if (finalIdx >= ps.items.length) finalIdx = ps.items.length - 1;
        if (origIdx >= ps.items.length) { finishItemDrag(); return; }

        var moved = ps.items.splice(origIdx, 1)[0];
        ps.items.splice(finalIdx, 0, moved);
        for (var i = 0; i < ps.items.length; i++) {
          ps.items[i].order = i;
        }

        finishItemDrag();
        markDirty();
        render();
      });
    })(containers[i]);
  }

  // 点击 plan-list 空白区域隐藏所有拖拽手柄
  document.getElementById('plan-list').addEventListener('click', function(e) {
    if (!e.target.closest('.item-drag-handle')) {
      hideAllItemDragHandles();
    }
  });
}

function showItemDragHandle(itemEl) {
  // 先隐藏其他 item 的拖拽手柄
  hideAllItemDragHandles();
  var handle = itemEl.querySelector('.item-drag-handle');
  if (handle) {
    handle.style.display = '';
    // 设为可拖拽
    itemEl.setAttribute('draggable', 'true');
  }
}

function hideItemDragHandle(itemEl) {
  var handle = itemEl.querySelector('.item-drag-handle');
  if (handle) {
    handle.style.display = 'none';
    itemEl.removeAttribute('draggable');
  }
}

function hideAllItemDragHandles() {
  var handles = document.querySelectorAll('.item-drag-handle');
  for (var i = 0; i < handles.length; i++) {
    handles[i].style.display = 'none';
    var item = handles[i].closest('.plan-item');
    if (item) item.removeAttribute('draggable');
  }
}

function applyItemContinuousShift(container, deltaY) {
  var allItems = container.querySelectorAll(':scope > .plan-item');
  var origIdx = itemDragState.draggedOrigIndex;
  var h = itemDragState.draggedElHeight;
  var absDelta = Math.abs(deltaY);
  for (var i = 0; i < allItems.length; i++) {
    var el = allItems[i];
    if (el === itemDragState.draggedEl) continue;
    var shift = 0;
    if (deltaY > 0 && i > origIdx) {
      var dist = i - origIdx - 1;
      var raw = absDelta - dist * h;
      shift = raw >= h ? -h : (raw > 0 ? -raw : 0);
    } else if (deltaY < 0 && i < origIdx) {
      var dist = origIdx - i - 1;
      var raw = absDelta - dist * h;
      shift = raw >= h ? h : (raw > 0 ? raw : 0);
    }
    el.style.transform = shift !== 0 ? 'translateY(' + shift + 'px)' : '';
  }
}

function finishItemDrag() {
  if (itemDragState.draggedEl) {
    var container = itemDragState.draggedEl.closest('.plan-items');
    if (container) {
      var allItems = container.querySelectorAll(':scope > .plan-item');
      for (var i = 0; i < allItems.length; i++) {
        allItems[i].classList.add('no-transition');
        allItems[i].style.transform = '';
        allItems[i].classList.remove('drag-placeholder');
        allItems[i].classList.remove('dragging');
        allItems[i].removeAttribute('draggable');
      }
      container.offsetHeight; // force reflow
      for (var i = 0; i < allItems.length; i++) {
        allItems[i].classList.remove('no-transition');
      }
    }
  }
  hideAllItemDragHandles();
  itemDragState.active = false;
  itemDragState.draggedEl = null;
  itemDragState.draggedOrigIndex = -1;
  itemDragState.draggedElHeight = 0;
  itemDragState.startY = 0;
  itemDragState.planSetId = null;
  itemDragState.itemId = null;
  itemDragState.allowDrag = false;
}
