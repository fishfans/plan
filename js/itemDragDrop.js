// ==================== Plan Item 拖拽排序 (纯 mousemove) ====================
// 点击 M 按钮 → reorder-mode → 出现 ≡ → 按住 ≡ 拖拽排序
// 不使用 HTML5 Drag API，避免 contenteditable 干扰

var itemDragState = {
  dragging: false,
  el: null,
  placeholder: null,
  offsetY: 0,
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

        var rect = item.getBoundingClientRect();

        // 创建占位符
        var placeholder = document.createElement('div');
        placeholder.className = 'plan-item item-drag-placeholder';
        placeholder.style.height = rect.height + 'px';

        itemDragState = {
          dragging: true,
          el: item,
          placeholder: placeholder,
          offsetY: e.clientY - rect.top,
          planSetId: planSet.getAttribute('data-id'),
          container: container
        };

        // 占位符插入到 item 原位置
        item.parentNode.insertBefore(placeholder, item);

        // item 变 fixed 跟随鼠标
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

  // 全局 mousemove/mouseup 只绑一次
  if (!setupItemDragAndDrop._bound) {
    setupItemDragAndDrop._bound = true;
    document.addEventListener('mousemove', onItemDragMove);
    document.addEventListener('mouseup', onItemDragEnd);
  }
}

function onItemDragMove(e) {
  if (!itemDragState.dragging) return;

  var st = itemDragState;

  // 移动 item 跟随鼠标
  st.el.style.top = (e.clientY - st.offsetY) + 'px';

  // 获取容器里所有子元素（不含被拖走那个，含 placeholder）
  var children = st.container.children;
  // 用 getBoundingClientRect 比较鼠标位置
  var placeholderRect = st.placeholder.getBoundingClientRect();
  var placeholderMid = placeholderRect.top + placeholderRect.height / 2;

  // 鼠标在 placeholder 上方 → 和上一个元素交换
  if (e.clientY < placeholderMid) {
    var prev = st.placeholder.previousElementSibling;
    if (prev && prev !== st.el) {
      st.container.insertBefore(st.placeholder, prev);
    }
  }
  // 鼠标在 placeholder 下方 → 和下一个元素交换
  else {
    var next = st.placeholder.nextElementSibling;
    if (next && next !== st.el) {
      st.container.insertBefore(st.placeholder, next.nextSibling);
    }
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

  // 恢复 item 样式
  st.el.style.position = '';
  st.el.style.left = '';
  st.el.style.top = '';
  st.el.style.width = '';
  st.el.style.zIndex = '';
  st.el.style.opacity = '';
  st.el.style.boxShadow = '';
  st.el.style.pointerEvents = '';

  // 找到 placeholder 在容器里的位置
  var children = st.container.children;
  var insertIndex = -1;
  for (var i = 0; i < children.length; i++) {
    if (children[i] === st.placeholder) {
      insertIndex = i;
      break;
    }
  }

  // 把 item 放到 placeholder 位置，然后删掉 placeholder
  if (insertIndex >= 0) {
    st.container.insertBefore(st.el, st.placeholder);
  }
  st.placeholder.parentNode.removeChild(st.placeholder);

  // 更新数据 model：按 DOM 顺序重排 items 数组
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
    el: null,
    placeholder: null,
    offsetY: 0,
    planSetId: null,
    container: null
  };

  // 重新渲染
  render();
}
