# Example SPARQL queries

Example queries for the LOD-AM data (LOD-AM/planning#24). They answer research questions
against the released data and follow the patterns of knowledge-graph
[`CONVENTIONS.md`](https://github.com/LOD-AM/knowledge-graph/blob/main/CONVENTIONS.md).
They are shown on the examples page `/query/examples/` (`content/query/examples.njk`, read by
`_data/exampleQueries.js`), each with a link that opens it in the query editor `/query/`, which
sends queries to the public endpoint (`sparqlEndpoint` in `_data/metadata.js`; planning#22).
The examples page shows the query without its header; the header fields become its text.

## Format
One query per file, `NN-short-name.rq`, starting with a header of `# key: value` lines:

| Key | Required | Meaning |
|---|---|---|
| `title` | yes | short title for the examples page |
| `question` | yes | the research question in plain English |
| `columns` | yes | the SELECT variables, in order (checked) |
| `conventions` | no | the parts of the conventions the query relies on |
| `note` | no | hints for adapting the query; several lines are joined |
| `min-rows` | no | minimum number of rows on the released data (default 1) |

A query that changes a value only filters, groups or counts. Values themselves stay as reported.

## Check
```bash
npm run check:queries            # all queries; CI runs this
node scripts/check_queries.mjs --show                         # with the first rows of each result
node scripts/check_queries.mjs --show queries/01-*.rq        # one query
```
The check runs each query with Comunica in memory against `data/published/*.ttl` and
`data/vocab/*.ttl`, without a server. It fails if a query doesn't parse, returns other columns
than its header declares, or returns fewer rows than `min-rows`. So a change to the data or
the conventions can't silently break an example. Adapt the example (or its header) together
with such a change.
