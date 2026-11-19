import { artifact } from "./artifact.ts";
import { find } from "./shared.ts";
import { requireValue as need } from "../../vendor/project-store.ts";
import * as E from "./engine.ts";
export { validateDomain, validateTransition } from "./engine.ts";
export async function checkSources(p: any, sources: any[], _request: any) {}
export async function pureAction(_a: string, _i: any) {
  return undefined;
}
export async function writeProfessional(
  a: string,
  p: any,
  _s: any[],
  i: any,
  ..._rest: any[]
) {
  if (a === "record_derivation") {
    need(
      !p.derivations.some((x: any) => x.id === i.record_id),
      "派生ID已存在。",
    );
    p.derivations.push({
      id: i.record_id,
      title: i.title,
      meaning: i.meaning,
      ...E.derive(p, i.lexeme_id, i.rule_ids),
    });
    return;
  }

  throw Error("未知专业写动作。");
}
export function summaries(p: any) {
  return [
    { title: "完整专业阅读本", lines: [E.reading(p)] },
    { title: "检查与复核", lines: [JSON.stringify(E.check(p), null, 2)] },
    ...Object.entries(p)
      .filter(([k, v]) => Array.isArray(v))
      .map(([k, v]) => ({ title: k, lines: [JSON.stringify(v, null, 2)] })),
  ];
}
export async function readProfessional(
  a: string,
  p: any,
  _s: any[],
  i: any,
  _r: any,
) {
  if (a === "target_digest")
    return { target_sha256: E.targetDigest(p, i.target_kind, i.target_id) };
  if (a === "check_language") return E.check(p);

  if (a === "derive")
    return { derivation: E.derive(p, i.lexeme_id, i.rule_ids) };
  if (a === "example_basis")
    return { basis_sha256: E.exampleBasis(p, i.tokens) };
  if (a === "derivation_view") return E.derivationView(p, i.derivation_id);

  if (a === "export_reading")
    return artifact(E.reading(p), "构造语言工坊阅读本.txt", "text/plain", i);
  if (a === "export_review") {
    const { reportHTML } = await import("./report.ts");
    return artifact(
      reportHTML({ project: p }),
      "构造语言工坊审核本.html",
      "text/html",
      i,
    );
  }
}
