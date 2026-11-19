# 构造语言工坊

> 让虚构语言的音位、正字、词根、形态规则和命名派生保持可解释、可复核。

## 简介

河图洛书的独立创作插件，由外部Codex通过河图CLI／MCP读取包内Skill并操作。世界构建负责制度、历法与正式设定，本包负责语言内部关系与确定性派生；正式人物及名称采用归宿主。不是机器翻译器、语音合成、任意音变DSL或语言学正确性认证。

## 角色分流

- 作者使用 → [插件中心](https://hetu.limeai.run/plugins/language-studio/)
- Agent与功能Review → [功能清单](CAPABILITIES.md)
- 开发与维护 → [完整设计文档](docs/README.md)

## 快速上手

开发需要Node.js 25，安装与验收基线为河图0.12.6。

```bash
npm ci
npm run build
npm run check
npm run test:unit
npm run package
```

## 边界

专业成果沿固定来源与修订接续，正文采纳、定稿、费用和外发独立决定。发行及实际验收范围见[实施记录](docs/08-实施计划与验收记录.md)。
