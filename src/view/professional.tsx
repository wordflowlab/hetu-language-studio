import React, { useState } from "react";
import { useProfessionalReport } from "./professional-state.ts";
import { FixedNotes, Delivery, targetsOf } from "./professional-parts.tsx";
const pos: any = {
    noun: "名词",
    verb: "动词",
    adjective: "形容词",
    particle: "虚词",
    name: "专名",
  },
  kind: any = { prepend: "加前缀", append: "加后缀", replace: "单轮替换" };
export function ProfessionalView(props: any) {
  const { p, tab, run, show, write, invoke, selection } = props,
    { report, error } = useProfessionalReport(props, "check_language"),
    [chosen, setChosen] = useState("");
  const d = p.derivations.find((x: any) => x.id === chosen) ?? p.derivations[0],
    spell = (ids: string[]) =>
      ids
        .map(
          (id) =>
            p.phonemes.find((x: any) => x.id === id)?.grapheme ?? "〔缺音位〕",
        )
        .join("");
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {tab === 0 && (
        <div className="work-layout">
          <div className="reading">
            <h3>词典</h3>
            {p.lexemes.map((x: any) => (
              <section key={x.id}>
                <h3>{spell(x.phoneme_ids)}</h3>
                <p>{x.meaning}</p>
                <p className="annotation">
                  {pos[x.part_of_speech]} {x.note}
                </p>
              </section>
            ))}
            <h3>已经固定的名字</h3>
            {p.derivations.map((x: any) => (
              <section key={x.id}>
                <h3>
                  {x.title}：{x.text}
                </h3>
                <p>{x.meaning}</p>
                <p className="annotation">
                  {report?.stale_derivation_ids.includes(x.id)
                    ? "规则或词根变化，旧名字待复核"
                    : "依据已固定"}
                </p>
              </section>
            ))}
            {!p.lexemes.length && (
              <p>尚无词根。让AI从作品世界和命名目标准备。</p>
            )}
          </div>
          <aside className="side">
            <h3>本次语言</h3>
            <p>{p.brief}</p>
            <p>
              {p.phonemes.length} 个音位，{p.rules.length} 条规则
            </p>
            <p className="muted">
              派生保留音位边界与逐步结果，不把字数当音节。
            </p>
          </aside>
        </div>
      )}
      {tab === 1 && (
        <>
          <h3>音位与正字</h3>
          <table>
            <thead>
              <tr>
                <th>音位</th>
                <th>正字</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {p.phonemes.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.symbol}</td>
                  <td>{x.grapheme}</td>
                  <td>{x.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>词根及形态规则</h3>
          {p.rules.map((r: any) => (
            <article key={r.id}>
              <h3>{r.title}</h3>
              <p>
                {kind[r.kind]}{" "}
                {r.kind === "replace" ? spell(r.match_ids) + " → " : ""}
                {spell(r.replacement_ids) || "删除匹配"}
              </p>
              <p>{r.applies_to.map((x: string) => pos[x]).join("、")}</p>
              <p className="muted">{r.note}</p>
            </article>
          ))}
        </>
      )}
      {tab === 2 && (
        <>
          {d ? (
            <>
              <label>
                命名派生
                <select
                  aria-label="命名派生"
                  value={d.id}
                  onChange={(e) => setChosen(e.target.value)}
                >
                  {p.derivations.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="reading">
                <h3>{d.text}</h3>
                <p>{d.meaning}</p>
                <ol>
                  {d.steps.map((s: any, n: number) => (
                    <li key={n}>
                      {p.rules.find((r: any) => r.id === s.rule_id)?.title} →{" "}
                      {s.text}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="actions">
                <button
                  onClick={() =>
                    void run(() =>
                      show("derivation_view", { derivation_id: d.id }),
                    )
                  }
                >
                  对照固定名字与当前规则
                </button>
                <button
                  onClick={() =>
                    void run(async () => {
                      const { derivation: next } = await invoke("derive", {
                        ...selection(),
                        lexeme_id: d.lexeme_id,
                        rule_ids: d.rule_ids,
                      });
                      await write("put_derivation", {
                        derivation: {
                          id: d.id,
                          title: d.title,
                          meaning: d.meaning,
                          ...next,
                        },
                      });
                    })
                  }
                >
                  重新固定所选派生
                </button>
              </div>
              <p className="muted">
                只有明确重新固定才更新这个名字；其他名字与旧修订保留。
              </p>
            </>
          ) : (
            <p>尚无命名派生，让AI先选择词根和有序规则。</p>
          )}
        </>
      )}
      {tab === 3 && (
        <>
          {p.examples.map((e: any) => (
            <article key={e.id}>
              <h3>{e.title}</h3>
              <p className="book-copy">
                {e.tokens
                  .map((t: any) =>
                    t.kind === "lexeme"
                      ? spell(
                          p.lexemes.find((x: any) => x.id === t.ref_id)
                            .phoneme_ids,
                        )
                      : p.derivations.find((x: any) => x.id === t.ref_id).text,
                  )
                  .join(" ")}
              </p>
              <p>{e.tokens.map((t: any) => t.gloss).join("　")}</p>
              <p>{e.translation}</p>
              <p
                className={
                  report?.stale_example_ids.includes(e.id) ? "warning" : "muted"
                }
              >
                {report?.stale_example_ids.includes(e.id)
                  ? "例句依据已变化，待复核"
                  : "明确逐词注释"}
              </p>
              <button
                onClick={() =>
                  void run(async () => {
                    const x = await invoke("example_basis", {
                      ...selection(),
                      tokens: e.tokens,
                    });
                    await write("put_example", {
                      example: { ...e, basis_sha256: x.basis_sha256 },
                    });
                  })
                }
              >
                重新固定该例句
              </button>
            </article>
          ))}
          <FixedNotes
            {...props}
            report={report}
            targets={targetsOf(p, {
              lexeme: "lexemes",
              rule: "rules",
              derivation: "derivations",
              example: "examples",
            })}
          />
        </>
      )}
      {tab === 4 && (
        <Delivery
          {...props}
          check="check_language"
          goal="读取固定语言、派生步骤与命名意见，为下一章或场景准备一致用语与候选，正式命名采用另行决定。"
        />
      )}
    </>
  );
}
