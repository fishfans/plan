// ==================== Plan Item 拖拽排序 (相邻交换 + CSS 动画) ====================
// 点击 M 按钮 → reorder-mode → 出现 ≡ → 按住 ≡ 拖拽
// 核心：鼠标超过相邻 item 中点时，两者交换 DOM 位置 + CSS transition 动画

var itemDragState = {
  dragging: false,
  clone: null,
  origEl: null,
  origIndex: -1,
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

        var allItems = container.querySelectorAll(':scope > .plan-item');
        var origIndex = Array.prototype.indexOf.call(allItems, item);
        var rect = item.getBoundingClientRect();

        itemDragState = {
          dragging: true,
          clone: null,
          origEl: item,
          origIndex: origIndex,
          offsetY: e.clientY - rect.top,
          planSetId: planSet.getAttribute('data-id'),
          container: container
        };

        // 原位置 hidden 占位
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

  var allItems = st.container.querySelectorAll(':scope > .plan-item');

  // 向下：鼠标超过下一个 item 的中点 → 交换
  if (st.origIndex < allItems.length - 1) {
    var next = allItems[st.origIndex + 1];
    var nextRect = next.getBoundingClientRect();
    if (e.clientY > nextRect.top + nextRect.height / 2) {
      // 先记录两个元素的当前位置
      var origRect = st.origEl.getBoundingClientRect();
      var deltaY = origRect.top - nextRect.top; // > 0: next 在 orig 上方

      // DOM 交换
      st.container.insertBefore(st.origEl, next.nextSibling);

      // 用 transform 动画：让 next 从旧位置滑到新位置
      // DOM 换完后 next 现在在 origEl 原来的位置，但它视觉上还在旧位置
      // 所以给 next 一个 -deltaY 的 transform，然后清除让它动画归位
      next.style.transform = 'translateY(' + deltaY + 'px)';
      next.offsetHeight; // force reflow
      next.style.transform = '';
      st.origIndex++;
    }
  }

  // 向上：鼠标超过上一个 item 的中点 → 交换
  if (st.origIndex > 0) {
    var prev = allItems[st.origIndex - 1];
    var prevRect = prev.getBoundingClientRect();
    if (e.clientY < prevRect.top + prevRect.height / 2) {
      // 先记录两个元素的当前位置
      var origRect = st.origEl.getBoundingClientRect();
      var deltaY = prevRect.top - origRect.top; // < 0: prev 在 orig 下方

      // DOM 交换
      st.container.insertBefore(st.origEl, prev);

      // 用 transform 动画：让 prev 从旧位置滑到新位置
      // DOM 换完后 prev 现在在 origEl 原来的位置，但它视觉上还在旧位置
      // 所以给 prev 一个 -deltaY 的 transform，然后清除让它动画归位
      prev.style.transform = 'translateY(' + (-deltaY) + 'px)';
      prev.offsetHeight; // force reflow
      prev.style.transform = '';
      st.origIndex--;
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

  // 删除克隆
  if (st.clone && st.clone.parentNode) {
    st.clone.parentNode.removeChild(st.clone);
  }

  // 恢复原始 item 可见
  st.origEl.classList.remove('drag-placeholder');

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
    planSetId: null,
    container: null
  };

  render();
}
