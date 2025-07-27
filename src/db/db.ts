import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// 数据接口定义
export interface TaskInput {
    name: string;
    method: string;
    url: string;
    query?: object;
    headers?: object;
    body?: object;
    hopeRes: string;
}

export interface TaskUpdateInput {
    name?: string;
    method?: string;
    url?: string;
    query?: object;
    headers?: object;
    body?: object;
    hopeRes?: string;
    res?: string;
    review?: string;
    suggest?: string;
    isFinish?: boolean;
    status?: boolean;
}

export interface ApiResponse<T> {
    state: number;
    message: string;
    data: T | null;
}

// 测试表数据结构
export interface TestTable {
    uuid: string;
    name: string;
    status: boolean;
    isFinish: boolean;
    createTime: string;
    updatedAt: string;
}

// 测试任务数据结构
export interface TestTask {
    uuid: string;
    testTableUuid: string;
    name: string;
    url: string;
    method: string;
    query?: object;
    headers?: object;
    body?: object;
    hopeRes: string;
    res?: string;
    review?: string;
    suggest?: string;
    isFinish: boolean;
    status: boolean;
    createTime: string;
    updatedAt: string;
}

// JSON数据库类
class JsonDatabase {
    private dataDir: string;
    private testTablesFile: string;
    private testTasksFile: string;

    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.testTablesFile = path.join(this.dataDir, '测试表.json');
        this.testTasksFile = path.join(this.dataDir, '测试任务.json');
        this.initDatabase();
    }

    /**
     * 初始化数据库，创建数据目录和文件
     */
    private async initDatabase() {
        try {
            // 创建数据目录
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // 检查并创建测试表文件
            try {
                await fs.access(this.testTablesFile);
            } catch {
                await fs.writeFile(this.testTablesFile, JSON.stringify([], null, 2));
            }
            
            // 检查并创建测试任务文件
            try {
                await fs.access(this.testTasksFile);
            } catch {
                await fs.writeFile(this.testTasksFile, JSON.stringify([], null, 2));
            }
        } catch (error) {
            console.error('初始化数据库失败:', error);
        }
    }

    /**
     * 读取测试表数据
     */
    private async readTestTables(): Promise<TestTable[]> {
        try {
            const data = await fs.readFile(this.testTablesFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('读取测试表数据失败:', error);
            return [];
        }
    }

    /**
     * 写入测试表数据
     */
    private async writeTestTables(tables: TestTable[]): Promise<void> {
        try {
            await fs.writeFile(this.testTablesFile, JSON.stringify(tables, null, 2));
        } catch (error) {
            console.error('写入测试表数据失败:', error);
            throw error;
        }
    }

    /**
     * 读取测试任务数据
     */
    private async readTestTasks(): Promise<TestTask[]> {
        try {
            const data = await fs.readFile(this.testTasksFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('读取测试任务数据失败:', error);
            return [];
        }
    }

    /**
     * 写入测试任务数据
     */
    private async writeTestTasks(tasks: TestTask[]): Promise<void> {
        try {
            await fs.writeFile(this.testTasksFile, JSON.stringify(tasks, null, 2));
        } catch (error) {
            console.error('写入测试任务数据失败:', error);
            throw error;
        }
    }

    /**
     * 生成当前时间戳
     */
    private getCurrentTimestamp(): string {
        return new Date().toISOString();
    }

    /**
     * 创建测试计划和任务
     */
    async createTestPlanWithTasks(planName: string, tasks: Array<TaskInput>): Promise<ApiResponse<{plan: TestTable, tasks: TestTask[]}>> {
        try {
            const currentTime = this.getCurrentTimestamp();
            
            // 创建测试计划
            const testPlan: TestTable = {
                uuid: randomUUID(),
                name: planName,
                status: true,
                isFinish: false,
                createTime: currentTime,
                updatedAt: currentTime
            };

            // 读取现有测试表
            const existingTables = await this.readTestTables();
            existingTables.push(testPlan);
            await this.writeTestTables(existingTables);

            // 创建测试任务
            const createdTasks: TestTask[] = tasks.map(task => ({
                uuid: randomUUID(),
                testTableUuid: testPlan.uuid,
                name: task.name,
                method: task.method,
                url: task.url,
                query: task.query,
                headers: task.headers,
                body: task.body,
                hopeRes: task.hopeRes,
                res: undefined,
                review: undefined,
                suggest: undefined,
                isFinish: false,
                status: true,
                createTime: currentTime,
                updatedAt: currentTime
            }));

            // 读取现有任务并添加新任务
            const existingTasks = await this.readTestTasks();
            existingTasks.push(...createdTasks);
            await this.writeTestTasks(existingTasks);

            return {
                state: 1,
                message: '创建成功',
                data: {
                    plan: testPlan,
                    tasks: createdTasks
                }
            };
        } catch (error) {
            return {
            state: 0,
            message: error instanceof Error ? error.message : '创建失败',
            data: null
        };
        }
    }

    /**
     * 根据UUID更新任务
     */
    async updateTaskByUuid(uuid: string, updateData: TaskUpdateInput): Promise<ApiResponse<TestTask>> {
        try {
            const tasks = await this.readTestTasks();
            const taskIndex = tasks.findIndex(task => task.uuid === uuid);
            
            if (taskIndex === -1) {
                return {
                    state: 0,
                    message: '任务不存在',
                    data: null
                };
            }

            // 更新任务数据
            const updatedTask = {
                ...tasks[taskIndex],
                ...updateData,
                updatedAt: this.getCurrentTimestamp()
            };
            
            tasks[taskIndex] = updatedTask;
            await this.writeTestTasks(tasks);

            return {
                state: 1,
                message: '更新成功',
                data: updatedTask
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '更新失败',
                data: null
            };
        }
    }

    /**
     * 根据表UUID获取任务列表
     */
    async getTasksByTableUuid(tableUuid: string): Promise<ApiResponse<TestTask[]>> {
        try {
            const tasks = await this.readTestTasks();
            const filteredTasks = tasks
                .filter(task => task.testTableUuid === tableUuid)
                .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());

            return {
                state: 1,
                message: '查询成功',
                data: filteredTasks
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '查询失败',
                data: null
            };
        }
    }

    /**
     * 获取所有测试表或根据UUID获取特定表的任务
     */
    async getAllTable(uuid?: string): Promise<ApiResponse<TestTable[] | TestTask[]>> {
        try {
            if (uuid) {
                // 先检查测试计划是否存在
                const tables = await this.readTestTables();
                const tableExists = tables.some(table => table.uuid === uuid);
                
                if (!tableExists) {
                    return {
                        state: 0,
                        message: '测试计划不存在',
                        data: null
                    };
                }
                
                const tasks = await this.readTestTasks();
                const filteredTasks = tasks.filter(task => task.testTableUuid === uuid);
                return {
                    state: 1,
                    message: '查询成功',
                    data: filteredTasks
                };
            } else {
                const tables = await this.readTestTables();
                return {
                    state: 1,
                    message: '查询成功',
                    data: tables
                };
            }
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '查询失败',
                data: null
            };
        }
    }

    /**
     * 向计划添加任务
     */
    async addTasksToPlan(uuid: string, tasks: Array<TaskInput>): Promise<ApiResponse<TestTask[]>> {
        try {
            const currentTime = this.getCurrentTimestamp();
            
            // 创建新任务
            const createdTasks: TestTask[] = tasks.map(task => ({
                uuid: randomUUID(),
                testTableUuid: uuid,
                name: task.name,
                method: task.method,
                url: task.url,
                query: task.query,
                headers: task.headers,
                body: task.body,
                hopeRes: task.hopeRes,
                res: undefined,
                review: undefined,
                suggest: undefined,
                isFinish: false,
                status: true,
                createTime: currentTime,
                updatedAt: currentTime
            }));

            // 读取现有任务并添加新任务
            const existingTasks = await this.readTestTasks();
            existingTasks.push(...createdTasks);
            await this.writeTestTasks(existingTasks);

            return {
                state: 1,
                message: `成功在${uuid}计划表增加任务`,
                data: createdTasks
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '创建失败',
                data: null
            };
        }
    }

    /**
     * 批量更新任务总结
     */
    async updateTaskWithSummary(tasks: Array<{uuid: string, summary: string, suggest?: string}>): Promise<ApiResponse<TestTask[]>> {
        try {
            const allTasks = await this.readTestTasks();
            const updatedTasks: TestTask[] = [];
            const currentTime = this.getCurrentTimestamp();

            for (const taskUpdate of tasks) {
                const taskIndex = allTasks.findIndex(task => task.uuid === taskUpdate.uuid);
                if (taskIndex !== -1) {
                    allTasks[taskIndex] = {
                        ...allTasks[taskIndex],
                        review: taskUpdate.summary,
                        suggest: taskUpdate.suggest || undefined,
                        isFinish: true,
                        status: true,
                        updatedAt: currentTime
                    };
                    updatedTasks.push(allTasks[taskIndex]);
                }
            }

            await this.writeTestTasks(allTasks);

            return {
                state: 1,
                message: `成功为${tasks.length}个任务添加总结`,
                data: updatedTasks
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '批量更新失败',
                data: null
            };
        }
    }

    /**
     * 获取所有测试计划
     */
    async getAllPlans(): Promise<ApiResponse<TestTable[]>> {
        try {
            const tables = await this.readTestTables();
            return {
                state: 1,
                message: '查询成功',
                data: tables
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '查询失败',
                data: null
            };
        }
    }

    /**
     * 根据UUID获取单个测试计划
     */
    async getTestPlanById(uuid: string): Promise<ApiResponse<TestTable>> {
        try {
            const tables = await this.readTestTables();
            const table = tables.find(table => table.uuid === uuid);
            
            if (!table) {
                return {
                    state: 0,
                    message: '测试计划不存在',
                    data: null
                };
            }

            return {
                state: 1,
                message: '查询成功',
                data: table
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '查询失败',
                data: null
            };
        }
    }

    /**
     * 根据ID获取单个测试计划（别名方法）
     */
    async getPlanById(id: string): Promise<ApiResponse<TestTable>> {
        return this.getTestPlanById(id);
    }

    /**
     * 删除测试计划（别名方法）
     */
    async deletePlan(id: string): Promise<ApiResponse<boolean>> {
        return this.deleteTestPlan(id);
    }

    /**
     * 删除测试计划及其相关任务
     */
    async deleteTestPlan(uuid: string): Promise<ApiResponse<boolean>> {
        try {
            const tables = await this.readTestTables();
            const tableIndex = tables.findIndex(table => table.uuid === uuid);
            
            if (tableIndex === -1) {
                return {
                    state: 0,
                    message: '测试计划不存在',
                    data: null
                };
            }

            // 删除测试计划
            tables.splice(tableIndex, 1);
            await this.writeTestTables(tables);

            // 删除相关任务
            const tasks = await this.readTestTasks();
            const filteredTasks = tasks.filter(task => task.testTableUuid !== uuid);
            await this.writeTestTasks(filteredTasks);

            return {
                state: 1,
                message: '删除成功',
                data: true
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '删除失败',
                data: null
            };
        }
    }

    /**
     * 获取所有测试任务
     */
    async getAllTasks(): Promise<ApiResponse<TestTask[]>> {
        try {
            const tasks = await this.readTestTasks();
            return {
                state: 1,
                message: '查询成功',
                data: tasks
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '查询失败',
                data: null
            };
        }
    }

    /**
     * 根据UUID获取单个测试任务
     */
    async getTaskById(uuid: string): Promise<ApiResponse<TestTask>> {
        try {
            const tasks = await this.readTestTasks();
            const task = tasks.find(task => task.uuid === uuid);
            
            if (!task) {
                return {
                    state: 0,
                    message: '测试任务不存在',
                    data: null
                };
            }

            return {
                state: 1,
                message: '查询成功',
                data: task
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '查询失败',
                data: null
            };
        }
    }

    /**
     * 删除测试任务
     */
    async deleteTask(uuid: string): Promise<ApiResponse<boolean>> {
        try {
            const tasks = await this.readTestTasks();
            const taskIndex = tasks.findIndex(task => task.uuid === uuid);
            
            if (taskIndex === -1) {
                return {
                    state: 0,
                    message: '测试任务不存在',
                    data: null
                };
            }

            // 删除任务
            tasks.splice(taskIndex, 1);
            await this.writeTestTasks(tasks);

            return {
                state: 1,
                message: '删除成功',
                data: true
            };
        } catch (error) {
            return {
                state: 0,
                message: error instanceof Error ? error.message : '删除失败',
                data: null
            };
        }
    }
}

// 创建数据库实例
const jsonDb = new JsonDatabase();

// 导出数据库客户端，保持与原有接口一致
export const dbClient = {
    createTestPlanWithTasks: jsonDb.createTestPlanWithTasks.bind(jsonDb),
    updateTaskByUuid: jsonDb.updateTaskByUuid.bind(jsonDb),
    getTasksByTableUuid: jsonDb.getTasksByTableUuid.bind(jsonDb),
    getAllTable: jsonDb.getAllTable.bind(jsonDb),
    addTasksToPlan: jsonDb.addTasksToPlan.bind(jsonDb),
    updateTaskWithSummary: jsonDb.updateTaskWithSummary.bind(jsonDb),
    getTestPlanById: jsonDb.getTestPlanById.bind(jsonDb),
    deleteTestPlan: jsonDb.deleteTestPlan.bind(jsonDb),
    getAllTasks: jsonDb.getAllTasks.bind(jsonDb),
    getTaskById: jsonDb.getTaskById.bind(jsonDb),
    deleteTask: jsonDb.deleteTask.bind(jsonDb),
    getAllPlans: jsonDb.getAllPlans.bind(jsonDb),
    getPlanById: jsonDb.getPlanById.bind(jsonDb),
    deletePlan: jsonDb.deletePlan.bind(jsonDb)
};