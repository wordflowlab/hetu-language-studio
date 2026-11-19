import { test } from "node:test";
import assert from "node:assert/strict";
import { scenario, temporary } from "./support/scenario.ts";
import { validate, clone } from "../src/domain/model.ts";
import * as E from "../src/domain/engine.ts";
test("显式前缀派生名字", () =>
  assert.equal(E.derive(scenario(), "station", ["place"]).text, "kan"));
test("前缀后缀保留逐步结果", () => {
  const v = E.derive(scenario(), "station", ["place", "resident"]);
  assert.deepEqual(
    v.steps.map((x) => x.text),
    ["kan", "kana"],
  );
});
test("规则顺序影响派生", () => {
  const p = scenario();
  assert.equal(E.derive(p, "station", ["place", "soften"]).text, "nan");
  assert.equal(E.derive(p, "station", ["soften", "place"]).text, "kan");
});
test("替换只单轮不自递归", () => {
  const p = scenario();
  p.rules[2].match_ids = ["a"];
  p.rules[2].replacement_ids = ["a", "a"];
  assert.equal(E.derive(p, "station", ["soften"]).text, "aan");
});
test("替换非重叠从左到右", () => {
  const p = scenario();
  p.lexemes[0].phoneme_ids = ["a", "a", "a"];
  p.rules[2].match_ids = ["a", "a"];
  p.rules[2].replacement_ids = ["n"];
  assert.equal(E.derive(p, "station", ["soften"]).text, "na");
});
test("空替换匹配拒绝", () => {
  const p = scenario();
  p.rules[2].match_ids = [];
  assert.throws(() => validate(p));
  assert.throws(() => E.derive(p, "station", ["soften"]));
});
test("规则不执行正则元字符", () => {
  const p = scenario();
  p.phonemes[0].grapheme = ".*";
  assert.equal(E.derive(p, "station", ["place"]).text, "k.*n");
});
test("规则词类不适用明确拒绝", () => {
  const p = scenario();
  p.rules[0].applies_to = ["verb"];
  assert.throws(() => E.derive(p, "station", ["place"]));
});
test("音位预算限制膨胀", () => {
  const p = scenario();
  p.rules[2].match_ids = ["a"];
  p.rules[2].replacement_ids = ["a", "a"];
  assert.throws(() => E.derive(p, "station", Array(9).fill("soften")));
});
test("规则步数预算明确", () =>
  assert.throws(() =>
    E.derive(scenario(), "station", Array(31).fill("place")),
  ));
test("缺音位由专业规则拒绝", () => {
  const p = scenario();
  p.lexemes[0].phoneme_ids = ["unknown"];
  assert.throws(() => validate(p));
});
test("同形不同义允许", () => {
  const p = scenario();
  p.lexemes[1].phoneme_ids = [...p.lexemes[0].phoneme_ids];
  validate(p);
  assert.equal(E.check(p).homographs.length, 2);
});
test("音位正字保留Unicode", () => {
  const p = scenario();
  p.phonemes[2].grapheme = "kʰ";
  assert.equal(E.derive(p, "station", ["place"]).text, "kʰan");
});
test("伪造派生结果拒绝保存", () => {
  const p = scenario(),
    old = clone(p);
  p.derivations[0].text = "伪造";
  assert.throws(() => E.validateTransition(p, old));
});
test("伪造派生步骤拒绝保存", () => {
  const p = scenario(),
    old = clone(p);
  p.derivations[0].steps[0].text = "伪造";
  assert.throws(() => E.validateTransition(p, old));
});
test("改规则后旧名字保持但过期", () => {
  const p = scenario(),
    old = clone(p);
  p.rules[0].replacement_ids = ["n"];
  validate(p);
  E.validateTransition(p, old);
  assert.equal(p.derivations[0].text, "kan");
  assert.equal(E.derivationView(p, "place-name").current_preview.text, "nan");
  assert.equal(E.check(p).stale_derivation_ids.length, 2);
});
test("例句依据跟随实际词形规则", () => {
  const p = scenario();
  p.rules[0].replacement_ids = ["n"];
  assert.deepEqual(E.check(p).stale_example_ids, ["example"]);
});
test("新例句不能伪造依据", () => {
  const p = scenario(),
    old = clone(p);
  p.examples[0].translation = "改释义";
  p.examples[0].basis_sha256 = "0".repeat(64);
  assert.throws(() => E.validateTransition(p, old));
});
test("删除使用中的词条拒绝", () => {
  const p = scenario();
  p.lexemes.shift();
  assert.throws(() => validate(p));
});
test("引用不存在的派生拒绝", () => {
  const p = scenario();
  p.examples[0].tokens[0].ref_id = "missing";
  assert.throws(() => validate(p));
});
test("固定意见在规则变动后过期", () => {
  const p = scenario();
  p.rules[0].note = "新说明";
  assert.deepEqual(E.check(p).stale_note_ids, ["note"]);
});
test("阅读本保留逐词注释与旧派生", () => {
  const t = E.reading(scenario());
  assert.ok(t.includes("kan"));
  assert.ok(t.includes("来信"));
  assert.ok(t.includes("作者声明释义"));
});

test("规则改为不适用后旧名字与阅读本仍可回读", () => {
  const p = scenario();
  p.rules[0].applies_to = ["verb"];
  validate(p);
  const v = E.derivationView(p, "place-name");
  assert.equal(v.current_preview, null);
  assert.ok(v.preview_error?.includes("不适用"));
  assert.ok(E.reading(p).includes("kan"));
});
