# Claude Implementation Brief (2026-02-12 Baseline, 2026-02-24 Updated)

기준일: 2026-02-24 (KST)
역할: Claude 구현 시 즉시 참고하는 실행 브리프

## 1) 목적
- 2026-02-12 기준 구현 원칙(Phase 2 기반)을 유지하되,
- 2026-02-24까지 반영된 실제 구현 변화(수동 라벨링, 핫키/편집 UX, API 확장)를 한 문서로 요약

## 2) 원본 베이스라인 (2026-02-12)
- Labeling PATCH idempotent 반영
- Upload fast-return + 비동기 분석
- Job 상태 전이 표준화
- ANALYSIS_ENGINE 스왑 검증
- Hotkey/Upload/API 기준 acceptance 통과

## 3) 최신 델타 (2026-02-24)

### 3.1 Backend
- `POST /api/labeling/{session_id}/suggestions` 추가
  - 사용자 수동 구간 생성 지원
  - session-file 정합성 검증 포함
- `SuggestionResponse` 확장
  - `source`, `created_by`
- Export 확장
  - CSV/JSON 모두 `source`, `created_by` 포함
- 마이그레이션 과도기 fallback
  - `source/created_by` 컬럼 미존재 환경 insert fallback

### 3.2 Frontend
- 라벨링 워크플로우 확장
  - AI 검수 + 수동 draft 생성/저장 병행
- 단축키 재정렬
  - `A=Select`, `G=Snap`, `R=Box`, `Ctrl+Enter=수동 저장`
- 편집 UX 강화
  - 수동 박스 이동/리사이즈
  - loop/HUD 상태 시각화
  - undo/redo 스냅샷 범위 확장

### 3.3 타입/스토어
- `Suggestion` 일반화 (`source`, `createdBy`)
- `ManualDraft`, `LoopState` 도입
- ActionHistory 타입 확장
  - `ai_confirm`, `manual_create`, `manual_delete`, `manual_move`, `manual_resize`

## 4) 구현 시 필수 체크리스트
1. BE 모델 변경 시 FE 타입 동기화
2. 핫키 변경 시 ToolBar + HotkeyHelp + i18n 동시 반영
3. 라벨링 편집 변경 시 undo/redo 단위 검증
4. export 포맷 변경 시 CSV/JSON 동시 검증
5. lint/build 통과 후 세션 로그 반영

## 5) 최신 안정 기준
- 기준 커밋: `5d0cd6b` (2026-02-24)
- FE 검증: `npm run lint`, `npm run build` PASS
- 운영 상태: FE(Vercel) / BE(Railway) 배포 라인 유지

## 6) 참고 문서
- `ai-context/archive/2026-02-24/session-log-2026-02-24.md`
- `ai-context/archive/2026-02-23/full-project-archive.md`
- `docs/architecture-diagrams.md`
