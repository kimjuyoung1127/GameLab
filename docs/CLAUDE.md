# docs/

제품 기준 문서 모음. 기획/디자인/DB 스키마 레퍼런스.

## 파일 구조

| 파일 | 역할 |
|------|------|
| `Prd.md` | **제품 요구사항 문서** — Phase별 기능 정의, 사용자 시나리오, 우선순위 |
| `react.md` | React 컴포넌트 설계 스펙 |
| `bone.md` | 프로젝트 골격 구조 (아키텍처 개요) |
| `schema.md` | **DB DDL 레퍼런스** — 16개 Supabase 테이블 정의, 인덱스, RLS 정책 |
| `wireframe.md` | UI 와이어프레임 명세 |
| `scaffolding.md` | 초기 스캐폴딩 계획 |
| `prdtamplate.md` | PRD 작성 템플릿 (참고용) |
| `slacktamplate.md` | Slack 보고 템플릿 (참고용) |

## 읽기 우선순위

1. `Prd.md` — 기능 요구사항 확인
2. `schema.md` — DB 테이블 구조 확인
3. `bone.md` / `react.md` — 아키텍처/컴포넌트 이해

## 규칙

- 이 폴더의 문서는 기획 단계의 **Source of Truth**
- 실제 구현 상태와 차이가 있을 수 있음 → 최신 상태는 `ai-context/master-plan.md` 확인
- DB 스키마 변경 시 `schema.md` 동시 업데이트
