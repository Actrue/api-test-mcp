# 使用官方Node.js镜像作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install

# 复制项目文件
COPY . .

# 构建项目
RUN pnpm run build

# 暴露3000端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "run", "go"]