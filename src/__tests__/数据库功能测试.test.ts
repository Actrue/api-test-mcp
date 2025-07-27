import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { dbClient, type TaskInput, type TaskUpdateInput, type TestTable, type TestTask } from '../db/db.js'

/**
 * 数据库功能测试套件
 * 测试JsonDatabase类的所有核心功能
 */
describe('数据库功能测试', () => {
  const dataDir = path.join(process.cwd(), 'data')
  const testTablesFile = path.join(dataDir, '测试表.json')
  const testTasksFile = path.join(dataDir, '测试任务.json')

  // 测试前清理和准备
  beforeEach(async () => {
    // 创建数据目录
    await fs.mkdir(dataDir, { recursive: true })
    // 清空测试文件
    await fs.writeFile(testTablesFile, JSON.stringify([], null, 2))
    await fs.writeFile(testTasksFile, JSON.stringify([], null, 2))
  })

  // 测试后清理
  afterEach(async () => {
    try {
      // 清空数据文件但保留目录
      await fs.writeFile(testTablesFile, JSON.stringify([], null, 2))
      await fs.writeFile(testTasksFile, JSON.stringify([], null, 2))
    } catch (error) {
      // 忽略清理错误
    }
  })

  /**
   * 测试创建测试计划和任务功能
   */
  describe('创建测试计划和任务', () => {
    it('应该成功创建测试计划和任务', async () => {
      const planName = '测试计划1'
      const tasks: TaskInput[] = [
        {
          name: '测试任务1',
          method: 'GET',
          url: 'https://api.example.com/users',
          hopeRes: '返回用户列表'
        },
        {
          name: '测试任务2',
          method: 'POST',
          url: 'https://api.example.com/users',
          body: { name: '张三', email: 'zhangsan@example.com' },
          hopeRes: '创建用户成功'
        }
      ]

      const result = await dbClient.createTestPlanWithTasks(planName, tasks)

      expect(result.state).toBe(1)
      expect(result.message).toBe('创建成功')
      expect(result.data).toBeDefined()
      expect(result.data?.plan.name).toBe(planName)
      expect(result.data?.tasks).toHaveLength(2)
      expect(result.data?.tasks[0].name).toBe('测试任务1')
      expect(result.data?.tasks[1].name).toBe('测试任务2')
    })

    it('创建空任务列表应该成功', async () => {
      const planName = '空测试计划'
      const tasks: TaskInput[] = []

      const result = await dbClient.createTestPlanWithTasks(planName, tasks)

      expect(result.state).toBe(1)
      expect(result.data?.plan.name).toBe(planName)
      expect(result.data?.tasks).toHaveLength(0)
    })
  })

  /**
   * 测试获取测试计划功能
   */
  describe('获取测试计划', () => {
    let testPlanId: string

    beforeEach(async () => {
      const result = await dbClient.createTestPlanWithTasks('测试计划', [])
      testPlanId = result.data!.plan.uuid
    })

    it('应该成功获取所有测试计划', async () => {
      const result = await dbClient.getAllPlans()

      expect(result.state).toBe(1)
      expect(result.message).toBe('查询成功')
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name).toBe('测试计划')
    })

    it('应该成功根据ID获取测试计划', async () => {
      const result = await dbClient.getTestPlanById(testPlanId)

      expect(result.state).toBe(1)
      expect(result.data?.name).toBe('测试计划')
      expect(result.data?.uuid).toBe(testPlanId)
    })

    it('获取不存在的测试计划应该返回错误', async () => {
      const result = await dbClient.getTestPlanById('不存在的ID')

      expect(result.state).toBe(0)
      expect(result.message).toBe('测试计划不存在')
      expect(result.data).toBeNull()
    })
  })

  /**
   * 测试任务管理功能
   */
  describe('任务管理', () => {
    let testPlanId: string
    let taskId: string

    beforeEach(async () => {
      const tasks: TaskInput[] = [
        {
          name: '测试任务',
          method: 'GET',
          url: 'https://api.example.com/test',
          hopeRes: '测试响应'
        }
      ]
      const result = await dbClient.createTestPlanWithTasks('测试计划', tasks)
      testPlanId = result.data!.plan.uuid
      taskId = result.data!.tasks[0].uuid
    })

    it('应该成功更新任务', async () => {
      const updateData: TaskUpdateInput = {
        name: '更新后的任务名称',
        res: '实际响应结果',
        review: '测试通过',
        isFinish: true
      }

      const result = await dbClient.updateTaskByUuid(taskId, updateData)

      expect(result.state).toBe(1)
      expect(result.message).toBe('更新成功')
      expect(result.data?.name).toBe('更新后的任务名称')
      expect(result.data?.res).toBe('实际响应结果')
      expect(result.data?.isFinish).toBe(true)
    })

    it('更新不存在的任务应该返回错误', async () => {
      const updateData: TaskUpdateInput = { name: '新名称' }
      const result = await dbClient.updateTaskByUuid('不存在的ID', updateData)

      expect(result.state).toBe(0)
      expect(result.message).toBe('任务不存在')
    })

    it('应该成功获取计划下的所有任务', async () => {
      const result = await dbClient.getTasksByTableUuid(testPlanId)

      expect(result.state).toBe(1)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name).toBe('测试任务')
    })

    it('应该成功向计划添加新任务', async () => {
      const newTasks: TaskInput[] = [
        {
          name: '新增任务1',
          method: 'POST',
          url: 'https://api.example.com/create',
          hopeRes: '创建成功'
        },
        {
          name: '新增任务2',
          method: 'DELETE',
          url: 'https://api.example.com/delete/1',
          hopeRes: '删除成功'
        }
      ]

      const result = await dbClient.addTasksToPlan(testPlanId, newTasks)

      expect(result.state).toBe(1)
      expect(result.data).toHaveLength(2)
      expect(result.data![0].name).toBe('新增任务1')
      expect(result.data![1].name).toBe('新增任务2')

      // 验证任务确实被添加到计划中
      const tasksResult = await dbClient.getTasksByTableUuid(testPlanId)
      expect(tasksResult.data).toHaveLength(3) // 原有1个 + 新增2个
    })

    it('应该成功批量更新任务总结', async () => {
      const summaryUpdates = [
        {
          uuid: taskId,
          summary: '测试执行完成',
          suggest: '建议优化响应时间'
        }
      ]

      const result = await dbClient.updateTaskWithSummary(summaryUpdates)

      expect(result.state).toBe(1)
      expect(result.message).toBe('成功为1个任务添加总结')
      expect(result.data).toHaveLength(1)
      expect(result.data![0].review).toBe('测试执行完成')
      expect(result.data![0].suggest).toBe('建议优化响应时间')
      expect(result.data![0].isFinish).toBe(true)
    })
  })

  /**
   * 测试删除功能
   */
  describe('删除功能', () => {
    let testPlanId: string
    let taskId: string

    beforeEach(async () => {
      const tasks: TaskInput[] = [
        {
          name: '待删除任务',
          method: 'GET',
          url: 'https://api.example.com/test',
          hopeRes: '测试响应'
        }
      ]
      const result = await dbClient.createTestPlanWithTasks('待删除计划', tasks)
      testPlanId = result.data!.plan.uuid
      taskId = result.data!.tasks[0].uuid
    })

    it('应该成功删除单个任务', async () => {
      const result = await dbClient.deleteTask(taskId)

      expect(result.state).toBe(1)
      expect(result.message).toBe('删除成功')
      expect(result.data).toBe(true)

      // 验证任务确实被删除
      const taskResult = await dbClient.getTaskById(taskId)
      expect(taskResult.state).toBe(0)
      expect(taskResult.message).toBe('测试任务不存在')
    })

    it('应该成功删除测试计划及其所有任务', async () => {
      const result = await dbClient.deleteTestPlan(testPlanId)

      expect(result.state).toBe(1)
      expect(result.message).toBe('删除成功')
      expect(result.data).toBe(true)

      // 验证计划被删除
      const planResult = await dbClient.getTestPlanById(testPlanId)
      expect(planResult.state).toBe(0)

      // 验证相关任务也被删除
      const taskResult = await dbClient.getTaskById(taskId)
      expect(taskResult.state).toBe(0)
    })

    it('删除不存在的计划应该返回错误', async () => {
      const result = await dbClient.deleteTestPlan('不存在的ID')

      expect(result.state).toBe(0)
      expect(result.message).toBe('测试计划不存在')
    })

    it('删除不存在的任务应该返回错误', async () => {
      const result = await dbClient.deleteTask('不存在的ID')

      expect(result.state).toBe(0)
      expect(result.message).toBe('测试任务不存在')
    })
  })

  /**
   * 测试数据完整性
   */
  describe('数据完整性测试', () => {
    it('创建的数据应该包含必要的字段', async () => {
      const tasks: TaskInput[] = [
        {
          name: '完整性测试任务',
          method: 'GET',
          url: 'https://api.example.com/test',
          query: { page: 1, limit: 10 },
          headers: { 'Authorization': 'Bearer token' },
          body: { test: 'data' },
          hopeRes: '期望响应'
        }
      ]

      const result = await dbClient.createTestPlanWithTasks('完整性测试计划', tasks)
      const plan = result.data!.plan
      const task = result.data!.tasks[0]

      // 验证计划字段
      expect(plan.uuid).toBeDefined()
      expect(plan.name).toBe('完整性测试计划')
      expect(plan.status).toBe(true)
      expect(plan.isFinish).toBe(false)
      expect(plan.createTime).toBeDefined()
      expect(plan.updatedAt).toBeDefined()

      // 验证任务字段
      expect(task.uuid).toBeDefined()
      expect(task.testTableUuid).toBe(plan.uuid)
      expect(task.name).toBe('完整性测试任务')
      expect(task.method).toBe('GET')
      expect(task.url).toBe('https://api.example.com/test')
      expect(task.query).toEqual({ page: 1, limit: 10 })
      expect(task.headers).toEqual({ 'Authorization': 'Bearer token' })
      expect(task.body).toEqual({ test: 'data' })
      expect(task.hopeRes).toBe('期望响应')
      expect(task.isFinish).toBe(false)
      expect(task.status).toBe(true)
      expect(task.createTime).toBeDefined()
      expect(task.updatedAt).toBeDefined()
    })

    it('时间戳应该是有效的ISO格式', async () => {
      const result = await dbClient.createTestPlanWithTasks('时间测试', [])
      const plan = result.data!.plan

      expect(() => new Date(plan.createTime)).not.toThrow()
      expect(() => new Date(plan.updatedAt)).not.toThrow()
      expect(new Date(plan.createTime).toISOString()).toBe(plan.createTime)
      expect(new Date(plan.updatedAt).toISOString()).toBe(plan.updatedAt)
    })
  })
})