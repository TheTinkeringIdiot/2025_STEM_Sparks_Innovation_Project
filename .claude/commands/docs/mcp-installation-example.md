I want this mcp:

```
$ARGUMENTS
```

Installed in /Users/silasrhyneer/.claude.json

1. Read the file. 
2. Look at the mcpServer section. It looks like this:
```
"mcpServers": {
    "static-analysis": {
      "command": "node",
      "args": [
        "/Users/silasrhyneer/Code/MCP/static-analysis/dist/index.js"
      ]
    },
    "sql": {
      "command": "node",
      "args": [
        "/Users/silasrhyneer/Code/MCP/sql/dist/index.js"
      ],
      "env": {
        "SUPABASE_CONNECTION_STRING": "postgres://postgres:5J8hUKkRdHE26nX%23@db.alqbsbrapawaewqwfggj.supabase.co:6543/postgres"
      }
    },
    "scrape": {
      "command": "node",
      "args": [
        "/Users/silasrhyneer/Code/MCP/scrape/dist/index.js"
      ]
    }
  }
```
3. Add the mcp the user identified. Different MCPs have different formats. ONLY add the one specified—make no other edits.
