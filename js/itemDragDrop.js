// ==================== Plan Item 拖拽排序 (Continuous Swap) ====================
// Double-click on a plan item content to start dragging, same logic as plan set drag

var itemDragState = {
  active: false,
  draggedEl: null,
  draggedOrigIndex: -1,
  draggedElHeight: 0,
  startY: 0,
  planSetId: null,
  itemId: null
};

function setupItemDragAndDrop() {
  // Find all plan item content elements within non-finished plan sets
  var items = document.querySelectorAll('.plan-set:not(.finished-set) .plan-item-content');
  for (var i = 0; i < items.length; i++) {
    (function(el) {
      el.addEventListener('dblclick', function(e) {
        // Only start drag if not already in contenteditable selection mode
        // The first dblclick selects text, the second one starts drag
        var planItem = el.closest('.plan-item');
        if (!planItem) return;

        // Find the parent plan-items container
        var itemsContainer = planItem.closest('.plan-items');
        var planSet = planItem.closest('.plan-set');
        if (!itemsContainer || !planSet) return;

        var planSetId = planSet.getAttribute('data-id');
        var itemId = planItem.getAttribute('data-item-id');

        // Make this item draggable
        planItem.setAttribute('draggable', 'true');

        // Set up drag state
        itemDragState.planSetId = planSetId;
        itemDragState.itemId = itemId;

        // Programmatically trigger drag
        // We use a small delay to allow the dblclick text selection to complete
        setTimeout(function() {
          planItem.setAttribute('draggable', 'true');
        }, 10);
      });

      // mousedown to track start position
      el.addEventListener('mousedown', function(e) {
        var planItem = el.closest('.plan-item');
        if (!planItem) return;
        var itemsContainer = planItem.closest('.plan-items');
        if (!itemsContainer) return;

        var planSet = planItem.closest('.plan-set');
        if (!planSet) return;

        itemDragState.startY = e.clientY;
        itemDragState.planSetId = planSet.getAttribute('data-id');
        itemDragState.itemId = planItem.getAttribute('data-item-id');
      });
    })(items[i]);
  }

  // Set up dragstart/dragend on plan items
  var planItems = document.querySelectorAll('.plan-set:not(.finished-set) .plan-item');
  for (var i = 0; i < planItems.length; i++) {
    (function(el) {
      el.addEventListener('dragstart', function(e) {
        if (!itemDragState.planSetId) {
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
      });

      el.addEventListener('dragend', function() {
        finishItemDrag();
      });

      el.addEventListener('dragover', function(e) {
        e.preventDefault();
      });
    })(planItems[i]);
  }

  // Container-level dragover and drop
  var planSets = document.querySelectorAll('.plan-set:not(.finished-set) .plan-items');
  for (var i = 0; i < planSets.length; i++) {
    (function(container) {
      container.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!itemDragState.active) return;

        // Only allow drag within the same plan set
        var currentSet = itemDragState.draggedEl && itemDragState.draggedEl.closest('.plan-items');
        if (currentSet !== container) return;

        e.dataTransfer.dropEffect = 'move';
        var deltaY = e.clientY - itemDragState.startY;
        applyItemContinuousShift(container, deltaY);

        // Auto-scroll
        var mainEl = document.getElementById('main-content');
        var mainRect = mainEl.getBoundingClientRect();
        if (e.clientY - mainRect.top < 60) {
          mainEl.scrollTop -= 10;
        } else if (mainRect.bottom - e.clientY < 60) {
          mainEl.scrollTop += 10;
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

        // Sort items by order first
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
    })(planSets[i]);
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
  itemDragState.active = false;
  itemDragState.draggedEl = null;
  itemDragState.draggedOrigIndex = -1;
  itemDragState.draggedElHeight = 0;
  itemDragState.startY = 0;
  itemDragState.planSetId = null;
  itemDragState.itemId = null;
}
