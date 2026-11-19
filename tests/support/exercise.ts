import assert from "node:assert/strict";
import { selection, base, changed, refix, reviewTarget } from "./scenario.ts";
export const readingAction = "export_reading";
export async function exercise(c: any, r: any, key: () => string) {
  let s = selection(r);
  await c.invoke("check_language", s);
  await c.invoke("target_digest", {
    ...s,
    target_kind: reviewTarget.kind,
    target_id: reviewTarget.id,
  });

  const result = await c.invoke("derive", {
    ...s,
    lexeme_id: "station",
    rule_ids: ["place", "soften"],
  });
  assert.equal(result.derivation.text, "nan");
  const old = await c.invoke("derivation_view", {
    ...s,
    derivation_id: "place-name",
  });
  assert.equal(old.derivation.text, "kan");
  await c.invoke("example_basis", {
    ...s,
    tokens: r.object.content.examples[0].tokens,
  });
  r = await c.invoke("record_derivation", {
    ...base(r, key()),
    lexeme_id: "letter",
    rule_ids: ["resident"],
    record_id: "new-name",
    title: "来信称呼",
    meaning: "逐步结果形成的新词",
  });
  assert.equal(r.object.content.derivations.at(-1).text, "naa");
  const change = changed(r.object.content);
  r = await c.invoke(change.action, {
    ...base(r, key()),
    [change.field]: change.value,
  });
  assert.ok(
    (
      await c.invoke("check_language", selection(r))
    ).stale_derivation_ids.includes("place-name"),
  );
  r = await refix(c, r, key());
  assert.ok(
    !(
      await c.invoke("check_language", selection(r))
    ).stale_derivation_ids.includes("place-name"),
  );
  assert.equal(
    r.object.content.derivations.find((d: any) => d.id === "place-name").text,
    "nan",
  );
  return r;
}
