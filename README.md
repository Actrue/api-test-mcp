# API 测试工具

这是一个基于FastMCP框架的API测试工具，支持通过SSE协议进行通信，可以方便地测试各种HTTP接口。

## 功能特性

- 支持单一请求模式和批量请求模式
- 自动处理JSON和文本格式的响应
- 返回完整的响应头和响应体信息
- 支持并发执行多个请求
- 通过SSE协议提供服务，端口3000，端点/sse

## 使用方法

### 单一请求模式
```json
{
  "url": "https://api.example.com/endpoint",
  "query": {"param1": "value1"},
  "headers": {"Authorization": "Bearer token"},
  "body": {"key": "value"}
}
```

### 批量请求模式
```json
{
  "url": "https://api.example.com/endpoint",
  "requests": [
    {"query": {"param1": "value1"}},
    {"query": {"param1": "value2"}},
    {"headers": {"Authorization": "Bearer token"}}
  ]
}
```

### 启动服务
```bash
npm start
```

服务将在`http://localhost:3000/sse`提供SSE接口

## 响应格式

工具会返回JSON格式的响应，包含以下字段：
- `headers`: 响应头信息
- `body`: 响应体内容（自动解析JSON或保留原始文本）

批量请求模式下会返回一个结果数组。
