import { canonical, requireValue as need } from "../../vendor/project-store.ts";
import { digest, find, unique, fixedHistory, checkNotes } from "./shared.ts";
export const spelling = (p: any, ids: string[]) =>
  ids.map((id) => find(p.phonemes, id).grapheme).join("");
export function derivationBasis(p: any, lexemeID: string, ruleIDs: string[]) {
  const lexeme = find(p.lexemes, lexemeID);
  return digest({
    lexeme,
    rules: ruleIDs.map((id) => find(p.rules, id)),
    phonemes: p.phonemes,
  });
}
export function derive(p: any, lexemeID: string, ruleIDs: string[]) {
  const lexeme = find(p.lexemes, lexemeID);
  need(ruleIDs.length <= 30, "派生超过30步预算。");
  let ids = [...lexeme.phoneme_ids];
  need(ids.length > 0 && ids.length <= 256, "词根音位长度无效。");
  const steps = [];
  for (const id of ruleIDs) {
    const r = find(p.rules, id);
    need(r.applies_to.includes(lexeme.part_of_speech), "规则不适用于该词类。");
    r.replacement_ids.forEach((x: string) => find(p.phonemes, x));
    if (r.kind === "prepend") ids = [...r.replacement_ids, ...ids];
    else if (r.kind === "append") ids = [...ids, ...r.replacement_ids];
    else {
      need(r.match_ids.length > 0, "替换匹配不能为空。");
      const next: string[] = [];
      for (let at = 0; at < ids.length;) {
        if (r.match_ids.every((x: string, k: number) => ids[at + k] === x)) {
          next.push(...r.replacement_ids);
          at += r.match_ids.length;
        } else next.push(ids[at++]);
        need(
          next.length <= 256,
          "派生超过256音位预算。",
          "hetu.budget_exceeded",
        );
      }
      ids = next;
    }
    need(
      ids.length > 0 && ids.length <= 256,
      "派生为空或超过256音位预算。",
      "hetu.budget_exceeded",
    );
    steps.push({ rule_id: id, phoneme_ids: [...ids], text: spelling(p, ids) });
  }
  return {
    lexeme_id: lexemeID,
    rule_ids: [...ruleIDs],
    basis_sha256: derivationBasis(p, lexemeID, ruleIDs),
    steps,
    phoneme_ids: ids,
    text: spelling(p, ids),
  };
}
export function exampleBasis(p: any, tokens: any[]) {
  return digest(
    tokens.map((t) =>
      t.kind === "lexeme"
        ? { token: t, lexeme: find(p.lexemes, t.ref_id), phonemes: p.phonemes }
        : {
            token: t,
            derivation: find(p.derivations, t.ref_id),
            current_basis: derivationBasis(
              p,
              find(p.derivations, t.ref_id).lexeme_id,
              find(p.derivations, t.ref_id).rule_ids,
            ),
          },
    ),
  );
}
export function derivationView(p: any, id: string) {
  const d = find(p.derivations, id),
    stale = d.basis_sha256 !== derivationBasis(p, d.lexeme_id, d.rule_ids);
  let current_preview: any = null,
    preview_error: string | null = null;
  try {
    current_preview = derive(p, d.lexeme_id, d.rule_ids);
  } catch (e) {
    preview_error = e instanceof Error ? e.message : String(e);
  }
  return {
    derivation: d,
    stale,
    current_preview,
    preview_error,
    note: "固定旧名称保留；当前预览不自动覆盖它。",
  };
}
export function targetDigest(p: any, k: string, id: string): string {
  if (k === "lexeme") {
    const x = find(p.lexemes, id);
    return digest({
      lexeme: x,
      phonemes: x.phoneme_ids.map((x: string) => find(p.phonemes, x)),
    });
  }
  if (k === "rule")
    return digest({ rule: find(p.rules, id), phonemes: p.phonemes });
  if (k === "derivation") {
    const d = find(p.derivations, id);
    return digest({
      derivation: d,
      current_basis: derivationBasis(p, d.lexeme_id, d.rule_ids),
    });
  }
  need(k === "example", "未知意见目标。");
  const e = find(p.examples, id);
  return digest({ example: e, current_basis: exampleBasis(p, e.tokens) });
}
export function validateDomain(p: any) {
  for (const x of p.lexemes) {
    need(x.phoneme_ids.length > 0, "词条须有明确音位。");
    x.phoneme_ids.forEach((id: string) => find(p.phonemes, id));
    x.evidence_ids.forEach((id: string) => find(p.evidence, id));
  }
  for (const r of p.rules) {
    unique(r.applies_to, "适用词类重复。");
    need(r.applies_to.length > 0, "规则须明确适用词类。");
    [...r.match_ids, ...r.replacement_ids].forEach((id) =>
      find(p.phonemes, id),
    );
    need(
      r.kind === "replace"
        ? r.match_ids.length > 0
        : r.match_ids.length === 0 && r.replacement_ids.length > 0,
      "前后缀须有非空添加且无匹配，替换须非空匹配。",
    );
  }
  for (const d of p.derivations) {
    find(p.lexemes, d.lexeme_id);
    d.rule_ids.forEach((id: string) => find(p.rules, id));
    d.phoneme_ids.forEach((id: string) => find(p.phonemes, id));
    need(d.steps.length === d.rule_ids.length, "派生步骤数不符。");
    d.steps.forEach((s: any, n: number) => {
      need(s.rule_id === d.rule_ids[n], "派生步骤顺序不符。");
      s.phoneme_ids.forEach((id: string) => find(p.phonemes, id));
    });
  }
  for (const e of p.examples) {
    need(e.tokens.length > 0, "例句须有逐词内容。");
    e.tokens.forEach((t: any) =>
      find(t.kind === "lexeme" ? p.lexemes : p.derivations, t.ref_id),
    );
  }
  checkNotes(p, (k, id) => targetDigest(p, k, id));
}
export function validateTransition(p: any, old?: any, _action?: string) {
  fixedHistory(p, old, ["evidence"]);
  for (const d of p.derivations) {
    const prev = old?.derivations.find((x: any) => x.id === d.id);
    if (!prev || canonical(prev) !== canonical(d)) {
      const expected = derive(p, d.lexeme_id, d.rule_ids);
      for (const k of Object.keys(expected))
        need(
          canonical(d[k]) === canonical((expected as any)[k]),
          "新派生须符合当前逐步结果及摘要：" + k,
          "hetu.stale_evidence",
        );
    }
  }
  for (const e of p.examples) {
    const prev = old?.examples.find((x: any) => x.id === e.id);
    if (!prev || canonical(prev) !== canonical(e))
      need(
        e.basis_sha256 === exampleBasis(p, e.tokens),
        "新例句依据不符。",
        "hetu.stale_evidence",
      );
  }
  for (const n of p.notes) {
    const prev = old?.notes.find((x: any) => x.id === n.id);
    if (
      !prev ||
      canonical([prev.target_kind, prev.target_id, prev.target_sha256]) !==
        canonical([n.target_kind, n.target_id, n.target_sha256])
    )
      need(
        n.target_sha256 === targetDigest(p, n.target_kind, n.target_id),
        "新意见摘要不符。",
      );
  }
}
export function check(p: any) {
  return {
    stale_derivation_ids: p.derivations
      .filter(
        (d: any) =>
          d.basis_sha256 !== derivationBasis(p, d.lexeme_id, d.rule_ids),
      )
      .map((d: any) => d.id),
    stale_example_ids: p.examples
      .filter((e: any) => e.basis_sha256 !== exampleBasis(p, e.tokens))
      .map((e: any) => e.id),
    stale_note_ids: p.notes
      .filter(
        (n: any) =>
          n.target_sha256 !== targetDigest(p, n.target_kind, n.target_id),
      )
      .map((n: any) => n.id),
    homographs: p.lexemes
      .map((l: any) => ({ id: l.id, text: spelling(p, l.phoneme_ids) }))
      .filter((x: any, _n: number, all: any[]) =>
        all.some((y) => y.id !== x.id && y.text === x.text),
      ),
    note: "同形词允许存在；明确音位派生不认证语音自然度、文化含义或翻译正确。",
  };
}
export function reading(p: any) {
  return (
    p.title +
    "\n\n音位与正字\n" +
    p.phonemes
      .map((x: any) => x.symbol + " → " + x.grapheme + " " + x.note)
      .join("\n") +
    "\n\n词典\n" +
    p.lexemes
      .map(
        (l: any) =>
          spelling(p, l.phoneme_ids) +
          " [" +
          l.part_of_speech +
          "] " +
          l.meaning +
          "\n" +
          l.note,
      )
      .join("\n\n") +
    "\n\n命名派生\n" +
    p.derivations
      .map(
        (d: any) =>
          d.title +
          "：" +
          d.text +
          " — " +
          d.meaning +
          (derivationView(p, d.id).stale ? "〔依据已变，待复核〕" : "") +
          "\n" +
          d.steps
            .map((s: any) => find(p.rules, s.rule_id).title + " → " + s.text)
            .join("\n"),
      )
      .join("\n\n") +
    "\n\n逐词例句\n" +
    p.examples
      .map(
        (e: any) =>
          e.title +
          "\n" +
          e.tokens
            .map((t: any) =>
              t.kind === "lexeme"
                ? spelling(p, find(p.lexemes, t.ref_id).phoneme_ids)
                : find(p.derivations, t.ref_id).text,
            )
            .join(" ") +
          "\n" +
          e.tokens.map((t: any) => t.gloss).join(" ") +
          "\n" +
          e.translation,
      )
      .join("\n\n")
  );
}
