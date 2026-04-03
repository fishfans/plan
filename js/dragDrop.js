// ==================== 拖拽排序 (Continuous Swap) ====================

var draggedSetId = null;
var allowDrag = false;
var dragState = {
  active: false,
  draggedEl: null,
  draggedOrigIndex: -1,
  draggedElHeight: 0,
  startY: 0
};

function setupDragAndDrop() {
  var sets = document.querySelectorAll('.plan-set[draggable]');
  for (var i = 0; i < sets.length; i++) {
    (function(el) {
      el.querySelector('.drag-handle').addEventListener('mousedown', function(e) {
        allowDrag = true;
        dragState.startY = e.clientY;
      });
      el.addEventListener('dragstart', function(e) {
        if (allowDrag) {
          draggedSetId = el.getAttribute('data-id');
          dragState.active = true;
          dragState.draggedEl = el;
          var allSets = document.querySelectorAll('#plan-list .plan-set');
          dragState.draggedOrigIndex = Array.prototype.indexOf.call(allSets, el);
          dragState.draggedElHeight = el.offsetHeight;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', draggedSetId);
          requestAnimationFrame(function() {
            el.classList.add('drag-placeholder');
          });
        } else {
          e.preventDefault();
        }
        allowDrag = false;
      });
      el.addEventListener('dragend', function() {
        finishDrag();
      });
      el.addEventListener('dragover', function(e) {
        e.preventDefault();
      });
    })(sets[i]);
  }
  var planList = document.getElementById('plan-list');
  planList.addEventListener('dragover', function(e) {
    e.preventDefault();
    if (!dragState.active || !draggedSetId) return;
    e.dataTransfer.dropEffect = 'move';
    var deltaY = e.clientY - dragState.startY;
    applyContinuousShift(deltaY);
    var mainEl = document.getElementById('main-content');
    var mainRect = mainEl.getBoundingClientRect();
    if (e.clientY - mainRect.top < 60) {
      mainEl.scrollTop -= 10;
    } else if (mainRect.bottom - e.clientY < 60) {
      mainEl.scrollTop += 10;
    }
  });
  planList.addEventListener('drop', function(e) {
    e.preventDefault();
    if (!dragState.active || !draggedSetId) return;
    var deltaY = e.clientY - dragState.startY;
    var h = dragState.draggedElHeight;
    var positionsMoved = Math.round(deltaY / h);
    var origIdx = dragState.draggedOrigIndex;
    var allSets = document.querySelectorAll('#plan-list .plan-set');
    var finalIdx = Math.max(0, Math.min(allSets.length - 1, origIdx + positionsMoved));
    if (finalIdx === origIdx) { finishDrag(); return; }
    var data = getCurrentDateData();
    var fromIdx = -1;
    for (var i = 0; i < data.planSets.length; i++) {
      if (data.planSets[i].id === draggedSetId) { fromIdx = i; break; }
    }
    if (fromIdx === -1) { finishDrag(); return; }
    var moved = data.planSets.splice(fromIdx, 1)[0];
    data.planSets.splice(finalIdx, 0, moved);
    for (var i = 0; i < data.planSets.length; i++) {
      data.planSets[i].order = i;
    }
    finishDrag();
    render();
  });
}

function applyContinuousShift(deltaY) {
  var allSets = document.querySelectorAll('#plan-list .plan-set');
  var origIdx = dragState.draggedOrigIndex;
  var h = dragState.draggedElHeight;
  var absDelta = Math.abs(deltaY);
  for (var i = 0; i < allSets.length; i++) {
    var el = allSets[i];
    if (el === dragState.draggedEl) continue;
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

function finishDrag() {
  var allSets = document.querySelectorAll('#plan-list .plan-set');
  for (var i = 0; i < allSets.length; i++) {
    allSets[i].classList.add('no-transition');
    allSets[i].style.transform = '';
  }
  if (dragState.draggedEl) {
    dragState.draggedEl.classList.remove('drag-placeholder');
    dragState.draggedEl.classList.remove('dragging');
  }
  document.getElementById('plan-list').offsetHeight;
  for (var i = 0; i < allSets.length; i++) {
    allSets[i].classList.remove('no-transition');
  }
  dragState.active = false;
  dragState.draggedEl = null;
  dragState.draggedOrigIndex = -1;
  dragState.draggedElHeight = 0;
  dragState.startY = 0;
  draggedSetId = null;
  allowDrag = false;
}
