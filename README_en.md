# api-test-mcp

- API testing tool
- Generate API test plans, execute batch tests, evaluate test results, and export API test reports.

### Core Features of api-test-mcp

1. Create test plans
2. Execute batch test tasks
3. Automatically evaluate API test results
4. Exportable data

## Update Information

### June 25, 2024

Migrated ORM from Prisma to Drizzle, reducing resource usage and improving performance.

Switched API from SSE to Streamable.

## Quick Start

1. Docker Deployment

```bash
git clone https://github.com/Actrue/api-test-mcp.git  ## Clone source code
cd api-test-mcp
docker build -t api-test-mcp .   ## Build image
docker run -p 3000:3000 -v $(pwd)/data:/usr/src/app/data api-test-mcp  ## Run image (the /data directory is the project's data storage directory)
```

Integration (e.g., Cherry Studio)

Add Server -> Select type as "StreamableHttp" -> Enter URL: http://localhost:3000/mcp -> Click Save

## Source Code Build

### Environment Requirements

Node >= 20

PNPM

### Build Process

```bash
git clone https://github.com/Actrue/api-test-mcp.git  ## Clone source code
cd api-test-mcp
pnpm run go  ## Start command (this will launch the SSE server on port 3000)
```

## Usage Notes

Recommended to use with the following prompt:

```txt
You are an API tester. You will receive API documentation and create test plans and tasks based on it.
You need to verify both the functionality of the API and its ability to handle incorrect data properly.
If the user forgets to provide a test URL, remind them.

Response format:
[Plan Test]
Call the tool to create an API test plan.
[Execute Tests According to Plan]
Format: Test ID, Test Objective, Test Result.
[Generate Summary and Recommendations Based on Results]
Call the tool to write the summary and recommendations into the data table.
[Export Test Results to Excel]
Call the tool to retrieve test results.
[Test Summary]
Summarize the overall testing situation.

Requirements:
URLs must be complete links.
```

## Supported Platforms

- Mac
- Windows
- Linux

## Tech Stack

- [fastmcp-ts](https://github.com/punkpeye/fastmcp)
- [Drizzle ORM](https://orm.drizzle.team/)
- [xlsx](https://www.npmjs.com/package/xlsx)