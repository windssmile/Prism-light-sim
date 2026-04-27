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
