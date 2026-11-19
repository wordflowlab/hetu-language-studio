import { createHash } from "node:crypto";
import { newProject, canonical } from "../../src/domain/model.ts";
import { digest } from "../../src/domain/shared.ts";
import * as E from "../../src/domain/engine.ts";
export const original =
  "旧站的灯亮了。她带着来信走进站台。小车在10秒内行驶20米。她只有一张车票。\n";
export const sha = (s: string | Uint8Array) =>
  createHash("sha256").update(s).digest("hex");
export const base = (r: any, key: string) => ({
  object_id: r.object.object_id,
  expected_revision: r.object.revision,
  expected_sha256: r.sha256,
  operation_key: key,
});
export const selection = (r: any) => ({
  object_id: r.object.object_id,
  revision: r.object.revision,
});
export const sourceRef = {
  kind: "resource",
  work_ref: {
    workspace_id: "workspace_test",
    kind: "novel",
    object_id: "novel_test",
  },
  resource_id: "resource_test",
  revision: 1,
  sha256: sha(original),
};
export const quote = (text = original.trim()) => {
  const at = original.indexOf(text);
  if (at < 0) throw Error("引文不存在");
  return {
    id: "evidence",
    source_index: 0,
    byte_start: Buffer.byteLength(original.slice(0, at)),
    byte_end: Buffer.byteLength(original.slice(0, at + text.length)),
    quote: text,
    attribution: "原创虚构演示材料",
  };
};
export function seedSources(c: any) {
  c.sources.set(canonical(sourceRef), {
    source_ref: sourceRef,
    resource: { body: original },
  });
}
export function scenario(): any {
  const p = newProject("旧站语言与命名");
  p.brief = "用有限音位、词根与有序规则派生地名及居民称呼。";
  p.evidence = [quote()];
  p.phonemes = [
    {
      id: "a",
      symbol: "a",
      grapheme: "a",
      category: "vowel",
      note: "示例元音",
    },
    {
      id: "n",
      symbol: "n",
      grapheme: "n",
      category: "consonant",
      note: "示例辅音",
    },
    {
      id: "k",
      symbol: "k",
      grapheme: "k",
      category: "consonant",
      note: "示例辅音",
    },
  ];
  p.lexemes = [
    {
      id: "station",
      meaning: "站点",
      part_of_speech: "noun",
      phoneme_ids: ["a", "n"],
      evidence_ids: ["evidence"],
      note: "虚构词根",
    },
    {
      id: "letter",
      meaning: "来信",
      part_of_speech: "noun",
      phoneme_ids: ["n", "a"],
      evidence_ids: ["evidence"],
      note: "虚构词根",
    },
  ];
  p.rules = [
    {
      id: "place",
      title: "地名前缀",
      kind: "prepend",
      match_ids: [],
      replacement_ids: ["k"],
      applies_to: ["noun", "name"],
      note: "显式词形约定",
    },
    {
      id: "resident",
      title: "居民后缀",
      kind: "append",
      match_ids: [],
      replacement_ids: ["a"],
      applies_to: ["noun", "name"],
      note: "显式词形约定",
    },
    {
      id: "soften",
      title: "替换起始音",
      kind: "replace",
      match_ids: ["k"],
      replacement_ids: ["n"],
      applies_to: ["noun", "name"],
      note: "单轮替换全部非重叠匹配，不按词首猜测",
    },
  ];
  p.derivations = [
    {
      id: "place-name",
      title: "站点地名",
      meaning: "旧站地名",
      ...E.derive(p, "station", ["place"]),
    },
    {
      id: "resident-name",
      title: "居民称呼",
      meaning: "旧站居民",
      ...E.derive(p, "station", ["place", "resident"]),
    },
  ];
  const tokens = [
    { kind: "derivation", ref_id: "place-name", gloss: "旧站" },
    { kind: "lexeme", ref_id: "letter", gloss: "来信" },
  ];
  p.examples = [
    {
      id: "example",
      title: "站台短语",
      tokens,
      translation: "旧站的来信（作者声明释义）",
      basis_sha256: E.exampleBasis(p, tokens),
    },
  ];
  p.notes = [
    {
      id: "note",
      target_kind: "rule",
      target_id: "place",
      target_sha256: E.targetDigest(p, "rule", "place"),
      origin: "agent",
      comment: "保留地名前缀和词根的边界。",
      status: "open",
      resolution: "",
    },
  ];
  return p;
}
export const reviewTarget = { kind: "rule", id: "place" };
export function temporary(p: any): any {
  return {
    evidence: { ...p.evidence[0], id: "temp-evidence" },
    phoneme: {
      ...p.phonemes[0],
      id: "temp-phoneme",
      symbol: "ɐ",
      grapheme: "ä",
    },
    lexeme: { ...p.lexemes[0], id: "temp-lexeme" },
    rule: { ...p.rules[0], id: "temp-rule" },
    derivation: { ...p.derivations[0], id: "temp-derivation" },
    example: { ...p.examples[0], id: "temp-example" },
    note: { ...p.notes[0], id: "temp-note" },
  };
}
export function changed(p: any) {
  return {
    action: "put_rule",
    field: "rule",
    value: { ...p.rules[0], replacement_ids: ["n"] },
  };
}
export async function refix(c: any, r: any, key: string) {
  const d = r.object.content.derivations[0],
    { derivation: next } = await c.invoke("derive", {
      ...selection(r),
      lexeme_id: d.lexeme_id,
      rule_ids: d.rule_ids,
    });
  return c.invoke("put_derivation", {
    ...base(r, key),
    derivation: { id: d.id, title: d.title, meaning: d.meaning, ...next },
  });
}
