const fs = require("fs");

const INPUT_CSV = "./io_orgs_master.csv";
const OUTPUT_JSON = "./orgs_public.json";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) =>
    r.some((v) => String(v).trim() !== "")
  );

  if (!nonEmptyRows.length) return [];

  const headers = nonEmptyRows[0].map((h) =>
    String(h).replace(/^\uFEFF/, "").trim()
  );

  return nonEmptyRows.slice(1).map((r) => {
    const obj = {};

    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? String(r[idx]).trim() : "";
    });

    return obj;
  });
}

function pick(row, keys) {
  for (const key of keys) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      String(row[key]).trim() !== ""
    ) {
      return String(row[key]).trim();
    }
  }

  return "";
}

function buildPublicRow(row, index) {
  return {
    id:
      pick(row, ["id", "ID"]) ||
      `org-${String(index + 1).padStart(4, "0")}`,

    中文名: pick(row, ["中文名", "机构中文名"]),
    外文名: pick(row, ["外文名", "英文名"]),

    机构属性: pick(row, ["机构属性", "属性"]),
    行动领域: pick(row, ["行动领域", "第一细分类"]),
    设立年份: pick(row, ["设立年份", "成立年份"]),

    所在地: pick(row, [
      "所在地",
      "所在省份+城市（细）",
      "所在省份+城市"
    ]),

    官网: pick(row, ["官网"]),
    微信公众号: pick(row, ["微信公众号"]),

    LinkedIn: pick(row, ["LinkedIn"]),
    机构介绍: pick(row, ["机构介绍"]),
    参考资料: pick(row, ["参考资料", "参考文献"])
  };
}

function main() {
  if (!fs.existsSync(INPUT_CSV)) {
    console.error("找不到 CSV 文件：", INPUT_CSV);
    return;
  }

  const text = fs
    .readFileSync(INPUT_CSV, "utf8")
    .replace(/^\uFEFF/, "");

  const rows = parseCsv(text);

  const publicRows = rows
    .map(buildPublicRow)
    .filter((x) => x.中文名 || x.外文名);

  fs.writeFileSync(
    OUTPUT_JSON,
    JSON.stringify(publicRows, null, 2),
    "utf8"
  );

  console.log("JSON 已生成：", OUTPUT_JSON);
  console.log("共", publicRows.length, "条");
}

main();