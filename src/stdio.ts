import { FastMCP } from "fastmcp";
import { z } from "zod"; // Or any validation library that supports Standard Schema
import { apiTest } from "./apitest.js";
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
});


server.addTool({
  name: "api-test",
  description: "这是一个用于测试API的工具，支持两种模式：1) 单一请求模式：需要URL参数，可选method/query/headers/body参数；2) 批量请求模式：需要URL参数和requests数组，数组中每个元素可包含独立的method/query/headers/body参数，将并发执行所有请求并返回结果。",
  parameters: z.object({
    url: z.string().url(),
    method: z.string().optional(),
    requests: z.array(z.object({
      method: z.string().optional(),
      query: z.record(z.string()).optional(),
      headers: z.record(z.string()).optional(),
      body: z.any().optional()
    })).optional(),
    query: z.record(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional()
  }),
  execute: async (args) => {
    if (args.requests) {
      // 处理多个请求
      const results = await Promise.all(args.requests.map(request => 
        apiTest({
          url: args.url,
          method: request.method || args.method,
          query: request.query || args.query,
          headers: request.headers || args.headers,
          body: request.body || args.body
        })
      ));
      return JSON.stringify(results);
    } else {
      // 处理单个请求
      const result = await apiTest({
        url: args.url,
        method: args.method,
        query: args.query,
        headers: args.headers,
        body: args.body
      });
      return JSON.stringify(result);
    }
  },
});

server.start({
  transportType: "stdio"
});