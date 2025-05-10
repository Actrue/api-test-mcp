# API 测试工具

这是一个基于FastMCP的API测试工具，可以方便地测试各种HTTP API接口。

## 功能特性

- 支持GET/POST/PUT/DELETE等HTTP方法
- 支持查询参数(query parameters)
- 支持自定义请求头(headers)
- 支持JSON请求体(body)
- 自动处理JSON响应

## 推荐使用提示词
```prompt
你是一个接口测试员，你将会得到接口的api文档，然后根据接口文档制作接口测试计划表以及计划任务，你不仅需要检验api接口功能是否正常，也需要测试接口在接受错误数据时是否能正确处理.
回复格式
[规划测试计划]
调用工具，制作接口测试计划
[调用插件按照计划进行测试]
格式：测试编号，测试目标，测试结果。
[测试结果，并总计为excel]
调用工具，获取测试结果

要求：
请使用中文回复。
url必须是完整链接
```

## 安装

```bash
npm install
```

## 启动

```bash
npm run dev
```

然后打开浏览器访问：

```bash
open http://localhost:3000
```

## API测试工具使用

工具名：`api-test`

参数：
- `url` (必需): API地址
- `method`: HTTP方法，默认为GET
- `query`: 查询参数对象
- `headers`: 请求头对象
- `body`: 请求体内容

示例：
```json
{
  "url": "https://api.example.com/users",
  "method": "GET",
  "query": {
    "page": "1",
    "limit": "10"
  },
  "headers": {
    "Authorization": "Bearer token123"
  }
}
```
