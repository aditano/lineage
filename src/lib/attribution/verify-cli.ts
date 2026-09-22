import { CORPUS } from "./corpus.ts";
import { formatVerification, verifyCorpus } from "./evaluate.ts";

const report = verifyCorpus(CORPUS);
console.log(formatVerification(report));
if (report.failures.length) process.exitCode = 1;
