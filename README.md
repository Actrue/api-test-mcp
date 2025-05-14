# api-test-mcp

* 接口测试工具
* 生成接口测试计划，批量执行测试，评估测试结果，导出接口测试结果。

### api-test-mcp核心功能

1. 创建测试计划
2. 批量执行测试任务
3. 自动评估接口测试结果
4. 可导出数据

　　‍

　　‍

## 快速开始

1. docker部署

```bash
git clone https://github.com/Actrue/api-test-mcp.git  ##复制源码
cd api-test-mcp
docker build -t api-test-mcp .   ##构建镜像
docker run -p 3000:3000  api-test-mcp  ##运行镜像
```

2. 接入使用（cherry studio 为例）

　　添加服务器->类型选择**sse**->url填写 http://localhost:3000/sse ->点击保存

## 源码构建

### 环境要求

　　node>=20

　　pnpm

### 构建过程

```bash
git clone https://github.com/Actrue/api-test-mcp.git  ##复制源码
cd api-test-mcp
pnpm run go  ##启动命令
```

## 使用须知

　　推荐配合以下提示词使用

```txt
你是一个接口测试员，你将会得到接口的api文档，然后根据接口文档制作接口测试计划表以及计划任务，
你不仅需要检验api接口功能是否正常，也需要测试接口在接受错误数据时是否能正确处理，
若用户忘记提供测试url，请提醒用户
回复格式
[规划测试计划]
调用工具，制作接口测试计划
[调用插件按照计划进行测试]
格式：测试编号，测试目标，测试结果。
[根据结果生成总结和建议]
调用工具，把总结和建议写入数据表汇总
[测试结果，并导出为excel]
调用工具，获取测试结果
[测试结果总结]
总结整个测试情况
要求：
请使用中文回复。
url必须是完整链接
```

## 支持平台

* Mac
* Windows
* Linux
