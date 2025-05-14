import { FastMCP } from "fastmcp";
import { z } from "zod"; // Or any validation library that supports Standard Schema
import { apiTest } from "./apitest.js";
import { db } from "./server/db.js";
import { executeTasksAndSaveResults } from "./server/apiTest.js";
import { exportToExcel } from "./server/createExcel.js";

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

    try {
      // 处理单个请求
      const result = await apiTest({
        url: args.url,
        method: args.method,
        query: args.query,
        headers: args.headers,
        body: args.body
      });
      return JSON.stringify({
        states: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      return JSON.stringify({
        states: false,
        error: true,
        message: error instanceof Error ? error.message : '未知错误'
      });
    }

  },
});

server.addTool({
  name: "create-test-plan",
  description: "创建测试计划和关联的测试任务",
  parameters: z.object({
    planName: z.string(),
    tasks: z.array(z.object({
      name: z.string(),
      method: z.string(),
      url: z.string(),
      query: z.record(z.string()).optional(),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
      hopeRes: z.string()
    }))
  }),
  execute: async (args) => {
    console.log(args)

    try {
      const res = await db.createTestPlanWithTasks(args.planName, args.tasks);
      return JSON.stringify({
        state: 1,
        message: '创建成功',
        data: { tableData:{name:res.data?.plan.name,uuid:res.data?.plan.uuid}, taskData: res.data?.tasks.map((task: any) => ({ uuid: task.uuid, name: task.name })) }
      });
    } catch (error) {
      return JSON.stringify({
        state: 0,
        message: error instanceof Error ? error.message : '创建失败',
        data: null
      });
    }
  },
});



server.addTool({
  name: "get-test-plans",
  description: "获取所有测试计划表或指定计划表的详细信息，提供uuid时，查询指定测试计划表信息（包括测试任务），不提供uuid时，查询所有测试计划表信息（不包括测试任务）",
  parameters: z.object({
    uuid: z.string().optional()
  }),
  execute: async (args) => {
    try {
      const result = await db.getAllTable(args.uuid);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        state: false,
        message: error instanceof Error ? error.message : '查询失败',
        data: null
      });
    }
  },
});



server.addTool({
  name: "execute-test-plan",
  description: "执行指定测试计划中的所有任务并保存结果",
  parameters: z.object({
    tableUuid: z.string()
  }),
  execute: async (args) => {
    try {
      const res=await executeTasksAndSaveResults(args.tableUuid);
      return JSON.stringify({
        state: true,
        message: '执行成功',
        data: res.data?.map((item)=>{
          return {
            uuid: item.uuid,
            name: item.name,
            
            res: item.res,
          }

        })
      });
    } catch (error) {
      return JSON.stringify({
        state: false,
        message: error instanceof Error ? error.message : '执行失败',
        data:null
      });
    }
  },
});


server.addTool({
  name: "add-tasks-to-plan",
  description: "向指定测试计划中添加多个测试任务",
  parameters: z.object({
    uuid: z.string(),
    tasks: z.array(z.object({
      name: z.string(),
      method: z.string(),
      url: z.string(),
      query: z.record(z.string()).optional(),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
      hopeRes: z.string()
    }))
  }),
  execute: async (args) => {
    try {
      await db.addTasksToPlan(args.uuid, args.tasks);
      return JSON.stringify({
        state: true,
        message: '添加任务成功'
      });
    } catch (error) {
      return JSON.stringify({
        state: false,
        message: error instanceof Error ? error.message : '添加任务失败'
      });
    }
  },
});


server.addTool({
  name: "batch-update-task-summaries",
  description: "批量更新多个任务的总结和建议，并将任务标记为已完成",
  parameters: z.object({
    tasks: z.array(z.object({
      uuid: z.string(),
      summary: z.string(),
      suggest: z.string().optional()
    }))
  }),
  execute: async (args) => {
    try {
     await db.updateTaskWithSummary(args.tasks);
      return JSON.stringify({

        state: true,
        message: '批量更新成功',

      })
    } catch (error) {
      return JSON.stringify({
        state: false,
        message: error instanceof Error ? error.message : '批量更新失败',
        data: null
      });
    }
  },
});

server.addTool({
  name: "update-task",
  description: "更新指定任务的信息",
  parameters: z.object({
    uuid: z.string(),
    updateData: z.object({
      name: z.string().optional(),
      method: z.string().optional(),
      url: z.string().optional(),
      query: z.record(z.string()).optional(),
      headers: z.record(z.string()).optional(),
      body: z.any().optional(),
      hopeRes: z.string().optional(),
      res: z.string().optional(),
      review: z.string().optional(),
      suggest: z.string().optional(),
      isFinish: z.boolean().optional(),
      status: z.boolean().optional()
    })
  }),
  execute: async (args) => {
    try {
      await db.updateTaskByUuid(args.uuid, args.updateData);
      return JSON.stringify({
        code: 1,
        message: '更新成功'
      });
    } catch (error) {
      return JSON.stringify({
        code: 0,
        message: error instanceof Error ? error.message : '更新失败'
      });
    }
  },
});

server.addTool({
  name: "export-test-results",
  description: "将指定测试计划的任务结果导出到Excel文件",
  parameters: z.object({
    uuid: z.string()
  }),
  execute: async (args) => {
    try {
      const filePath = await exportToExcel(args.uuid);
      return JSON.stringify({
        state: true,
        message: '导出成功',
        filePath: filePath.data
      });
    } catch (error) {
      return JSON.stringify({
        state: false,
        message: error instanceof Error ? error.message : '导出Excel失败'
      });
    }
  },
});






server.start({
  transportType: "stdio"
});