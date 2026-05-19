<template>
  <div class="pick-path-map">
    <!-- 这里是一个简易的 2D 俯视图，模拟仓库货架并标注路线 -->
    <div class="warehouse-grid">
      <div v-for="row in rows" :key="row" class="rack-row">
        <div class="rack-label">排 {{ row }}</div>
        <div class="cells">
          <div 
            v-for="col in cols" 
            :key="col" 
            class="rack-cell"
            :class="{ 'is-target': isTargetLocation(row, col) }"
          >
            <div class="cell-id">{{ row }}{{ col }}</div>
            <div v-if="isTargetLocation(row, col)" class="target-badge">
              待拣货
            </div>
          </div>
        </div>
      </div>
      
      <!-- 渲染连线 (SVG) -->
      <svg class="path-lines" xmlns="http://www.w3.org/2000/svg">
        <path 
          v-if="pathData" 
          :d="pathData" 
          fill="none" 
          stroke="#409EFF" 
          stroke-width="3" 
          stroke-dasharray="8,8"
          class="animated-path"
        />
        <circle 
          v-for="(point, idx) in points" 
          :key="idx" 
          :cx="point.x" 
          :cy="point.y" 
          r="6" 
          :fill="idx === 0 ? '#67C23A' : (idx === points.length - 1 ? '#F56C6C' : '#409EFF')"
        />
        <!-- 标注起点和终点 -->
        <text v-if="points.length > 0" :x="points[0].x - 10" :y="points[0].y - 15" fill="#67C23A" font-weight="bold">起点</text>
        <text v-if="points.length > 1" :x="points[points.length-1].x - 10" :y="points[points.length-1].y - 15" fill="#F56C6C" font-weight="bold">终点</text>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  locations: {
    type: Array,
    default: () => []
  }
});

// 模拟仓库结构: A, B, C 排，每排 1 到 8 列
const rows = ['A', 'B', 'C'];
const cols = ['1', '2', '3', '4', '5', '6', '7', '8'];

const targetSet = ref(new Set());
const pathData = ref('');
const points = ref([]);

// 判断某个格子是否是目标库位 (格式假设为 LOC-A1-01 -> 排A，列1)
const isTargetLocation = (row, col) => {
  const code = `LOC-${row}${col}`;
  // 简单匹配前缀，比如 LOC-A1 即可匹配 LOC-A1-01
  for (const loc of targetSet.value) {
    if (loc.startsWith(code)) return true;
  }
  return false;
};

// 计算 SVG 连线
const calculatePath = () => {
  // 由于 CSS 布局固定，我们可以用简单的计算公式模拟坐标
  // 在实际项目中，可以使用元素的 getBoundingClientRect()
  
  points.value = [];
  pathData.value = '';

  if (props.locations.length === 0) return;

  targetSet.value = new Set(props.locations.map(item => item.LocationCode));

  // 1. 将目标按某种逻辑排序 (模拟最优路径算法：先A再B再C，偶数列反向)
  const sortedLocs = Array.from(targetSet.value).sort();

  // 2. 映射到坐标 (每个 rack-row 高度 100px, 间距 20px, 每个 cell 宽度 60px)
  sortedLocs.forEach(loc => {
    // 假设 loc 为 LOC-A1-01
    const match = loc.match(/LOC-([A-C])([1-8])/);
    if (match) {
      const r = match[1]; // A, B, C
      const c = parseInt(match[2]); // 1-8

      const rowIndex = rows.indexOf(r);
      const colIndex = c - 1;

      // 估算中心点 (基于下方 CSS)
      const x = 80 /* label width */ + colIndex * 68 /* cell + gap */ + 30 /* half cell */;
      const y = rowIndex * 120 /* row height + margin */ + 50 /* half row */;

      points.value.push({ x, y });
    }
  });

  // 3. 生成 SVG Path (d)
  if (points.value.length > 0) {
    let d = `M ${points.value[0].x} ${points.value[0].y}`;
    for (let i = 1; i < points.value.length; i++) {
      d += ` L ${points.value[i].x} ${points.value[i].y}`;
    }
    pathData.value = d;
  }
};

watch(() => props.locations, () => {
  nextTick(() => {
    calculatePath();
  });
}, { deep: true, immediate: true });

onMounted(() => {
  calculatePath();
});
</script>

<style scoped>
.pick-path-map {
  width: 100%;
  overflow-x: auto;
  background-color: #f8f9fb;
  border-radius: 8px;
  padding: 20px;
  position: relative;
}

.warehouse-grid {
  position: relative;
  width: 800px;
  min-height: 400px;
}

.rack-row {
  display: flex;
  align-items: center;
  height: 100px;
  margin-bottom: 20px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.rack-label {
  width: 60px;
  text-align: center;
  font-weight: bold;
  color: #909399;
  border-right: 2px solid #ebeef5;
  margin-right: 20px;
}

.cells {
  display: flex;
  gap: 8px;
}

.rack-cell {
  width: 60px;
  height: 80px;
  background-color: #f0f2f5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.3s;
}

.cell-id {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.is-target {
  background-color: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
}

.target-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #f56c6c;
  color: #fff;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  z-index: 10;
}

.path-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 让点击穿透 SVG 到下层的 HTML 元素 */
  z-index: 20;
}

.animated-path {
  stroke-dashoffset: 1000;
  animation: drawPath 3s linear forwards;
}

@keyframes drawPath {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
