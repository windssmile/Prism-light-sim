# Prism Light Dispersion

一个基于 WebGL 的 3D 光学模拟，演示白光通过重火石玻璃（SF10）等边三角棱镜后发生色散，在接收屏上呈现连续彩虹光谱的物理现象。

![Three.js](https://img.shields.io/badge/Three.js-r184-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-8.x-purple)

## 预览

黑暗舞台中，一束白色体积光从左侧射入晶莹的玻璃棱镜，经过两次折射后分裂为连续彩虹色光扇，打在右侧接收屏上形成完整光谱带，并伴随 Bloom 辉光效果。

## 物理原理

不同波长的可见光在玻璃中折射率不同（**色散**）。本项目使用 **Sellmeier 公式**计算 SF10 重火石玻璃在 380–750nm 范围内的精确折射率（红光 n≈1.72，紫光 n≈1.77），配合矢量形式的 **Snell 定律**对 48 条采样光线进行光线追踪，真实还原白光分解为连续光谱的过程。

## 技术实现

| 模块 | 说明 |
|------|------|
| `src/optics/` | 与渲染解耦的纯函数物理模块（Sellmeier 色散、Snell 折射、波长→sRGB、光线追踪） |
| `src/scene/` | 棱镜（`MeshPhysicalMaterial` 透射）、接收屏、舞台（Bloom 后处理） |
| `src/render/` | 体积光柱（自定义 ShaderMaterial + 高斯衰减）、光谱扇面（顶点色 ribbon/fan） |
| `src/controls/` | OrbitControls 相机（旋转 / 平移 / 缩放） |

**渲染策略**：光路一次性计算后缓存为 Mesh，相机移动只重绘不重算，60fps 无压力。

## 交互

| 操作 | 效果 |
|------|------|
| 左键拖拽 | 旋转视角 |
| 右键拖拽 / 双指滑动 | 平移视角 |
| 滚轮 / 捏合 | 缩放（距离 4–15） |
| 方向键 | 平移视角 |

## 本地运行

```bash
npm install
npm run dev      # 启动开发服务器
npm run test     # 运行物理模块单元测试（vitest）
npm run build    # 构建生产包 → dist/
```

## 部署

`npm run build` 产出纯静态文件，可直接部署到 GitHub Pages、Vercel、Netlify 等。`vite.config.ts` 中已设置 `base: './'`，子路径部署同样可用。
