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

### 3. 关于 SwitchRef

`useSwitch` 返回的是一个增强的 Vue `ref`，除了响应式的布尔值，还携带了额外的属性：

```typescript
import { useSwitch } from "switch-master-vue";

const dialogA = useSwitch("dialog-a");

// 像普通 ref 一样读写
dialogA.value = true;

// 通过 .data 挂载自定义元数据
dialogA.data = { description: "控制弹窗 A 的显示状态" };

// 通过 .listen 查看所有已注册的监听回调（useSwitchWatch和master.addSwitchWatch 注册的）
console.log(dialogA.listen); // Set { fn1, fn2, ... }
```

> 不同组件中调用 `useSwitch("dialog-a")` 得到的是**同一个响应式引用**，状态天然同步，无需额外通信。

### 4. 封装自定义开关类型

基于 `master.addSwitch` 和 `master.addSwitchWatch`，你可以封装出适配业务场景的开关工厂函数。例如，在数字孪生项目中，封装一个"图层开关"——开关状态变化时自动通知地图引擎切换图层显隐：

```typescript
import { nameGroup, switchGroup } from "@configs/switchs";
import mitt from "@utils/mitt";
import master from "switch-master-vue";
import { useSwitch,useToggle,useSwitchWatch } from "switch-master-vue";

master.createSwitchs(
  Object.values(nameGroup),
);

export function createAirCityLayerSwitch(config) {
	const switchRef = master.addSwitch({
		id: config.id,
		name: config.name,
		initOpened: config.visible || false,
		data: { layerId: config.layerId },
	});
	// 注意：这里使用 master.addSwitchWatch 而不是 useSwitchWatch
    // 因为 Hook 只能在组件的 setup() 中调用，而这里是普通函数
    // master.addSwitchWatch会返回一个用于清除监听的回调
	const stopWatch = master.addSwitchWatch(switchRef.id, (newVal) => {
		let layer = Object.fromEntries(config.layerId.map(item => [item, newVal]));
		mitt.emit("Map:toggleLayer",{
			layer
		});
	},true);
    // stopWatch(); // 清除监听器
	return switchRef;
}

export default master;
export { useSwitch,useToggle,useSwitchWatch };
```

同理，你可以封装出表单开关、权限开关、主题开关等任意业务开关类型。

### 5. 关于 Hook

`useSwitch`、`useToggle`、`useSwitchWatch` 都是组件级的 Hook，请像 React 的 Hook 或 Vue 3 的生命周期钩子一样使用——**在组件的 `setup()` 同步执行阶段中调用**。不要在 `setTimeout`、`await` 之后或组件外部调用，否则可能无法正确绑定组件生命周期。

如果需要在组件外部（如工具函数、工厂函数中）监听开关变化，请使用 `master.addSwitchWatch` 代替 `useSwitchWatch`。



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

#### `master.addSwitchWatch(config)`

给某个开关添加一个监听监听器，返回 一个用于清除回调的事件。

| 参数               | 类型          | 必填 | 说明                 |
| ------------------ | ------------- | ---- | -------------------- |
| `config.id`        | `string`      | 是   | 开关唯一标识         |
| `config.watchFn`   | SwitchWatchFn | 是   | 一个开关的监听器事件 |
| `config.immediate` | `boolean`     | 否   | 是否立即执行一遍     |

返回一个function用于清除此监听器。



#### `master.getSwitchById(id)`

根据 id 获取开关的 `SwitchRef`。

#### `master.openSwitchById(id)`

打开指定开关。

#### `master.openByIds(ids)`

批量打开开关。

| 参数 | 类型 | 说明 |
|------|------|------|
| `ids` | `string[]` | 要打开的开关 id 列表 |

```typescript
master.openByIds(["dialog-a", "dialog-b", "panel"]);
```

#### `master.closeSwitchById(id)`

关闭指定开关。

#### `master.closeByIds(ids)`

批量关闭开关。

| 参数 | 类型 | 说明 |
|------|------|------|
| `ids` | `string[]` | 要关闭的开关 id 列表 |

```typescript
master.closeByIds(["dialog-a", "dialog-b"]);
```

#### `master.toggleSwitchById(id)`

切换指定开关状态。

#### `master.deleteSwitchById(id)`

删除指定开关，同时停止其内部 watcher。

#### `master.initialStatus`

`Record<string, boolean>` 类型，记录每个开关创建时的初始状态。创建和删除开关时自动维护，可用于状态重置的参考。

```typescript
// 创建开关后，initialStatus 自动记录初始值
master.createSwitchs(["a", "b", "c"], ["a"]);
console.log(master.initialStatus);
// { a: true, b: false, c: false }
```

#### `master.reset()`

将所有开关恢复到创建时的初始状态。

```typescript
master.openByIds(["a", "b", "c"]); // 全部打开
master.reset(); // 恢复：a=true, b=false, c=false
```

---

### Hooks

> **注意：** 以下所有 Hook 应在组件的 `setup()` 同步执行阶段中调用。不要在 `setTimeout`、`await` 之后或组件外部调用，否则可能无法正确绑定组件生命周期。

#### useSwitch(id)

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

#### useSwitchWatch(id, watchFn, immediate?)

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

#### useToggle(switchIds)

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

// 批量操作
master.openByIds(["modal", "sidebar"]);
master.closeByIds(["tab-1", "tab-2", "tab-3"]);

// 重置所有开关到初始状态
master.reset();

// 动态添加开关
master.addSwitch({ id: "tooltip", initOpened: false, data: { text: "提示" } });

// 删除开关
master.deleteSwitchById("tooltip");
```

## License

[MIT](./LICENSE)
