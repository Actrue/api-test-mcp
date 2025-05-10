import { FastMCP } from "fastmcp";
import { z } from "zod"; // Or any validation library that supports Standard Schema
import { apiTest } from "./apitest.js";
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
});


server.addTool({
  name: "api-test",
  description: "这是一个用于测试API的工具，需要URL参数，可选method/query/headers/body参数；",
  parameters: z.object({
    url: z.string().url(),
    method: z.string().optional(),
    query: z.record(z.string()).optional(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional()
  }),
  execute: async (args) => {
    
      // 处理单个请求
      const result = await apiTest({
        url: args.url,
        method: args.method,
        query: args.query,
        headers: args.headers,
        body: args.body
      });
      return JSON.stringify(result);
    
  },
});

server.start({
  transportType: "stdio"
});