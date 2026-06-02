# 我的地图收集

一个独立静态网站原型，用于展示：

- 我的世界地图 / 我的中国地图切换
- 去过 / 未去过点亮状态
- 国家和省份搜索
- 中国省份展开城市列表
- 地图缩放、拖动和点击勾选

## 本地预览

从仓库根目录启动固定端口的本地预览服务：

```bash
PORT=4173 node server.js
```

如果当前环境有 `npm`，也可以运行等价快捷命令：

```bash
npm run preview:travel
```

然后打开：

- 首页入口：`http://localhost:4173/travel-collection/`
- 手机首页：`http://localhost:4173/travel-collection/mobile.html`

也可以部署为普通静态网站，入口文件是 `index.html`。
