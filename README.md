# Prism Light Dispersion

3D 模拟白光通过 BK7 等边三角棱镜的色散现象，纯前端观赏型场景。

## 物理原理

不同波长的可见光在玻璃中的折射率不同（色散），白光经棱镜两次折射后被分解为连续光谱，在接收屏上呈现彩虹带。本项目用 Sellmeier 公式计算 BK7 玻璃折射率，对 380–750nm 采样 24 条波长进行光线追踪，体积光 + Bloom 后处理呈现视觉效果。

## 运行

```
npm install
npm run dev
npm run test
npm run build
```

## 项目结构

- `src/optics/` — 与 Three.js 解耦的物理纯函数（Sellmeier、Snell、波长→RGB、光线追踪），单测覆盖
- `src/scene/` — 棱镜、屏、舞台（Bloom 后处理）
- `src/render/` — 体积光段与光谱扇面
- `src/controls/` — 相机轨道控制
- `tests/` — vitest 单测

## 部署

`npm run build` 产出 `dist/`，纯静态文件可直接部署到 GitHub Pages、Vercel、Netlify 等。`vite.config.ts` 中 `base: './'` 已就绪，子路径部署也可用。
