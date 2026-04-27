# 三棱镜白光色散 3D 模拟 — 设计文档

日期：2026-04-27
状态：已确认，待实现

## 1. 项目目标

纯前端 3D 应用，观赏型场景，演示白光通过等边三角棱镜后发生色散、在接收屏上形成连续光谱的物理现象。要求：

- 物理大致正确（基于 Snell 定律 + Sellmeier 色散公式）
- 画面漂亮（体积光 + Bloom 辉光）
- 观赏型交互：场景固定，仅相机轨道控制（旋转/缩放）

## 2. 技术栈

- **Three.js + TypeScript + Vite**（vanilla-ts 模板）
- 仅核心依赖：`three`、`@types/three`
- 测试：`vitest`（仅覆盖物理纯函数）
- 部署：纯静态，`vite.config.ts` 设 `base: './'`，可部署 GitHub Pages / Vercel / Netlify

不引入 React / Vue / R3F：观赏型场景无 UI 组件需求，框架收益小于额外复杂度。

## 3. 架构

```
src/
├── main.ts                  # 入口：初始化 + 启动渲染循环
├── scene/
│   ├── Stage.ts             # Three.js 场景/相机/渲染器/Bloom 后处理
│   ├── Prism.ts             # 等边三角棱镜几何体（顶角 60°）
│   └── Screen.ts            # 接收屏（白色平面）
├── optics/
│   ├── dispersion.ts        # 波长 → 折射率（Sellmeier 公式，BK7 玻璃）
│   ├── wavelengthToRGB.ts   # 波长 → sRGB 颜色（Bruton 近似）
│   ├── refract.ts           # Snell 定律：入射方向 + 法线 + n1/n2 → 折射方向
│   └── traceRay.ts          # 追踪一条单波长光线穿过棱镜，返回路径段
├── render/
│   ├── VolumetricBeam.ts    # 体积光光束（半透明 billboard + shader）
│   └── SpectrumFan.ts       # 把 N 条波长光线组合成一束分光扇面
└── controls/
    └── Camera.ts            # OrbitControls 包装

tests/                       # vitest 单元测试（仅 optics/）
docs/superpowers/specs/      # 本文档所在位置
README.md
vite.config.ts
tsconfig.json
index.html
```

### 数据流（一次性计算，相机移动不重算）

1. `SpectrumFan` 在 380–750nm 均匀采样 24 条波长
2. 对每条波长：
   - `dispersion(λ)` → 折射率 n
   - `traceRay(光源, 方向, 棱镜, 屏, n)` → 折线路径（入射段、棱镜内段、出射段）+ 屏上落点
3. 路径每段交给 `VolumetricBeam` 生成体积光网格，颜色由 `wavelengthToRGB(λ)` 决定
4. `Stage` 用 `EffectComposer` + `UnrealBloomPass` 叠加辉光

## 4. 物理细节

### 4.1 色散（dispersion.ts）

BK7 冕牌玻璃，Sellmeier 公式（波长 λ 单位 μm）：

```
n²(λ) = 1 + B₁λ²/(λ²−C₁) + B₂λ²/(λ²−C₂) + B₃λ²/(λ²−C₃)
```

标准系数：
- B₁ = 1.03961212, C₁ = 0.00600069867
- B₂ = 0.231792344, C₂ = 0.0200179144
- B₃ = 1.01046945, C₃ = 103.560653

预期：n(656nm) ≈ 1.5143，n(589nm) ≈ 1.5168，n(486nm) ≈ 1.5224。

### 4.2 折射（refract.ts）

输入归一化入射方向 I、法线 N（指向入射介质一侧）、折射率比 η = n₁/n₂，按矢量形式 Snell 定律返回折射方向 T。全反射时返回 null（本场景几何不会触发，但保留接口）。

### 4.3 光线追踪（traceRay.ts）

每条波长光线：

1. 与棱镜入射面（左斜面）求交，记录入射点 P₁
2. 在 P₁ 处用 `refract` 计算进入玻璃的方向（n₁=1, n₂=n_λ）
3. 在玻璃内传播，与出射面（右斜面）求交得 P₂
4. 在 P₂ 处再次 `refract`（n₁=n_λ, n₂=1）
5. 出射光线与接收屏平面求交得 P₃

返回三段折线 [光源→P₁, P₁→P₂, P₂→P₃] 和屏上落点 P₃。

### 4.4 波长 → 颜色（wavelengthToRGB.ts）

Bruton 近似分段函数，把 380–750nm 映射到 sRGB（教学/观赏精度足够，避免引入完整 CIE 色度学复杂度）。

## 5. 渲染细节

### 5.1 体积光（VolumetricBeam.ts）

每段光线生成一个**朝向相机的拉伸 Quad/billboard**，自定义 `ShaderMaterial`：

- 沿光束中心透明度高，垂直光束方向用高斯衰减
- 颜色 = 波长 RGB
- `AdditiveBlending`，多束叠加自然变白/变彩
- 棱镜内段强度乘 0.6，体现玻璃中光束相对空气更弱的视觉感受
- `depthWrite: false`，避免半透明排序问题

### 5.2 辉光（Stage.ts）

`EffectComposer` 链：`RenderPass` → `UnrealBloomPass`（threshold ≈ 0.6, strength ≈ 0.8, radius ≈ 0.4）。

### 5.3 接收屏光斑

每条波长在屏上落点处放一个发光 Sprite（半径 ~0.05，对应波长颜色，AdditiveBlending）。24 个 Sprite 沿竖直方向排开形成柔和连续光谱带。

### 5.4 性能

物理一次性计算并缓存为 Mesh，相机移动仅重绘。约 24 波长 × 3 段 = 72 个轻量 Mesh + 24 Sprite，60fps 无压力。

## 6. 场景布局

世界坐标 Y 向上，单位约等于"分米"。

- **棱镜**：原点 (0, 0, 0)，等边三角形截面（边长 2，顶角 60° 朝上），沿 Z 轴拉伸长度 2。`MeshPhysicalMaterial`：transmission=1, ior=1.52, roughness=0, thickness=1
- **光源**：(-6, 0.3, 0) 处发出体积白光，方向 ≈ (1, -0.05, 0)，命中棱镜左斜面
- **接收屏**：(5, 0, 0)，竖直白色平面 4×3，哑光（roughness=0.9）
- **背景**：纯黑 (#000)
- **环境光**：`AmbientLight` 强度 0.05，仅用于让玻璃和屏轮廓不全黑

## 7. 相机与交互

- `OrbitControls`，目标 (0, 0, 0)
- 初始位置 (3, 2, 6)
- `enableDamping: true`
- `minDistance: 4`, `maxDistance: 15`
- 极角限制避免穿到屏后/地下
- 不开启 autoRotate

无其他交互（参数面板、拖动光源等均不在本期范围）。

## 8. 测试

仅对 `optics/` 下纯函数写 vitest 单元测试：

- **refract**：正入射方向不变；标准 30°→空气-玻璃；全反射边界返回 null（构造场景）
- **dispersion**：n(656nm) / n(589nm) / n(486nm) 匹配 BK7 标准到 4 位小数
- **traceRay**：单波长穿过等边棱镜的最小偏折角，与解析公式 δ_min = 2·arcsin(n·sin(A/2)) − A 对比，误差 < 1e-4

视觉模块（Stage / Prism / Screen / VolumetricBeam / SpectrumFan）不写自动化测试，依赖肉眼验收。

## 9. 工程化

- TypeScript `strict: true`
- `vite.config.ts` 设 `base: './'`
- `npm run dev` / `npm run build` / `npm run test`
- README 包含：项目简介、物理原理简述（一段话）、本地运行命令、部署提示

## 10. 不在本期范围（YAGNI）

- 参数面板（顶角、材质、波长数可调）
- 拖动光源/旋转棱镜
- 完整桌面/光学实验台场景
- GPU 路径追踪
- 多棱镜/反射镜组合
- 完整 CIE 色度学颜色映射

如未来需要，可在 `optics/dispersion.ts` 增加多种玻璃常数表、在 `main.ts` 接入 `lil-gui` 暴露参数 — 现有架构无需重构即可扩展。
