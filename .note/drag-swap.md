# Plan Set 拖拽排序 — 连续交换方案

## 需求描述

拖拽 plan set 时，被拖元素碰到相邻元素后两者**逐渐交换位置**，继续拖动碰到下一个元素重复此过程。

## 核心思路

不使用离散的"间隙定位"（placeholder index），而是根据鼠标从起点的**连续偏移量 deltaY** 来计算每个元素的位移量。

### 位移计算

```
deltaY = 当前鼠标Y - 拖拽起始Y
```

**向下拖（deltaY > 0）**：被拖元素下方的元素逐渐上移

```
对于第 i 个元素（i > origIdx）:
  dist = i - origIdx - 1          // 与被拖元素的距离（0=紧邻, 1=隔一个...）
  raw  = |deltaY| - dist * h      // 需要位移的原始像素值
  shift = clamp(-raw, -h, 0)      // 上移，最大不超过一个元素高度
```

**向上拖（deltaY < 0）**：被拖元素上方的元素逐渐下移

```
对于第 i 个元素（i < origIdx）:
  dist = origIdx - i - 1
  raw  = |deltaY| - dist * h
  shift = clamp(raw, 0, h)       // 下移，最大不超过一个元素高度
```

### 效果示意

以 `[A, B(拖), C, D]` 向下拖为例，h=200px：

| deltaY | C 位移 | D 位移 | 视觉效果 |
|--------|--------|--------|---------|
| 0px    | 0      | 0      | 无变化 |
| 50px   | -50px  | 0      | C 开始上移 |
| 200px  | -200px | 0      | C 完全移到 B 原位（一次交换完成） |
| 250px  | -200px | -50px  | C 保持，D 开始上移 |
| 400px  | -200px | -200px | 两次交换完成 |

### Drop 最终位置

```
positionsMoved = round(deltaY / h)
finalIdx = clamp(origIdx + positionsMoved, 0, allSets.length - 1)
```

直接用 `splice` 将元素插入最终位置，无需额外的 index 调整。

## 关键代码

### 核心位移函数

```javascript
function applyContinuousShift(deltaY, state) {
  var allSets = document.querySelectorAll('#plan-list .plan-set');
  var origIdx = state.draggedOrigIndex;
  var h = state.draggedElHeight;
  var absDelta = Math.abs(deltaY);

  for (var i = 0; i < allSets.length; i++) {
    var el = allSets[i];
    if (el === state.draggedEl) continue;
    var shift = 0;

    if (deltaY > 0 && i > origIdx) {
      // 向下拖：下方元素逐渐上移
      var dist = i - origIdx - 1;
      var raw = absDelta - dist * h;
      shift = raw >= h ? -h : (raw > 0 ? -raw : 0);
    } else if (deltaY < 0 && i < origIdx) {
      // 向上拖：上方元素逐渐下移
      var dist = origIdx - i - 1;
      var raw = absDelta - dist * h;
      shift = raw >= h ? h : (raw > 0 ? raw : 0);
    }

    el.style.transform = shift !== 0 ? 'translateY(' + shift + 'px)' : '';
  }
}
```

### 桌面端 dragover

```javascript
planList.addEventListener('dragover', function(e) {
  e.preventDefault();
  if (!dragState.active || !draggedSetId) return;
  e.dataTransfer.dropEffect = 'move';
  var deltaY = e.clientY - dragState.startY;
  applyContinuousShift(deltaY, dragState);
  // ... auto-scroll
});
```

### 桌面端 drop

```javascript
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

  // 从数据中移除并插入到最终位置
  var moved = data.planSets.splice(fromIdx, 1)[0];
  data.planSets.splice(finalIdx, 0, moved);
  finishDrag();
  render();
});
```

## 与旧方案的区别

| | 旧方案（离散间隙） | 新方案（连续交换） |
|---|---|---|
| 位移触发 | phIdx 变化时一次性整体位移 | deltaY 连续驱动，像素级平滑 |
| 视觉效果 | 全体元素同时跳到新位置 | 碰到谁谁逐渐让位 |
| 位置计算 | 需要遍历元素判断鼠标在哪个间隙 | 直接用 deltaY / h 计算 |
| Drop 复杂度 | 需要 phIdx → finalIdx 转换 | round(deltaY/h) 即是最终位置 |
| 提前移动问题 | 需要额外的 invisible space 检测 | 不存在，位移量由 deltaY 自然控制 |

## 注意事项

1. **容器级 dragover 必须调用 `e.preventDefault()`**，否则 drop 事件不会触发（元素被 CSS transform 移位后，鼠标可能在空隙中）
2. **startY 在 mousedown 时记录**，不是在 dragstart 时（dragstart 时鼠标可能已经移动）
3. **触摸端需要在 touchmove 中记录 lastY**，因为 touchend 的 `e.touches` 为空
4. **元素高度 h 使用被拖元素的高度**作为统一值，适用于高度相近的场景
