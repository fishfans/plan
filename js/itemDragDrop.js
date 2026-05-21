// ==================== Plan Item 拖拽排序 (纯 mousemove + transform 动画) ====================
// 点击 M 按钮 → reorder-mode → 出现 ≡ → 按住 ≡ 拖拽
// 拖拽过程用 transform: translateY() 做平滑动画，drop 时才真正移动 DOM

var itemDragState = {
  dragging: false,
  clone: null,       // 跟随鼠标的克隆元素
  origEl: null,      // 原位置元素（visibility:hidden 占位）
  origIndex: -1,     // 原始 DOM 索引
  offsetY: 0,        // 鼠标在 item 顶部的偏移
  elHeight: 0,       // item 高度
  startY: 0,         // 鼠标按下时的 Y
  planSetId: null,
  container: null
};

function setupItemDragAndDrop() {
  var handles = document.querySelectorAll('.plan-set.reorder-mode .item-drag-handle');
  for (var i = 0; i < handles.length; i++) {
    (function(handle) {
      if (handle.hasAttribute('data-item-drag-ready')) return;
      handle.setAttribute('data-item-drag-ready', '1');

      handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var item = handle.closest('.plan-item');
        var container = handle.closest('.plan-items');
        var planSet = handle.closest('.plan-set');
        if (!item || !container || !planSet) return;

        var allItems = container.querySelectorAll(':scope > .plan-item');
        var origIndex = Array.prototype.indexOf.call(allItems, item);
        var rect = item.getBoundingClientRect();

        itemDragState = {
          dragging: true,
          clone: null,
          origEl: item,
          origIndex: origIndex,
          offsetY: e.clientY - rect.top,
          elHeight: rect.height,
          startY: e.clientY,
          planSetId: planSet.getAttribute('data-id'),
          container: container
        };

        // 原位置保持占位（hidden）
        item.classList.add('drag-placeholder');

        // 创建克隆跟随鼠标
        var clone = item.cloneNode(true);
        clone.classList.add('dragging');
        clone.classList.remove('drag-placeholder');
        clone.style.position = 'fixed';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.margin = '0';
        document.body.appendChild(clone);
        itemDragState.clone = clone;
      });
    })(handles[i]);
  }

  if (!setupItemDragAndDrop._bound) {
    setupItemDragAndDrop._bound = true;
    document.addEventListener('mousemove', onItemDragMove);
    document.addEventListener('mouseup', onItemDragEnd);
  }
}

function onItemDragMove(e) {
  if (!itemDragState.dragging) return;

  var st = itemDragState;

  // 移动克隆跟随鼠标
  st.clone.style.top = (e.clientY - st.offsetY) + 'px';

  // 计算位移了几个位置
  var deltaY = e.clientY - st.startY;
  var positionsMoved = Math.round(deltaY / st.elHeight);
  var allItems = st.container.querySelectorAll(':scope > .plan-item');
  var count = allItems.length - 1;
  positionsMoved = Math.max(-st.origIndex, Math.min(count - st.origIndex, positionsMoved));

  // 用 transform 让被经过的 item 平移
  for (var i = 0; i < allItems.length; i++) {
    if (i === st.origIndex) continue;

    var el = allItems[i];
    var shift = 0;

    // 被拖拽者从上往下经过的 item（在 origIndex 和 origIndex+positionsMoved 之间）
    if (positionsMoved > 0 && i > st.origIndex && i <= st.origIndex + positionsMoved) {
      shift = -st.elHeight;
    }
    // 被拖拽者从下往上经过的 item（在 origIndex+positionsMoved 和 origIndex 之间）
    if (positionsMoved < 0 && i >= st.origIndex + positionsMoved && i < st.origIndex) {
      shift = st.elHeight;
    }

    el.style.transform = shift !== 0 ? 'translateY(' + shift + 'px)' : '';
  }

  // Auto-scroll
  var mainEl = document.getElementById('main-content');
  if (mainEl) {
    var mainRect = mainEl.getBoundingClientRect();
    if (e.clientY - mainRect.top < 40) {
      mainEl.scrollTop -= 8;
    } else if (mainRect.bottom - e.clientY < 40) {
      mainEl.scrollTop += 8;
    }
  }
}

function onItemDragEnd(e) {
  if (!itemDragState.dragging) return;

  var st = itemDragState;

  // 删除克隆
  if (st.clone && st.clone.parentNode) {
    st.clone.parentNode.removeChild(st.clone);
  }

  // 瞬间清除所有 transform（先禁用 transition）
  var allItems = st.container.querySelectorAll(':scope > .plan-item');
  for (var i = 0; i < allItems.length; i++) {
    allItems[i].classList.add('no-transition');
    allItems[i].style.transform = '';
  }
  st.container.offsetHeight; // force reflow
  for (var i = 0; i < allItems.length; i++) {
    allItems[i].classList.remove('no-transition');
  }

  // 计算最终位置
  var deltaY = e.clientY - st.startY;
  var positionsMoved = Math.round(deltaY / st.elHeight);
  var count = allItems.length - 1;
  positionsMoved = Math.max(-st.origIndex, Math.min(count - st.origIndex, positionsMoved));
  var finalIndex = st.origIndex + positionsMoved;

  // 恢复原始 item 可见
  st.origEl.classList.remove('drag-placeholder');

  // 在 DOM 中移动到最终位置
  if (finalIndex !== st.origIndex && finalIndex >= 0) {
    var parent = st.container;
    // 获取当前所有 item（DOM 顺序）
    var currentItems = parent.querySelectorAll(':scope > .plan-item');
    if (finalIndex >= currentItems.length) finalIndex = currentItems.length - 1;

    if (finalIndex === 0) {
      parent.insertBefore(st.origEl, currentItems[0]);
    } else {
      parent.insertBefore(st.origEl, currentItems[finalIndex].nextSibling);
    }
  }

  // 按最终 DOM 顺序更新数据 model
  var ps = findPlanSet(st.planSetId);
  if (ps && ps.items) {
    var domItems = st.container.querySelectorAll(':scope > .plan-item');
    var newOrder = [];
    for (var i = 0; i < domItems.length; i++) {
      var itemId = domItems[i].getAttribute('data-item-id');
      for (var j = 0; j < ps.items.length; j++) {
        if (ps.items[j].id === itemId) {
          newOrder.push(ps.items[j]);
          break;
        }
      }
    }
    if (newOrder.length === ps.items.length) {
      ps.items = newOrder;
      for (var i = 0; i < ps.items.length; i++) {
        ps.items[i].order = i;
      }
      markDirty();
    }
  }

  // 重置状态
  itemDragState = {
    dragging: false,
    clone: null,
    origEl: null,
    origIndex: -1,
    offsetY: 0,
    elHeight: 0,
    startY: 0,
    planSetId: null,
    container: null
  };

  render();
}
