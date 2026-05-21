// ==================== Plan Item 拖拽排序 (纯 mousemove) ====================
// 点击 M 按钮 → reorder-mode → 出现 ≡ → 按住 ≡ 拖拽排序
// 不使用 HTML5 Drag API，避免 contenteditable 干扰

var itemDragState = {
  dragging: false,
  el: null,
  placeholder: null,
  startY: 0,
  offsetY: 0,
  origIndex: -1,
  elHeight: 0,
  planSetId: null,
  container: null,
  items: []
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
        var idx = Array.prototype.indexOf.call(allItems, item);

        // 创建占位符
        var rect = item.getBoundingClientRect();
        var containerRect = container.getBoundingClientRect();
        var placeholder = document.createElement('div');
        placeholder.className = 'plan-item';
        placeholder.style.height = rect.height + 'px';
        placeholder.style.border = '2px dashed #ccc';
        placeholder.style.background = 'rgba(0,0,0,0.03)';
        placeholder.style.borderRadius = '255px 15px 225px 15px / 15px 225px 15px 255px';
        placeholder.style.marginBottom = '8px';
        placeholder.style.opacity = '0.6';

        itemDragState = {
          dragging: true,
          el: item,
          placeholder: placeholder,
          startY: e.clientY,
          offsetY: e.clientY - rect.top,
          origIndex: idx,
          elHeight: rect.height,
          planSetId: planSet.getAttribute('data-id'),
          container: container,
          items: Array.prototype.slice.call(allItems)
        };

        // 把占位符插入到 item 原位置
        item.parentNode.insertBefore(placeholder, item);

        // 把 item 变成 fixed 定位跟随鼠标
        item.style.position = 'fixed';
        item.style.left = rect.left + 'px';
        item.style.top = rect.top + 'px';
        item.style.width = rect.width + 'px';
        item.style.zIndex = '1000';
        item.style.opacity = '0.85';
        item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        item.style.pointerEvents = 'none';

        document.body.appendChild(item);
      });
    })(handles[i]);
  }

  // 只绑定一次全局 mousemove 和 mouseup
  if (!itemDragState._globalBound) {
    itemDragState._globalBound = true;
    document.addEventListener('mousemove', onItemDragMove);
    document.addEventListener('mouseup', onItemDragEnd);
  }
}

function onItemDragMove(e) {
  if (!itemDragState.dragging) return;

  var st = itemDragState;
  var y = e.clientY - st.offsetY;

  // 移动被拖拽元素
  st.el.style.top = y + 'px';

  // 计算应该插入到哪个位置
  var containerRect = st.container.getBoundingClientRect();
  var relativeY = e.clientY - containerRect.top + st.container.scrollTop;

  // 找到最近的 item 位置
  var items = st.items;
  var targetIndex = st.origIndex;
  for (var i = 0; i < items.length; i++) {
    if (items[i] === st.placeholder) continue;
    var itemRect = items[i].getBoundingClientRect();
    var itemMid = itemRect.top + itemRect.height / 2;
    if (i < st.origIndex && e.clientY < itemMid) {
      targetIndex = i;
      break;
    }
    if (i > st.origIndex && e.clientY > itemMid) {
      targetIndex = i;
    }
  }

  // 移动占位符到目标位置
  if (targetIndex > st.origIndex) {
    // 向下拖
    var nextEl = items[targetIndex + 1] || null;
    st.container.insertBefore(st.placeholder, nextEl);
  } else if (targetIndex < st.origIndex) {
    // 向上拖
    st.container.insertBefore(st.placeholder, items[targetIndex]);
  }

  st.origIndex = Array.prototype.indexOf.call(
    st.container.querySelectorAll(':scope > .plan-item, :scope > div.plan-item'),
    st.placeholder
  );

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

  // 计算占位符在容器中的最终位置
  var allChildren = st.container.children;
  var finalIndex = -1;
  // 先把 item 放回 container（hidden，去掉 fixed 样式）
  st.el.style.position = '';
  st.el.style.left = '';
  st.el.style.top = '';
  st.el.style.width = '';
  st.el.style.zIndex = '';
  st.el.style.opacity = '';
  st.el.style.boxShadow = '';
  st.el.style.pointerEvents = '';
  st.el.style.display = 'none';

  // 找到 placeholder 的位置
  for (var i = 0; i < allChildren.length; i++) {
    if (allChildren[i] === st.placeholder) {
      finalIndex = i;
      break;
    }
  }

  // 把 item 插入到 placeholder 位置
  if (finalIndex >= 0) {
    st.container.insertBefore(st.el, st.placeholder);
  }

  // 删除 placeholder
  st.placeholder.parentNode.removeChild(st.placeholder);

  // 恢复 item 显示
  st.el.style.display = '';

  // 更新数据
  var ps = findPlanSet(st.planSetId);
  if (ps && ps.items && finalIndex >= 0) {
    var itemId = st.el.getAttribute('data-item-id');
    // 找到 item 在数组中的位置
    var itemIdx = -1;
    for (var j = 0; j < ps.items.length; j++) {
      if (ps.items[j].id === itemId) { itemIdx = j; break; }
    }
    if (itemIdx >= 0 && itemIdx !== finalIndex) {
      var moved = ps.items.splice(itemIdx, 1)[0];
      // finalIndex 可能因为 splice 偏移
      if (finalIndex > itemIdx) finalIndex--;
      ps.items.splice(finalIndex, 0, moved);
      for (var j = 0; j < ps.items.length; j++) {
        ps.items[j].order = j;
      }
      markDirty();
    }
  }

  // 重置状态
  itemDragState = {
    dragging: false,
    el: null,
    placeholder: null,
    startY: 0,
    offsetY: 0,
    origIndex: -1,
    elHeight: 0,
    planSetId: null,
    container: null,
    items: [],
    _globalBound: true
  };

  // 重新渲染以更新 order
  render();
}
