# API 测试工具

这是一个基于FastMCP的API测试工具，可以方便地测试各种HTTP API接口。

## 功能特性

- 支持GET/POST/PUT/DELETE等HTTP方法
- 支持查询参数(query parameters)
- 支持自定义请求头(headers)
- 支持JSON请求体(body)
- 自动处理JSON响应

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
