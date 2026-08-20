var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/[[path]].js
var JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8"
};
var SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS salary_cycles (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT DEFAULT '',
    salary_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    note TEXT DEFAULT '',
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_salary_cycles_status ON salary_cycles(status)`,
  `CREATE INDEX IF NOT EXISTS idx_salary_cycles_start_date ON salary_cycles(start_date)`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    salary_cycle_id TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    payment_method TEXT DEFAULT '',
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    FOREIGN KEY (salary_cycle_id) REFERENCES salary_cycles(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_cycle ON expenses(salary_cycle_id)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`,
  `CREATE TABLE IF NOT EXISTS fixed_spending (
    id TEXT PRIMARY KEY,
    salary_cycle_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    repeat_every_cycle INTEGER NOT NULL DEFAULT 0,
    is_paid INTEGER NOT NULL DEFAULT 0,
    is_skipped INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    FOREIGN KEY (salary_cycle_id) REFERENCES salary_cycles(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_fixed_spending_cycle ON fixed_spending(salary_cycle_id)`,
  `CREATE INDEX IF NOT EXISTS idx_fixed_spending_paid ON fixed_spending(is_paid)`
];
var schemaReadyPromise = null;
async function ensureTableColumn(env, tableName, columnName, definition) {
  const info = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = (info.results || []).some((column) => column.name === columnName);
  if (!hasColumn) {
    await env.DB.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
}
__name(ensureTableColumn, "ensureTableColumn");
async function ensureSchema(env) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const existingSalaryTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'salary_cycles'").first();
      if (!existingSalaryTable) {
        for (const statement of SCHEMA_STATEMENTS) {
          await env.DB.prepare(statement).run();
        }
      } else {
        await ensureTableColumn(env, "fixed_spending", "is_paid", "INTEGER NOT NULL DEFAULT 0");
        await ensureTableColumn(env, "fixed_spending", "is_skipped", "INTEGER NOT NULL DEFAULT 0");
        await ensureTableColumn(env, "fixed_spending", "sort_order", "INTEGER NOT NULL DEFAULT 0");
      }
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_fixed_spending_sort_order ON fixed_spending(sort_order)").run();
      await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_fixed_spending_skipped ON fixed_spending(is_skipped)").run();
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}
__name(ensureSchema, "ensureSchema");
var ENTITY_CONFIG = {
  "salary-cycles": {
    table: "salary_cycles",
    fields: ["start_date", "end_date", "salary_amount", "status", "note"],
    defaults: {
      end_date: "",
      salary_amount: 0,
      status: "active",
      note: ""
    },
    booleans: []
  },
  expenses: {
    table: "expenses",
    fields: ["salary_cycle_id", "date", "amount", "category", "description", "payment_method"],
    defaults: {
      description: "",
      payment_method: "",
      amount: 0
    },
    booleans: []
  },
  "fixed-spending": {
    table: "fixed_spending",
    fields: ["salary_cycle_id", "name", "amount", "category", "repeat_every_cycle", "is_paid", "is_skipped", "sort_order", "note"],
    defaults: {
      amount: 0,
      repeat_every_cycle: false,
      is_paid: false,
      is_skipped: false,
      sort_order: 0,
      note: ""
    },
    booleans: ["repeat_every_cycle", "is_paid", "is_skipped"]
  }
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}
__name(json, "json");
function error(message, status = 400) {
  return json({ error: message }, status);
}
__name(error, "error");
async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON body");
  }
}
__name(readJson, "readJson");
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
function normalizeBooleanFields(row, config) {
  if (!row) return row;
  const next = { ...row };
  config.booleans.forEach((field) => {
    next[field] = !!next[field];
  });
  return next;
}
__name(normalizeBooleanFields, "normalizeBooleanFields");
function sanitizeRecord(data, config, { includeDefaults = false } = {}) {
  const record = {};
  const source = data || {};
  config.fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      if (config.booleans.includes(field)) {
        record[field] = source[field] ? 1 : 0;
      } else if (["amount", "salary_amount", "sort_order"].includes(field)) {
        const number = Number(source[field]);
        record[field] = Number.isFinite(number) ? number : 0;
      } else {
        record[field] = source[field] ?? "";
      }
    } else if (includeDefaults && Object.prototype.hasOwnProperty.call(config.defaults, field)) {
      const defaultValue = config.defaults[field];
      record[field] = config.booleans.includes(field) ? defaultValue ? 1 : 0 : defaultValue;
    }
  });
  return record;
}
__name(sanitizeRecord, "sanitizeRecord");
function parsePath(pathname) {
  const parts = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  return {
    entityKey: parts[0],
    idOrAction: parts[1],
    extra: parts.slice(2)
  };
}
__name(parsePath, "parsePath");
function buildWhere(url, config) {
  const rawFilter = url.searchParams.get("filter");
  if (!rawFilter) return { clause: "", values: [] };
  let filter;
  try {
    filter = JSON.parse(rawFilter);
  } catch {
    return { clause: "", values: [] };
  }
  const clauses = [];
  const values = [];
  Object.entries(filter || {}).forEach(([field, value]) => {
    if (!["id", "created_date", "updated_date", ...config.fields].includes(field)) return;
    clauses.push(`${field} = ?`);
    values.push(config.booleans.includes(field) ? value ? 1 : 0 : value);
  });
  return clauses.length ? { clause: `WHERE ${clauses.join(" AND ")}`, values } : { clause: "", values: [] };
}
__name(buildWhere, "buildWhere");
function buildOrder(url, config) {
  const rawSort = url.searchParams.get("sort") || "-created_date";
  const direction = rawSort.startsWith("-") ? "DESC" : "ASC";
  const field = rawSort.replace(/^-/, "");
  const allowed = /* @__PURE__ */ new Set(["id", "created_date", "updated_date", ...config.fields]);
  if (!allowed.has(field)) return "ORDER BY created_date DESC";
  if (field === "sort_order") return `ORDER BY sort_order ${direction}, created_date DESC`;
  return `ORDER BY ${field} ${direction}`;
}
__name(buildOrder, "buildOrder");
function buildLimit(url) {
  const rawLimit = Number(url.searchParams.get("limit"));
  if (!Number.isFinite(rawLimit) || rawLimit <= 0) return "";
  return `LIMIT ${Math.min(Math.floor(rawLimit), 500)}`;
}
__name(buildLimit, "buildLimit");
async function getById(db, config, id) {
  const row = await db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).bind(id).first();
  return normalizeBooleanFields(row, config);
}
__name(getById, "getById");
async function listRecords(request, env, config) {
  const url = new URL(request.url);
  const where = buildWhere(url, config);
  const order = buildOrder(url, config);
  const limit = buildLimit(url);
  const sql = `SELECT * FROM ${config.table} ${where.clause} ${order} ${limit}`.trim();
  const result = await env.DB.prepare(sql).bind(...where.values).all();
  return json((result.results || []).map((row) => normalizeBooleanFields(row, config)));
}
__name(listRecords, "listRecords");
async function createRecord(request, env, config) {
  const body = await readJson(request);
  const created = nowIso();
  const record = sanitizeRecord(body, config, { includeDefaults: true });
  const id = crypto.randomUUID();
  const payload = {
    id,
    ...record,
    created_date: created,
    updated_date: created
  };
  const fields = Object.keys(payload);
  const placeholders = fields.map(() => "?").join(", ");
  const sql = `INSERT INTO ${config.table} (${fields.join(", ")}) VALUES (${placeholders})`;
  await env.DB.prepare(sql).bind(...fields.map((field) => payload[field])).run();
  return json(await getById(env.DB, config, id), 201);
}
__name(createRecord, "createRecord");
async function bulkCreateRecords(request, env, config) {
  const body = await readJson(request);
  if (!Array.isArray(body)) return error("Bulk create expects an array", 400);
  if (body.length === 0) return json([]);
  const createdRows = [];
  const statements = body.map((item) => {
    const created = nowIso();
    const id = crypto.randomUUID();
    const record = sanitizeRecord(item, config, { includeDefaults: true });
    const payload = {
      id,
      ...record,
      created_date: created,
      updated_date: created
    };
    createdRows.push(payload);
    const fields = Object.keys(payload);
    const placeholders = fields.map(() => "?").join(", ");
    const sql = `INSERT INTO ${config.table} (${fields.join(", ")}) VALUES (${placeholders})`;
    return env.DB.prepare(sql).bind(...fields.map((field) => payload[field]));
  });
  await env.DB.batch(statements);
  return json(createdRows.map((row) => normalizeBooleanFields(row, config)), 201);
}
__name(bulkCreateRecords, "bulkCreateRecords");
async function bulkUpdateRecords(request, env, config) {
  const body = await readJson(request);
  if (!Array.isArray(body)) return error("Bulk update expects an array", 400);
  if (body.length === 0) return json([]);
  const updated = nowIso();
  const statements = body.map((item) => {
    if (!item?.id) throw new Error("Bulk update item is missing id");
    const record = sanitizeRecord(item, config);
    const fields = Object.keys(record);
    if (fields.length === 0) {
      return env.DB.prepare(`SELECT id FROM ${config.table} WHERE id = ?`).bind(item.id);
    }
    record.updated_date = updated;
    const updateFields = Object.keys(record);
    const setClause = updateFields.map((field) => `${field} = ?`).join(", ");
    return env.DB.prepare(`UPDATE ${config.table} SET ${setClause} WHERE id = ?`).bind(...updateFields.map((field) => record[field]), item.id);
  });
  await env.DB.batch(statements);
  const ids = body.map((item) => item.id);
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await env.DB.prepare(`SELECT * FROM ${config.table} WHERE id IN (${placeholders})`).bind(...ids).all();
  const byId = new Map((rows.results || []).map((row) => [row.id, normalizeBooleanFields(row, config)]));
  return json(ids.map((id) => byId.get(id)).filter(Boolean));
}
__name(bulkUpdateRecords, "bulkUpdateRecords");
async function updateRecord(request, env, config, id) {
  const body = await readJson(request);
  const record = sanitizeRecord(body, config);
  const fields = Object.keys(record);
  if (fields.length === 0) {
    const existing = await getById(env.DB, config, id);
    return existing ? json(existing) : error("Record not found", 404);
  }
  record.updated_date = nowIso();
  const updateFields = Object.keys(record);
  const setClause = updateFields.map((field) => `${field} = ?`).join(", ");
  await env.DB.prepare(`UPDATE ${config.table} SET ${setClause} WHERE id = ?`).bind(...updateFields.map((field) => record[field]), id).run();
  const updated = await getById(env.DB, config, id);
  return updated ? json(updated) : error("Record not found", 404);
}
__name(updateRecord, "updateRecord");
async function deleteRecord(env, config, id) {
  await env.DB.prepare(`DELETE FROM ${config.table} WHERE id = ?`).bind(id).run();
  return json({ success: true, id });
}
__name(deleteRecord, "deleteRecord");
async function getDashboard(env) {
  const cycleConfig = ENTITY_CONFIG["salary-cycles"];
  const fixedConfig = ENTITY_CONFIG["fixed-spending"];
  const expenseConfig = ENTITY_CONFIG.expenses;
  const cycle = await env.DB.prepare("SELECT * FROM salary_cycles WHERE status = ? ORDER BY start_date DESC LIMIT 1").bind("active").first();
  if (!cycle) {
    return json({ cycle: null, fixed: [], expenses: [] });
  }
  const [fixedResult, expenseResult] = await Promise.all([
    env.DB.prepare("SELECT * FROM fixed_spending WHERE salary_cycle_id = ? AND is_skipped = 0 ORDER BY sort_order ASC, created_date DESC").bind(cycle.id).all(),
    env.DB.prepare("SELECT * FROM expenses WHERE salary_cycle_id = ? ORDER BY date DESC, created_date DESC").bind(cycle.id).all()
  ]);
  return json({
    cycle: normalizeBooleanFields(cycle, cycleConfig),
    fixed: (fixedResult.results || []).map((row) => normalizeBooleanFields(row, fixedConfig)),
    expenses: (expenseResult.results || []).map((row) => normalizeBooleanFields(row, expenseConfig))
  });
}
__name(getDashboard, "getDashboard");
async function handleApi(request, env) {
  if (!env.DB) {
    return error("D1 binding DB is missing. Create a D1 database and bind it as DB.", 500);
  }
  await ensureSchema(env);
  const url = new URL(request.url);
  if (url.pathname === "/api/health" || url.pathname === "/api" || url.pathname === "/api/") {
    return json({ ok: true, service: "salary-cycle-tracker", runtime: "pages-functions" });
  }
  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    return getDashboard(env);
  }
  const { entityKey, idOrAction, extra } = parsePath(url.pathname);
  const config = ENTITY_CONFIG[entityKey];
  if (!config || extra.length > 0) {
    return error("API route not found", 404);
  }
  if (request.method === "GET" && !idOrAction) return listRecords(request, env, config);
  if (request.method === "GET" && idOrAction) {
    const row = await getById(env.DB, config, idOrAction);
    return row ? json(row) : error("Record not found", 404);
  }
  if (request.method === "POST" && idOrAction === "bulk") return bulkCreateRecords(request, env, config);
  if (request.method === "PATCH" && idOrAction === "bulk") return bulkUpdateRecords(request, env, config);
  if (request.method === "POST" && !idOrAction) return createRecord(request, env, config);
  if (request.method === "PATCH" && idOrAction) return updateRecord(request, env, config, idOrAction);
  if (request.method === "DELETE" && idOrAction) return deleteRecord(env, config, idOrAction);
  return error("Method not allowed", 405);
}
__name(handleApi, "handleApi");
async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  try {
    return await handleApi(request, env);
  } catch (err) {
    console.error(err);
    return error(err?.message || "Server error", 500);
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-Xo1ONf/functionsRoutes-0.8014757745132173.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../root/.npm/_npx/c943b712072b77c4/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error2) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error2;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error2 = reduceError(e);
    const body = JSON.stringify(error2);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-ok3PS5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../root/.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-ok3PS5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.6151421898926801.mjs.map
