import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { testTable, testTask } from './schema.js';

const db = drizzle(process.env.DB_FILE_NAME!);

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

export const dbClient = {
    createTestPlanWithTasks,
    updateTaskByUuid,
    getTasksByTableUuid,
    getAllTable,
    addTasksToPlan,
    updateTaskWithSummary
};

async function createTestPlanWithTasks(planName: string, tasks: Array<TaskInput>) {
    try {
        const testPlan = await db.insert(testTable).values({
            name: planName
        }).returning();

        const createdTasks = await Promise.all(
            tasks.map(task => db.insert(testTask).values({
                name: task.name,
                method: task.method,
                url: task.url,
                query: task.query,
                headers: task.headers,
                body: task.body,
                hopeRes: task.hopeRes,
                testTableUuid: testPlan[0].uuid
            }).returning())
        );

        return {
            state: 1,
            message: '创建成功',
            data: {
                plan: testPlan[0],
                tasks: createdTasks.map(t => t[0])
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

async function updateTaskByUuid(uuid: string, updateData: TaskUpdateInput) {
    try {
        const updatedTask = await db.update(testTask)
            .set(updateData)
            .where(eq(testTask.uuid, uuid))
            .returning();

        return {
            state: 1,
            message: '更新成功',
            data: updatedTask[0]
        };
    } catch (error) {
        return {
            state: 0,
            message: error instanceof Error ? error.message : '更新失败',
            data: null
        };
    }
}

async function getTasksByTableUuid(tableUuid: string) {
    try {
        const tasks = await db.select()
            .from(testTask)
            .where(eq(testTask.testTableUuid, tableUuid))
            .orderBy(testTask.createTime);

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

async function getAllTable(uuid: string | undefined) {
    try {
        if (uuid) {
            const tables = await db.select()
                .from(testTable)
                .where(eq(testTable.uuid, uuid))
                .leftJoin(testTask, eq(testTask.testTableUuid, testTable.uuid));
            
            return {
                state: 1,
                message: '查询成功',
                data: tables.map(t => t.test_task)
            };
        } else {
            const tables = await db.select().from(testTable);
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

async function addTasksToPlan(uuid: string, tasks: Array<TaskInput>) {
    try {
        const createdTasks = await Promise.all(
            tasks.map(task => db.insert(testTask).values({
                name: task.name,
                method: task.method,
                url: task.url,
                query: task.query,
                headers: task.headers,
                body: task.body,
                hopeRes: task.hopeRes,
                testTableUuid: uuid
            }).returning())
        );

        return {
            state: 1,
            message: `成功在${uuid}计划表增加任务`,
            data: createdTasks.map(t => t[0])
        };
    } catch (error) {
        return {
            state: 0,
            message: error instanceof Error ? error.message : '创建失败',
            data: null
        };
    }
}

async function updateTaskWithSummary(tasks: Array<{uuid: string, summary: string, suggest?: string}>) {
    try {
        const results = await Promise.all(
            tasks.map(task => db.update(testTask)
                .set({
                    review: task.summary,
                    suggest: task.suggest || null,
                    isFinish: true,
                    status: true
                })
                .where(eq(testTask.uuid, task.uuid))
                .returning())
        );

        return {
            state: 1,
            message: `成功为${tasks.length}个任务添加总结`,
            data: results.map(r => r[0])
        };
    } catch (error) {
        return {
            state: 0,
            message: error instanceof Error ? error.message : '批量更新失败',
            data: null
        };
    }
}
