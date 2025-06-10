# api-test-mcp

- API testing tool
- Generates API test plans, executes tests in batches, evaluates test results, and exports API test results.

### Core Features of api-test-mcp

1. Create test plans
2. Execute test tasks in batches
3. Automatically evaluate API test results
4. Exportable data

## Update Information

### June 25, 2024

ORM migrated from Prisma to Drizzle, reducing project resource usage and improving performance.

API switched from SSE to Streamable.

## Quick Start

1. Docker deployment

```bash
git clone https://github.com/Actrue/api-test-mcp.git  ## Clone the source code
cd api-test-mcp
docker build -t api-test-mcp .   ## Build the image
docker run -p 3000:3000  api-test-mcp  ## Run the image
```

Integration (using Cherry Studio as an example)

Add server -> Select type as `streamableHttp` -> Fill in the URL as `http://localhost:3000/mcp` -> Click Save

## Source Code Build

### Environment Requirements

Node >= 20

PNPM

### Build Process

```bash
git clone https://github.com/Actrue/api-test-mcp.git  ## Clone the source code
cd api-test-mcp
pnpm run go  ## Start command. This will launch the SSE server on port 3000
```

## Usage Notes

Recommended to use with the following prompt:

```txt
You are an API tester. You will receive the API documentation for an interface and then create an API test plan and tasks based on the documentation.
You need to not only verify whether the API functions correctly but also test whether the interface can handle incorrect data properly.
If the user forgets to provide a test URL, remind them.

Response format:
[Plan Test Plan]
Call the tool to create an API test plan.
[Call the plugin to execute tests according to the plan]
Format: Test ID, Test Objective, Test Result.
[Generate summary and recommendations based on the results]
Call the tool to write the summary and recommendations into the data table.
[Test results, exported as Excel]
Call the tool to obtain the test results.
[Test Result Summary]
Summarize the entire testing process.

Requirements:
The URL must be a complete link.
```

## Supported Platforms

- Mac
- Windows
- Linux

## Tech Stack

- [fastmcp-ts](https://github.com/punkpeye/fastmcp)
- [drizzle ORM](https://orm.drizzle.team/)
- [xlsx](https://www.npmjs.com/package/xlsx)