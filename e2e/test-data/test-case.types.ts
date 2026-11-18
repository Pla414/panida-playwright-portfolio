/**
 * test-case.types.ts — shape of the test case details in every <feature>.cases.ts file.
 * The Excel reporter fills the Summary sheet and each TSN sheet from these.
 * Test steps are not listed here; they come from the step titles recorded at runtime.
 */

export interface TestCaseSpec {
  /** Must match the code at the start of the test title, e.g. "LG01". */
  tsn: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  category: "Positive" | "Negative";
  /** Groups cases in the TSN_Mapping sheet. */
  topic: string;
  description: string;
  dataTest: string;
  expected: string;
  note?: string;
}

/** One spec file = one Excel workbook. */
export interface SuiteSpec {
  /** Spec path relative to the project root. */
  specPath: string;
  /** Output name: reports/<filePrefix>_<YYYYMMDD>.xlsx */
  filePrefix: string;
  ticket: string;
  topic: string;
  module: string;
  /** Prefix for Subject in TSN_Mapping. */
  subject: string;
  role: string;
  preconditions: string;
  cases: TestCaseSpec[];
}
