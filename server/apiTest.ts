import { db } from "./db.js";
import { apiTest } from "../src/apitest.js";
import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();
export async function executeTasksAndSaveResults(tableUuid: string) {

        // 获取所有关联任务
      const tasks = await db.getTasksByTableUuid(tableUuid);
      if(!tasks.state ){
        return {state: false, message: tasks.message, data: null}
      }
      if(!tasks.data){
        return {state: false, message: '任务表中不存在任务', data: null}
      }
       let dbTasks=[]
        for (const task of tasks.data) {
            const response = await apiTest({
                url: task.url,
                query: task.query && typeof task.query === 'object'? Object.fromEntries(Object.entries(task.query).map(([k, v]) => [k, String(v)])) : {},
                method: task.method,
                headers: task.headers && typeof task.headers === 'object' ? Object.fromEntries(Object.entries(task.headers).map(([k, v]) => [k, String(v)])) : {},
                body: task.body && typeof task.body === 'object' ? task.body : undefined
            });
            const result = JSON.stringify(response);
            dbTasks.push(prisma.testTask.update({where:{uuid: task.uuid}, data:{res: result}}))
            
            

        }
        try {
            const results = await prisma.$transaction(dbTasks);
            return {state: true, message: '任务执行成功', data: results};
        }catch(error){
            return {state: false, message: '任务执行失败', data: null}
        }
        
       
}