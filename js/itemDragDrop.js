// ==================== Plan Item 拖拽排序 (Continuous Swap) ====================
// 点击 plan-set header 的 M 按钮进入 reorder-mode，每个 item 出现 ≡ 手柄
// 按住 ≡ 手柄拖拽，逻辑与 plan-set 拖拽完全一致

var itemAllowDrag = false;
var itemDragState = {
  active: false,
  draggedEl: null,
  draggedOrigIndex: -1,
  draggedElHeight: 0,
  startY: 0,
  planSetId: null
};

function setupItemDragAndDrop() {
  // 找到所有 reorder-mode 下的 plan-item
  var items = document.querySelectorAll('.plan-set.reorder-mode .plan-item');
  for (var i = 0; i < items.length; i++) {
    (function(el) {
      // 如果已经绑定过（有 draggable 属性），跳过
      if (el.hasAttribute('data-item-drag-ready')) return;
      el.setAttribute('data-item-drag-ready', '1');

      // 给 item 设 draggable
      el.setAttribute('draggable', 'true');

      var handle = el.querySelector('.item-drag-handle');
      if (handle) {
        handle.addEventListener('mousedown', function(e) {
          itemAllowDrag = true;
          itemDragState.startY = e.clientY;
          var planSet = el.closest('.plan-set');
          itemDragState.planSetId = planSet ? planSet.getAttribute('data-id') : null;
        });
      }

      el.addEventListener('dragstart', function(e) {
        if (!itemAllowDrag) {
          e.preventDefault();
          return;
        }

        var container = el.closest('.plan-items');
        if (!container) { e.preventDefault(); return; }

        var allItems = container.querySelectorAll(':scope > .plan-item');
        itemDragState.active = true;
        itemDragState.draggedEl = el;
        itemDragState.draggedOrigIndex = Array.prototype.indexOf.call(allItems, el);
        itemDragState.draggedElHeight = el.offsetHeight;

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'item-drag');

        requestAnimationFrame(function() {
          el.classList.add('drag-placeholder');
        });

        itemAllowDrag = false;
      });

      el.addEventListener('dragend', function() {
        finishItemDrag();
      });

      el.addEventListener('dragover', function(e) {
        e.preventDefault();
      });
    })(items[i]);
  }

  // Container-level dragover 和 drop
  var containers = document.querySelectorAll('.plan-set.reorder-mode .plan-items');
  for (var i = 0; i < containers.length; i++) {
    (function(container) {
      if (container.hasAttribute('data-item-drag-ready')) return;
      container.setAttribute('data-item-drag-ready', '1');

      container.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!itemDragState.active) return;

        var currentContainer = itemDragState.draggedEl && itemDragState.draggedEl.closest('.plan-items');
        if (currentContainer !== container) return;

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

        var currentContainer = itemDragState.draggedEl && itemDragState.draggedEl.closest('.plan-items');
        if (currentContainer !== container) { finishItemDrag(); return; }

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
      }
      container.offsetHeight; // force reflow
      for (var i = 0; i < allItems.length; i++) {
        allItems[i].classList.remove('no-transition');
      }
    }
  }
  itemDragState.active = false;
  itemDragState.draggedEl = null;
  itemDragState.draggedOrigIndex = -1;
  itemDragState.draggedElHeight = 0;
  itemDragState.startY = 0;
  itemDragState.planSetId = null;
  itemAllowDrag = false;
}
