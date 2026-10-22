# Design System

MonoSolo 的界面设计规范：黑白极简主义与严格直角风格（Scheme A，对齐 `yuler/k41`）。

界面文案默认用中文，代码、Token、字号与组件命名使用英文。

## 设计原则

- **黑白极简**：色彩收敛至纯粹的黑白单色调。分割线采用 1px 实线，层次仅保留少量中性灰，不展开复杂的全色阶或彩色 Accent。
- **对称对调**：黑（Dark）、白（Light）两套模式共用同一批语义 Token 命名，仅对调底色与字色。
- **严格直角**：全站所有边角采用严格直角，`border-radius: 0`，不再使用任何圆角风格。
- **无障碍达标**：灰阶文字满足 WCAG AA 级对比度要求（正文对比度 ≥ 4.5:1）。

---

## 颜色体系 (Color Tokens)

全站核心收敛为 7 个基础语义颜色 Token，外加辅助状态色（`destructive`）：

| Token       | 黑 (Dark) | 白 (Light) | 用在                                         |
| :---------- | :-------- | :--------- | :------------------------------------------- |
| `ground`    | `#000000` | `#ffffff`  | 全局页面背景底色                             |
| `ink`       | `#ffffff` | `#000000`  | 主要正文字体、核心标题、高亮描边             |
| `gray`      | `#888888` | `#666666`  | 次要文字、Meta、说明文本（满足 WCAG AA 规范） |
| `line`      | `#333333` | `#e5e5e5`  | 细分割线、卡片边框、输入框边框、幽灵按钮边框 |
| `wash`      | `#111111` | `#f2f2f2`  | 浅底色、次级容器背景、列表悬浮态底色         |
| `solid`     | `#ffffff` | `#000000`  | 实心强调按钮底色、激活项高亮背景             |
| `solid-ink` | `#000000` | `#ffffff`  | 实心强调按钮文字色、激活项高亮前景色         |

> [!NOTE]
> 白底（Light Mode）下将 `gray` 设为 `#666666`，在 `#ffffff` 和 `#f2f2f2` 底色上的对比度均超过 5:1，严格满足 WCAG AA 级对比度标准。

---

## 严格直角规范 (Square Radius)

所有组件边角统一为直角，坚决去除圆角：

- 全局 `--radius` 设为 `0`，衍生的 `--radius-sm` 至 `--radius-4xl` 全部计算为 `0`。
- 注入全局强制直角规则，彻底覆盖历史组件中的 `rounded-*` 类名（含伪元素）：
  ```css
  :where(*):not([data-rounded], [data-rounded] *),
  :where(*):not([data-rounded], [data-rounded] *)::before,
  :where(*):not([data-rounded], [data-rounded] *)::after {
    border-radius: 0 !important;
  }
  ```
- 极少数需要圆形的特殊图形（如状态闪烁点、指示光标），通过 `data-rounded` 属性显式逃生。

---

## Web 前端 Token 架构 (Tailwind v4)

在 `apps/web/src/styles.css` 中分为三层架构：

### 1. 原始值层 (`:root` 与 `.dark`)
定义带 `--k41-` 前缀的无依赖原始变量，避免与第三方库或组件作用域变量冲突：
```css
:root {
  --k41-ground: #ffffff;
  --k41-ink: #000000;
  --k41-gray: #666666;
  --k41-line: #e5e5e5;
  --k41-wash: #f2f2f2;
  --k41-solid: #000000;
  --k41-solid-ink: #ffffff;
  ...
}
```

### 2. Tailwind v4 主题映射 (`@theme inline`)
将原子类映射到底层 raw Token（如 `--color-ground: var(--k41-ground)`），彻底消除自引用在 CSS 级联层中的失效风险：
```css
@theme inline {
  --color-ground: var(--k41-ground);
  --color-ink: var(--k41-ink);
  --color-gray: var(--k41-gray);
  --color-line: var(--k41-line);
  --color-wash: var(--k41-wash);
  --color-solid: var(--k41-solid);
  --color-solid-ink: var(--k41-solid-ink);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-border: var(--border);
}
```

### 3. 组件语义对齐层 (shadcn / Base UI)
保持既有组件体系无缝工作，将通用语义映射到底层黑白规范：
- `--primary`: 映射至 `var(--solid)`
- `--primary-foreground`: 映射至 `var(--solid-ink)`
- `--background`: 映射至 `var(--ground)`
- `--foreground`: 映射至 `var(--ink)`
- `--border` / `--input`: 映射至 `var(--line)`
- `--muted` / `--secondary` / `--accent`: 映射至 `var(--wash)`
- `--muted-foreground`: 映射至 `var(--gray)`
- `--card` / `--popover` / `--sidebar`: 映射至 `var(--ground)`

---

## 组件交互与视觉规范

### 1. 按钮 (Button)
- **实心按钮 (`ButtonSolid` / `default`)**：背景 `solid`，文字 `solid-ink`，边框 1px `solid`，严格直角。
- **幽灵 / 边框按钮 (`ButtonGhost` / `outline`)**：背景透明或 `ground`，文字 `ink`，边框 1px `line`，hover 为 `wash` 底色。
- **禁用态**：透明度降低至 50%，禁用一切指针事件。

### 2. 卡片与容器 (Card)
- 背景 `ground`，边框 1px `line`，严格直角。
- 去除大投影与渐变，依靠 1px `line` 维持层级分界。

### 3. 输入控件 (Input & Form)
- 背景 `ground`，边框 1px `line`，文字 `ink`。
- 聚焦轮廓使用 1px `solid` 高亮，严格直角。
- 移动端默认字号兜底不小于 16px，防止 iOS Safari 自动聚焦缩放。

### 4. 主题切换 (Theme Wipe)
- 切换主题时触发基于 View Transition 的原生圆形扩散遮罩动画。
- 浏览器不支持或开启了系统减弱动态效果时平滑无动画降级。
