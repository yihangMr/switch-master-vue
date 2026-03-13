# switch-master-vue

当你在 Vue 3 中有大量耦合的开关逻辑，需要它们具备响应式特性，或者需要跨组件、跨模块共享开关状态时，`switch-master-vue` 能帮你轻松高效地管理这些开关。

## 安装

```bash
npm install switch-master-vue
```

> 需要 Vue 3.0+ 作为 peer dependency

## 快速开始

### 1. 批量创建开关

```typescript
import master from "switch-master-vue";

// 批量创建开关，第二个参数指定默认打开的开关
master.createSwitchs(
  ["dialog-a", "dialog-b", "panel"],
  ["dialog-a"] // dialog-a 默认打开
);
```

### 2. 在组件中使用

```vue
<script setup>
import { useSwitch,useSwitchWatch } from "switch-master-vue";
// 根据id拿到这个开关
const dialogA = useSwitch("dialog-a");
// 给这个开关挂载一个监听器，值变化时触发
useSwitchWatch(dialogA.id,(newVal,oldVal,data)=>{
    console.log("开关的自定义属性："+data);
})
</script>

<template>
  <div v-if="dialogA">弹窗 A 的内容</div>
  <button @click="dialogA = !dialogA">切换弹窗 A</button>
</template>
```

### 3. 核心概念

#### 本质就是一个 `ref`

`useSwitch` 返回的就是一个 Vue 的 `ref` 变量（类型为 `SwitchRef extends Ref<boolean>`），所以你可以像使用普通 `ref` 一样直接读写它，也可以直接放在模板里自动解包：

```typescript
const dialogA = useSwitch("dialog-a");

// 脚本中通过 .value 读写
dialogA.value = true;
console.log(dialogA.value); // true

// 模板中自动解包，无需 .value
// <div v-if="dialogA">...</div>
```

#### 通过 `.data` 挂载自定义属性

每个开关上都有一个 `.data` 属性（`Record<string, any>`），你可以在上面挂载任意自定义数据，用于存储与开关相关的业务信息：

```typescript
const dialogA = useSwitch("dialog-a");

// 挂载自定义数据
dialogA.data = { title: "确认删除", level: "danger" };

// 随时读取
console.log(dialogA.data.title); // "确认删除"
```

> `.data` 会在 `useSwitchWatch` 的回调中作为第三个参数传入，方便你在监听时获取上下文信息。

#### 通过 `.listen` 查看所有监听器

每个开关的 `.listen` 是一个 `Set<SwitchWatchFn>`，保存了所有正在监听该开关状态变化的回调函数。你可以通过它快速了解当前有多少地方在关注这个开关，方便调试和排查：

```typescript
const dialogA = useSwitch("dialog-a");

// 通过 useSwitchWatch 注册的回调会自动收集到 .listen 中
useSwitchWatch("dialog-a", (newVal, oldVal) => {
  console.log(`dialogA 状态从 ${oldVal} 变为 ${newVal}`);
});

// 查看当前有几个监听器
console.log(dialogA.listen.size);

// 遍历所有监听器
dialogA.listen.forEach(fn => console.log(fn));
```

#### 跨组件共享同一数据源

不同组件中调用 `useSwitch("dialog-a")` 拿到的是**同一个** `SwitchRef` 实例。所有组件共享同一份状态，任何一处修改都会自动同步到其他所有使用该开关的地方：

```vue
<!-- ComponentA.vue -->
<script setup>
import { useSwitch } from "switch-master-vue";
const dialogA = useSwitch("dialog-a");
</script>
<template>
  <button @click="dialogA = !dialogA">切换弹窗</button>
</template>

<!-- ComponentB.vue -->
<script setup>
import { useSwitch } from "switch-master-vue";
const dialogA = useSwitch("dialog-a"); // 同一个实例
</script>
<template>
  <div v-if="dialogA">弹窗 A 的内容</div>
</template>
```

> 无需 `provide/inject`、`pinia` 或 `eventBus`，开关状态天然跨组件共享。

## API

### master（默认导出）

`SwitchMasterVue` 的单例实例，用于管理所有开关。

#### `master.createSwitchs(switchIds, initOpenedSwitchs?)`

批量创建开关。

| 参数 | 类型 | 说明 |
|------|------|------|
| `switchIds` | `string[]` | 要创建的开关 id 列表 |
| `initOpenedSwitchs` | `string[]` | 默认打开的开关 id 列表 |

#### `master.addSwitch(config)`

单独添加一个开关，返回 `SwitchRef`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `config.id` | `string` | 是 | 开关唯一标识 |
| `config.name` | `string` | 否 | 开关名称，默认同 id |
| `config.initOpened` | `boolean` | 否 | 初始是否打开，默认 `false` |
| `config.data` | `Record<string, any>` | 否 | 附带的自定义数据 |

#### `master.getSwitchById(id)`

根据 id 获取开关的 `SwitchRef`。

#### `master.openSwitchById(id)`

打开指定开关。

#### `master.closeSwitchById(id)`

关闭指定开关。

#### `master.toggleSwitchById(id)`

切换指定开关状态。

#### `master.deleteSwitchById(id)`

删除指定开关，同时停止其内部 watcher。

---

### useSwitch(id)

获取指定开关的 `SwitchRef`，可直接在模板中响应式使用。

```typescript
import { useSwitch } from "switch-master-vue";

const sw = useSwitch("dialog-a");
// sw.value   → boolean（响应式）
// sw.id      → "dialog-a"
// sw.name    → string
// sw.data    → Record<string, any>
```

---

### useSwitchWatch(id, watchFn, immediate?)

监听开关状态变化，自动在组件 `onMounted` 时注册、`onUnmounted` 时注销。

```typescript
import { useSwitchWatch } from "switch-master-vue";

useSwitchWatch("dialog-a", (newVal, oldVal, data) => {
  console.log("dialog-a 状态变化:", newVal);
}, true); // true 表示立即执行一次
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 开关 id |
| `watchFn` | `SwitchWatchFn` | 回调函数 `(newVal, oldVal, data) => void` |
| `immediate` | `boolean` | 是否立即执行一次，默认 `false` |

---

### useToggle(switchIds)

创建一组互斥开关（单选逻辑），返回一个切换函数。被选中的开关打开，其余自动关闭。

```typescript
import { useToggle } from "switch-master-vue";

const toggle = useToggle(["tab-1", "tab-2", "tab-3"]);

toggle("tab-2"); // tab-2 打开，tab-1 和 tab-3 关闭
toggle("tab-2"); // 再次调用会关闭 tab-2（全部关闭）
```

---

### 类型导出

```typescript
import type {
  SwitchRef,
  SwitchWatchFn,
  CreateSwitchConfig
} from "switch-master-vue";
```

| 类型 | 说明 |
|------|------|
| `SwitchRef` | 开关引用，扩展自 `Ref<boolean>`，包含 `id`、`name`、`data`、`listen`、`stopWatch` |
| `SwitchWatchFn` | 监听回调类型 `(newVal?, oldVal?, data?) => void` |
| `CreateSwitchConfig` | 创建开关的配置 `{ id, name?, data?, initOpened? }` |

## 完整示例

```typescript
import master, { useSwitch, useToggle, useSwitchWatch } from "switch-master-vue";

// 创建开关
master.createSwitchs(["modal", "sidebar", "tab-1", "tab-2", "tab-3"], ["sidebar"]);

// 组件 A：控制 modal
const modal = useSwitch("modal");
modal.value = true;  // 打开
modal.value = false; // 关闭

// 组件 B：监听 sidebar 变化
useSwitchWatch("sidebar", (newVal) => {
  console.log("sidebar:", newVal ? "展开" : "收起");
});

// 组件 C：Tab 切换（互斥）
const toggleTab = useToggle(["tab-1", "tab-2", "tab-3"]);
toggleTab("tab-1"); // 只有 tab-1 打开

// 动态添加开关
master.addSwitch({ id: "tooltip", initOpened: false, data: { text: "提示" } });

// 删除开关
master.deleteSwitchById("tooltip");
```

## License

[MIT](./LICENSE)
