/**
 * excel-test-result.ts — Playwright reporter that writes one Excel test result per spec file.
 *
 *   e2e/ui/login.spec.ts          → reports/TestResult_Login_<YYYYMMDD>.xlsx
 *   e2e/ui/inventory.spec.ts      → reports/TestResult_Inventory_<YYYYMMDD>.xlsx
 *   e2e/ui/cart.spec.ts           → reports/TestResult_Cart_<YYYYMMDD>.xlsx
 *   e2e/ui/checkout.spec.ts       → reports/TestResult_Checkout_<YYYYMMDD>.xlsx
 *   e2e/ui/user-journey.spec.ts   → reports/TestResult_UserJourney_<YYYYMMDD>.xlsx
 *   e2e/api-tests/users.spec.ts   → reports/TestResult_UsersApi_<YYYYMMDD>.xlsx
 *   (same name again → _2, _3 …) — only specs that ran in this execution get a file.
 *
 * Each file is a copy of e2e/templates/TestResult_template.xlsx with:
 *   Summary        one row per test case (from <feature>.cases.ts) + status of this run
 *   Test Progress  template formulas / chart (recalculated when Excel opens the file)
 *   TSN_Mapping    TSN ranges per topic
 *   <TSN> sheets   case details, a step table and one screenshot per step (from helpers/test.ts)
 *
 * Status: passed → Passed, failed / timedOut / interrupted → Failed, skipped → N/A, not run → To be Execute.
 * The xlsx is edited at XML level with jszip so the template's chart and formulas stay intact.
 * To add a spec: create <feature>.cases.ts and add its suite to SUITES below.
 */
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import type { FullResult, Reporter, TestCase, TestResult, TestStep } from "@playwright/test/reporter";
import { E2E_DIR, REPORTS_DIR } from "../config/paths";
import { API_CALL, STEP_SCREENSHOT, type ApiCallLog } from "../helpers/attachments";
import type { SuiteSpec, TestCaseSpec } from "../test-data/test-case.types";
import { LOGIN_SUITE } from "../test-data/login.cases";
import { INVENTORY_SUITE } from "../test-data/inventory.cases";
import { CART_SUITE } from "../test-data/cart.cases";
import { CHECKOUT_SUITE } from "../test-data/checkout.cases";
import { USER_JOURNEY_SUITE } from "../test-data/user-journey.cases";
import { USERS_API_SUITE } from "../test-data/users.cases";

const TEMPLATE = path.join(E2E_DIR, "templates", "TestResult_template.xlsx");
const TESTER = "Panida Banyen";
const OWNER = "QA Automation";

/** Spec files that produce a workbook. */
const SUITES: SuiteSpec[] = [
  LOGIN_SUITE,
  INVENTORY_SUITE,
  CART_SUITE,
  CHECKOUT_SUITE,
  USER_JOURNEY_SUITE,
  USERS_API_SUITE,
];

/** First test case row in Summary and the last row the template has styles / dropdowns for. */
const FIRST_ROW = 5;
const LAST_TEMPLATE_ROW = 57;
const SUMMARY_COLUMNS = "ABCDEFGHIJKLMNO";

/** Cell styles from the template: blue label, wrapped text, status. */
const STYLE = { label: 27, value: 61, status: 63 };

/** Screenshot width in the sheet (px), default row height (px) and EMU per px. */
const IMAGE_WIDTH = 800;
const ROW_PX = 20;
const EMU_PER_PX = 9525;

/** Max lines of a request / response body written to the sheet (the rest stays in the HTML report). */
const MAX_BODY_LINES = 80;

const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const REL_TYPE = {
  worksheet: `${NS_REL}/worksheet`,
  drawing: `${NS_REL}/drawing`,
  image: `${NS_REL}/image`,
};
const CONTENT_TYPE = {
  worksheet: "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",
  drawing: "application/vnd.openxmlformats-officedocument.drawing+xml",
};

type Status = "Passed" | "Failed" | "N/A" | "To be Execute";

const STATUS_OF: Record<TestResult["status"], Status> = {
  passed: "Passed",
  failed: "Failed",
  timedOut: "Failed",
  interrupted: "Failed",
  skipped: "N/A",
};

/** One step of a test run. */
interface StepRun {
  title: string;
  status: Status;
  durationMs: number;
  error?: string;
  screenshot?: Buffer;
  /** Request / response of API calls made in this step (helpers/api-log.ts). */
  apiCalls: ApiCallLog[];
}

/** Final result of one test case in this run (after retries). */
interface RunResult {
  status: Status;
  title: string;
  startTime: string;
  durationMs: number;
  retry: number;
  error?: string;
  steps: StepRun[];
  /** End-of-test screenshot (config screenshot: "on"), used when no step has one. */
  finalScreenshot?: Buffer;
}

// ---------- small XML helpers ----------

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Inline string cell. */
function textCell(ref: string, text: string, style: number): string {
  if (!text) return `<c r="${ref}" s="${style}"/>`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function findCell(xml: string, ref: string): { match: RegExpExecArray; style: string } | null {
  const match = new RegExp(`<c r="${ref}"(?<attrs>[^>]*?)(?:/>|>[\\s\\S]*?</c>)`).exec(xml);
  if (!match) return null;
  const style = / s="(\d+)"/.exec(match.groups?.attrs ?? "")?.[1];
  return { match, style: style ? ` s="${style}"` : "" };
}

/** Write text into a cell that exists in the template (keeps its style). */
function setCell(xml: string, ref: string, text: string): string {
  const cell = findCell(xml, ref);
  if (!cell) throw new Error(`cell ${ref} not found in template`);
  const value = `<c r="${ref}"${cell.style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
  return xml.slice(0, cell.match.index) + value + xml.slice(cell.match.index + cell.match[0].length);
}

/** Clear a cell's value (keeps its style). */
function clearCell(xml: string, ref: string): string {
  const cell = findCell(xml, ref);
  if (!cell) return xml;
  return xml.slice(0, cell.match.index) + `<c r="${ref}"${cell.style}/>` + xml.slice(cell.match.index + cell.match[0].length);
}

/** Read a PNG's pixel size from its header. */
function pngSize(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/** Today in Bangkok time: display dd/mm/yyyy and compact yyyymmdd. */
function bangkokToday(): { display: string; compact: string } {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()).split("-");
  return { display: `${d}/${m}/${y}`, compact: `${y}${m}${d}` };
}

/** reports/<prefix>_<date>.xlsx, adding _2, _3 … if the file exists. */
function uniqueOutputPath(filePrefix: string, compactDate: string): string {
  const base = path.join(REPORTS_DIR, `${filePrefix}_${compactDate}`);
  let file = `${base}.xlsx`;
  for (let n = 2; fs.existsSync(file); n++) file = `${base}_${n}.xlsx`;
  return file;
}

/** TSN ranges per topic for TSN_Mapping, e.g. "LG01 - LG05". */
function topicGroups(cases: TestCaseSpec[]): Array<{ topic: string; range: string }> {
  const groups: Array<{ topic: string; first: string; last: string }> = [];
  for (const c of cases) {
    const group = groups.find((g) => g.topic === c.topic);
    if (group) group.last = c.tsn;
    else groups.push({ topic: c.topic, first: c.tsn, last: c.tsn });
  }
  return groups.map((g) => ({ topic: g.topic, range: g.first === g.last ? g.first : `${g.first} - ${g.last}` }));
}

/** Read an attachment as a Buffer (inline body or file path). */
function readAttachment(a: { path?: string; body?: Buffer }): Buffer | undefined {
  if (a.body) return a.body;
  if (a.path && fs.existsSync(a.path)) return fs.readFileSync(a.path);
  return undefined;
}

type Attachment = TestStep["attachments"][number];

/** Attachments with this name on a step or its children, in order
 * (Playwright records them on a nested "test.attach" step). */
function findStepAttachments(step: TestStep, name: string): Attachment[] {
  const found = step.attachments.filter((a) => a.name === name);
  for (const child of step.steps) {
    // Skip attachments that belong to a nested test.step
    if (child.category === "test.step") continue;
    found.push(...findStepAttachments(child, name));
  }
  return found;
}

/** Parse an API_CALL attachment; ignore it if it is not valid JSON. */
function readApiCall(a: Attachment): ApiCallLog | undefined {
  try {
    const body = readAttachment(a);
    return body ? (JSON.parse(body.toString("utf8")) as ApiCallLog) : undefined;
  } catch {
    return undefined;
  }
}

/** Top-level test.step entries of a run, with their status, screenshot and API calls. */
function collectSteps(result: TestResult): StepRun[] {
  return result.steps
    .filter((s: TestStep) => s.category === "test.step")
    .map((s) => {
      const shot = findStepAttachments(s, STEP_SCREENSHOT).find((a) => a.contentType === "image/png");
      return {
        title: s.title,
        status: s.error ? "Failed" : "Passed",
        durationMs: s.duration,
        error: s.error ? stripAnsi(s.error.message ?? s.error.value ?? "") : undefined,
        screenshot: shot ? readAttachment(shot) : undefined,
        apiCalls: findStepAttachments(s, API_CALL)
          .map(readApiCall)
          .filter((c): c is ApiCallLog => !!c),
      };
    });
}

/** Pretty-print a request / response body as lines (JSON indented, text as is). */
function bodyLines(body: unknown): string[] {
  if (body === undefined || body === "") return ["(empty)"];
  const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return text.split("\n");
}

/** Headers as "name: value" lines. */
function headerText(headers: Record<string, string>): string {
  const lines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
  return lines.length ? lines.join("\n") : "(none)";
}

class ExcelTestResultReporter implements Reporter {
  /** Latest result per TSN (after retries), grouped by suite. */
  private readonly results = new Map<SuiteSpec, Map<string, RunResult>>();

  /** Collect the result of every test that belongs to a suite in SUITES. */
  onTestEnd(test: TestCase, result: TestResult): void {
    const file = path.relative(process.cwd(), test.location.file).split(path.sep).join("/");
    const suite = SUITES.find((s) => s.specPath === file);
    const tsn = /^([A-Z]{2}\d+)\b/.exec(test.title)?.[1];
    if (!suite || !tsn || !suite.cases.some((c) => c.tsn === tsn)) return;

    const final = [...result.attachments].reverse().find((a) => a.name === "screenshot" && a.contentType === "image/png");
    const error = result.errors.map((e) => stripAnsi(e.message ?? e.value ?? "")).filter(Boolean).join("\n\n");
    if (!this.results.has(suite)) this.results.set(suite, new Map());
    this.results.get(suite)!.set(tsn, {
      status: STATUS_OF[result.status],
      title: test.title,
      startTime: result.startTime.toISOString(),
      durationMs: result.duration,
      retry: result.retry,
      error: error || undefined,
      steps: collectSteps(result),
      finalScreenshot: final ? readAttachment(final) : undefined,
    });
  }

  /** Write one workbook per suite that ran; never fail the test run because of Excel. */
  async onEnd(_result: FullResult): Promise<void> {
    for (const [suite, results] of this.results) {
      try {
        const file = await this.writeWorkbook(suite, results);
        console.log(`[excel-test-result] ${path.relative(process.cwd(), file)}`);
      } catch (error) {
        console.error(`[excel-test-result] ${suite.specPath}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  /** Fill Summary, Test Progress and TSN_Mapping, add one sheet per case, and save. */
  private async writeWorkbook(suite: SuiteSpec, results: Map<string, RunResult>): Promise<string> {
    const cases = suite.cases;
    const lastRow = FIRST_ROW + cases.length - 1;
    if (lastRow > LAST_TEMPLATE_ROW) {
      throw new Error(`${cases.length} cases exceed the template rows (up to row ${LAST_TEMPLATE_ROW})`);
    }

    const zip = await JSZip.loadAsync(fs.readFileSync(TEMPLATE));
    const today = bangkokToday();

    // ---------- Summary ----------
    let summary = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    summary = setCell(summary, "B1", suite.ticket);
    summary = setCell(summary, "B2", suite.topic);
    summary = setCell(summary, "B3", TESTER);

    cases.forEach((c, i) => {
      const row = FIRST_ROW + i;
      const ran = results.get(c.tsn);
      const steps = ran?.steps.length ? ran.steps.map((s, n) => `${n + 1}. ${s.title}`).join("\n") : "-";
      const remark = ran ? `Automation: ${suite.specPath} > test("${ran.title}")` : `Automation: ${suite.specPath} (not run)`;
      const values: Record<string, string> = {
        A: c.tsn,
        B: c.priority,
        C: c.category,
        D: c.description,
        E: suite.preconditions,
        F: steps,
        G: c.dataTest,
        H: c.expected,
        I: ran?.status ?? "To be Execute",
        J: c.note ? `${remark}\n${c.note}` : remark,
        K: suite.module,
        L: c.topic,
        M: c.tsn, // link to the case sheet
        N: OWNER,
        O: ran ? today.display : "",
      };
      for (const [col, value] of Object.entries(values)) {
        summary = value ? setCell(summary, `${col}${row}`, value) : clearCell(summary, `${col}${row}`);
      }
    });
    const links = cases
      .map((c, i) => `<hyperlink ref="M${FIRST_ROW + i}" location="'${c.tsn}'!A1" display="${c.tsn}"/>`)
      .join("");
    summary = summary.replace(/<hyperlinks>[\s\S]*?<\/hyperlinks>/, "");
    summary = summary.replace("<pageMargins", `<hyperlinks>${links}</hyperlinks><pageMargins`);
    zip.file("xl/worksheets/sheet1.xml", summary);

    // ---------- Test Progress ----------
    let progress = await zip.file("xl/worksheets/sheet2.xml")!.async("string");
    progress = setCell(progress, "C2", suite.module);
    zip.file("xl/worksheets/sheet2.xml", progress);

    // ---------- TSN_Mapping ----------
    let mapping = await zip.file("xl/worksheets/sheet3.xml")!.async("string");
    mapping = setCell(mapping, "A2", suite.module);
    topicGroups(cases).forEach((g, i) => {
      const row = 2 + i;
      mapping = setCell(mapping, `B${row}`, `${suite.subject} - ${g.topic}`);
      mapping = setCell(mapping, `C${row}`, suite.role);
      mapping = setCell(mapping, `D${row}`, g.range);
    });
    zip.file("xl/worksheets/sheet3.xml", mapping);

    await this.addCaseSheets(zip, suite, results, today.display, summary);

    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const out = uniqueOutputPath(suite.filePrefix, today.compact);
    // Drop folder entries jszip adds; a normal xlsx has none
    for (const [name, entry] of Object.entries(zip.files)) if (entry.dir) delete zip.files[name];
    fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
    return out;
  }

  /** Add one sheet per test case (sheet name = TSN) with details, step table and step screenshots. */
  private async addCaseSheets(
    zip: JSZip,
    suite: SuiteSpec,
    results: Map<string, RunResult>,
    testDate: string,
    summaryXml: string,
  ): Promise<void> {
    const workbookPath = "xl/workbook.xml";
    const workbookRelsPath = "xl/_rels/workbook.xml.rels";
    const typesPath = "[Content_Types].xml";
    let workbook = await zip.file(workbookPath)!.async("string");
    let workbookRels = await zip.file(workbookRelsPath)!.async("string");
    let types = await zip.file(typesPath)!.async("string");
    // Reuse the Status colours (conditional formatting) from Summary
    const statusRules = /<conditionalFormatting [^>]*>([\s\S]*?)<\/conditionalFormatting>/.exec(summaryXml)?.[1] ?? "";

    const files = Object.keys(zip.files).join(" ");
    const next = (pattern: RegExp, text: string) => Math.max(0, ...[...text.matchAll(pattern)].map((m) => Number(m[1]))) + 1;
    let sheetNo = next(/worksheets\/sheet(\d+)\.xml/g, files);
    let drawingNo = next(/drawings\/drawing(\d+)\.xml/g, files);
    let imageNo = next(/media\/image(\d+)\.png/g, files);
    let sheetId = next(/sheetId="(\d+)"/g, workbook);
    let relId = next(/Id="rId(\d+)"/g, workbookRels);

    if (!types.includes('Extension="png"')) {
      types = types.replace('<Default Extension="xml"', '<Default Extension="png" ContentType="image/png"/><Default Extension="xml"');
    }

    const newSheets: string[] = [];
    for (const c of suite.cases) {
      const ran = results.get(c.tsn);
      const actual = !ran ? "Not run in this execution" : ran.status === "Passed" ? "As expected — all assertions passed" : (ran.error ?? ran.status);

      // --- rows: case details ---
      const rows: string[] = [];
      const statusRefs: string[] = [];
      let r = 0;
      const addRow = (cells: string, lines = 1) => {
        r++;
        const ht = lines > 1 ? ` ht="${Math.min(409, lines * 15 + 3)}" customHeight="1"` : "";
        rows.push(`<row r="${r}"${ht}>${cells.replace(/\{r\}/g, String(r))}</row>`);
        return r;
      };
      const info: Array<[string, string, boolean?]> = [
        ["TSN", c.tsn],
        ["TSN Description", c.description],
        ["Priority", c.priority],
        ["Category", c.category],
        ["Topic", c.topic],
        ["Preconditions", suite.preconditions],
        ["Data Test", c.dataTest],
        ["Expected Result", c.expected],
        ["Status", ran?.status ?? "To be Execute", true],
        ["Actual Result", actual.length > 4000 ? `${actual.slice(0, 4000)}…` : actual],
        ["Test Date", ran ? testDate : ""],
        ["Start Time (UTC)", ran ? ran.startTime.replace("T", " ").replace(/\.\d+Z$/, "") : ""],
        ["Duration", ran ? `${(ran.durationMs / 1000).toFixed(1)} s` : ""],
        ["Retry", ran ? String(ran.retry) : ""],
        ["Automation", ran ? `${suite.specPath} > test("${ran.title}")` : suite.specPath],
        ["Back", "← Back to Summary"],
      ];
      let backRow = 0;
      for (const [label, value, isStatus] of info) {
        const row = addRow(
          textCell("A{r}", label, STYLE.label) + textCell("B{r}", value, isStatus ? STYLE.status : STYLE.value),
          value.split("\n").length,
        );
        if (isStatus) statusRefs.push(`B${row}`);
        if (label === "Back") backRow = row;
      }

      // --- rows: step table ---
      const steps = ran?.steps ?? [];
      addRow("");
      addRow(
        textCell("A{r}", "Step", STYLE.label) +
          textCell("B{r}", "Test Step", STYLE.label) +
          textCell("C{r}", "Status", STYLE.label) +
          textCell("D{r}", "Duration", STYLE.label),
      );
      if (steps.length === 0) addRow(textCell("A{r}", "-", STYLE.value) + textCell("B{r}", ran ? "No steps recorded" : "Not run", STYLE.value));
      steps.forEach((s, i) => {
        const text = s.error ? `${s.title}\n${s.error.split("\n")[0]}` : s.title;
        const row = addRow(
          textCell("A{r}", String(i + 1), STYLE.value) +
            textCell("B{r}", text, STYLE.value) +
            textCell("C{r}", s.status, STYLE.status) +
            textCell("D{r}", `${(s.durationMs / 1000).toFixed(1)} s`, STYLE.value),
          text.split("\n").length,
        );
        statusRefs.push(`C${row}`);
      });

      // --- rows: request / response of each API call ---
      const calls = steps.flatMap((s, i) => s.apiCalls.map((call) => ({ call, step: `Step ${i + 1} — ${s.title}` })));
      if (calls.length) {
        const labelled = (label: string, value: string) =>
          addRow(textCell("A{r}", label, STYLE.label) + textCell("B{r}", value, STYLE.value), value.split("\n").length);
        // A body is written one line per row so long JSON stays readable
        const body = (label: string, value: unknown) => {
          const lines = bodyLines(value);
          const shown = lines.slice(0, MAX_BODY_LINES);
          if (lines.length > shown.length) {
            shown.push(`… ${lines.length - shown.length} more lines (full body: HTML report → Attachments → ${API_CALL})`);
          }
          shown.forEach((line, n) => addRow(textCell("A{r}", n === 0 ? label : "", n === 0 ? STYLE.label : STYLE.value) + textCell("B{r}", line, STYLE.value)));
        };

        addRow("");
        addRow(textCell("A{r}", "API Calls", STYLE.label) + textCell("B{r}", `${calls.length} call(s) — request and response`, STYLE.value));
        calls.forEach(({ call, step }, i) => {
          addRow("");
          labelled(`Call ${i + 1}`, step);
          labelled("Request", `${call.method} ${call.url}`);
          labelled("Request Headers", headerText(call.requestHeaders));
          if (call.requestBody !== undefined) body("Request Body", call.requestBody);
          labelled("Response", `${call.status} ${call.statusText} · ${call.durationMs} ms`);
          labelled("Response Headers", headerText(call.responseHeaders));
          body("Response Body", call.responseBody);
        });
      }

      // --- rows + images: screenshot per step ---
      const shots = steps
        .map((s, i) => ({ label: `Step ${i + 1}`, title: `${s.title} — ${s.status}`, png: s.screenshot }))
        .filter((s): s is { label: string; title: string; png: Buffer } => !!s.png);
      if (shots.length === 0 && ran?.finalScreenshot) {
        shots.push({ label: "Final", title: `End of test — ${ran.status}`, png: ran.finalScreenshot });
      }
      // API tests have no page, so the Screenshots section is skipped when the case has API calls
      if (shots.length || !calls.length) {
        addRow("");
        addRow(textCell("A{r}", "Screenshots", STYLE.label) + textCell("B{r}", shots.length ? "" : "No screenshot (not run)", STYLE.value));
      }

      const anchors: string[] = [];
      const imageRels: string[] = [];
      shots.forEach((shot, i) => {
        addRow(textCell("A{r}", shot.label, STYLE.label) + textCell("B{r}", shot.title, STYLE.value));
        const { width, height } = pngSize(shot.png);
        const scale = Math.min(1, IMAGE_WIDTH / width);
        const [w, h] = [Math.round(width * scale), Math.round(height * scale)];
        // r is 1-based, drawing rows are 0-based → the image starts on the row right after the label
        anchors.push(
          `<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>` +
            `<xdr:ext cx="${w * EMU_PER_PX}" cy="${h * EMU_PER_PX}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 2}" name="${escapeXml(`${c.tsn} ${shot.label}`)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>` +
            `<xdr:blipFill><a:blip r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
            `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w * EMU_PER_PX}" cy="${h * EMU_PER_PX}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`,
        );
        zip.file(`xl/media/image${imageNo}.png`, shot.png);
        imageRels.push(`<Relationship Id="rId${i + 1}" Type="${REL_TYPE.image}" Target="../media/image${imageNo}.png"/>`);
        imageNo++;
        // Leave empty rows for the image height plus one spacer row
        r += Math.ceil(h / ROW_PX) + 1;
      });

      const sheetPath = `xl/worksheets/sheet${sheetNo}.xml`;
      let drawingTag = "";
      if (anchors.length) {
        zip.file(
          `xl/drawings/drawing${drawingNo}.xml`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
            `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${NS_REL}">` +
            anchors.join("") +
            `</xdr:wsDr>`,
        );
        zip.file(
          `xl/drawings/_rels/drawing${drawingNo}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS_PKG_REL}">${imageRels.join("")}</Relationships>`,
        );
        zip.file(
          `xl/worksheets/_rels/sheet${sheetNo}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS_PKG_REL}">` +
            `<Relationship Id="rId1" Type="${REL_TYPE.drawing}" Target="../drawings/drawing${drawingNo}.xml"/></Relationships>`,
        );
        types = types.replace("</Types>", `<Override PartName="/xl/drawings/drawing${drawingNo}.xml" ContentType="${CONTENT_TYPE.drawing}"/></Types>`);
        drawingTag = `<drawing r:id="rId1"/>`;
        drawingNo++;
      }

      zip.file(
        sheetPath,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">` +
          `<sheetViews><sheetView workbookViewId="0"/></sheetViews>` +
          `<sheetFormatPr defaultRowHeight="15"/>` +
          `<cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/>` +
          `<col min="3" max="3" width="14" customWidth="1"/><col min="4" max="4" width="12" customWidth="1"/></cols>` +
          `<sheetData>${rows.join("")}</sheetData>` +
          (statusRules ? `<conditionalFormatting sqref="${statusRefs.join(" ")}">${statusRules}</conditionalFormatting>` : "") +
          `<hyperlinks><hyperlink ref="B${backRow}" location="'Summary'!A1" display="Summary"/></hyperlinks>` +
          `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>` +
          drawingTag +
          `</worksheet>`,
      );
      types = types.replace("</Types>", `<Override PartName="/${sheetPath}" ContentType="${CONTENT_TYPE.worksheet}"/></Types>`);
      workbookRels = workbookRels.replace(
        "</Relationships>",
        `<Relationship Type="${REL_TYPE.worksheet}" Target="/${sheetPath}" Id="rId${relId}"/></Relationships>`,
      );
      newSheets.push(`<sheet xmlns:r="${NS_REL}" name="${c.tsn}" sheetId="${sheetId}" state="visible" r:id="rId${relId}"/>`);
      sheetNo++;
      sheetId++;
      relId++;
    }

    workbook = workbook.replace("</sheets>", `${newSheets.join("")}</sheets>`);
    zip.file(workbookPath, workbook);
    zip.file(workbookRelsPath, workbookRels);
    zip.file(typesPath, types);
  }
}

export default ExcelTestResultReporter;
