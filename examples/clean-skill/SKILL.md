---
name: csv-summarizer
description: Summarize a CSV file into key statistics and a short narrative.
---

# CSV Summarizer

When the user provides a CSV file:

1. Read the file and infer column types.
2. Compute count, mean, min, and max for numeric columns.
3. Return a short plain-language summary plus a markdown table.

Never modify the source file. Ask the user before writing any output file.
