# api-test-mcp

* API testing tool
* Generate API test plans, execute tests in batches, evaluate test results, and export API test outcomes.

### Core Features of api-test-mcp

1. Create test plans
2. Execute test tasks in batches
3. Automatically evaluate API test results
4. Export data

## Quick Start

1. **Docker Deployment**

```bash
git clone https://github.com/Actrue/api-test-mcp.git    ## Clone source code
cd api-test-mcp
docker build -t api-test-mcp .   ## Build image
docker run -p 3000:3000  api-test-mcp  ## Run container
```

2. **Integration (Example with Cherry Studio)**

Add server -> Select type **sse** -> Fill URL as http://localhost:3000/sse -> Click Save

## Source Code Build

### Environment Requirements

node >= 20

pnpm

### Build Process

```bash
git clone https://github.com/Actrue/api-test-mcp.git    ## Clone source code
cd api-test-mcp
pnpm run go  ## Start command; this will launch the SSE server on port 3000
```

## Usage Notes

It is recommended to use the following prompt words:

```txt
You are an API tester who will receive the API documentation and then create a test plan and task list based on it.
You need not only to verify if the API functions properly but also to test how well it handles incorrect data inputs.
If the user forgets to provide the test URL, please remind them.
Reply format:
[Plan Test Plan]
Call tool to create test plan
[Execute tests according to the plan]
Format: Test ID, Test Objective, Test Result.
[Generate summary and suggestions based on results]
Call tool to write summary and suggestions into a data table
[Test results, and export to Excel]
Call tool to retrieve test results
[Test Results Summary]
Summarize the entire testing process
Requirements:
Please reply in Chinese.
URL must be a complete link
```

## Supported Platforms

* Mac
* Windows
* Linux

## Technology Stack

* [fastmcp-ts](https://github.com/punkpeye/fastmcp)
* [prisma](https://www.prisma.io/)
* [xlsx](https://www.npmjs.com/package/xlsx)