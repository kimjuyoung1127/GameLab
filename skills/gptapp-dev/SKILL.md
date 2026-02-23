---
name: gptapp-dev
description: ChatGPT MCP App 개발 스킬. gptappdocs 참조하여 MCP 서버, 위젯, 도구를 구현.
---

# GPT App Development Skill

ChatGPT Apps SDK 기반 MCP 앱을 개발할 때 이 스킬을 활용합니다.

## 참조 문서 (C:\gpttaillog\gptappdocs/)

개발 중 반드시 해당 문서를 읽고 참조하세요:

| 단계 | 참조 문서 | 용도 |
|------|-----------|------|
| 서버 구축 | `setupyourserver.md` | MCP 서버 설정, 도구 등록, structuredContent |
| 도구 설계 | `definetools.md` | Tool-first 사고, 메타데이터, annotations |
| UI 구축 | `buildyourchatgptui.md` | 브릿지, callTool, useToolResult, esbuild |
| 컴포넌트 | `designcomponents.md` | 위젯 설계 원칙, 인터랙션 패턴 |
| 상태관리 | `managestate.md` | business/UI/cross-session 상태 분리 |
| 인증 | `authenticateusers.md` | OAuth 2.1, securitySchemes |
| 보안 | `securityprivacy.md` | CSP, 프롬프트 인젝션 방지 |
| API 참조 | `reference.md` | window.openai, _meta, annotations |
| 테스트 | `testyourintegration.md` | MCP Inspector, developer mode |
| UX 원칙 | `uxprinciples.md` | 대화형 UX, 피해야 할 패턴 |
| 배포 | `deployyourapp.md` | ngrok, Vercel, 환경 설정 |
| 제출 | `submityourapp.md`, `appsubmissionguidelines.md` | 리뷰 가이드라인 |
| 수익화 | `momnetizeyourapp.md` | 체크아웃, PSP 연동 |

## 개발 규칙

1. **CLAUDE.md 우선**: 모든 폴더의 CLAUDE.md를 먼저 읽고 구조 파악
2. **파일 헤더**: 모든 .ts/.tsx 상단에 `@file`, `@description` JSDoc
3. **이름 일치**: backend/src/tools/*.ts ↔ frontend/src/views/*/
4. **CSS 분리**: 각 뷰 폴더의 styles/ 디렉토리
5. **추측 금지**: 확실하지 않으면 파일을 직접 읽기
6. **인코딩**: UTF-8, LF 줄바꿈
