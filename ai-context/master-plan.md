# GameLab Master Plan

기준일: 2026-03-03 (KST)
프로젝트: Smart Spectro-Tagging
협업 문서 경로: `ai-context`

## 1) 현재 상태
- 현재 단계: **Phase 2E 완료** (스펙트로그램 리스닝 + 분석 도구 강화)
- 배포 상태: FE(Vercel) + BE(Railway) 운영 중
- 제품 상태: AI 검수 + 수동 구간 생성 + **스펙트로그램 분석 도구** 통합 완료
- 최신 라벨링 UX: 박스 생성/이동/리사이즈, FFT 설정, 구간 재생 커서, 피치 보존, PNG 내보내기

## 2) 문서 우선순위
1. `ai-context/START-HERE.md`
2. `ai-context/master-plan.md`
3. `ai-context/project-context.md`
4. `ai-context/claude-implementation-brief-2026-02-12.md`
5. `ai-context/claude-coding-guideline.md`
6. `ai-context/codex-review-guideline.md`
7. `docs/status/PROJECT-STATUS.md` (최신 상태 + 단축키 전체 표)
8. `docs/architecture-diagrams.md` (구조 확인)

## 3) 최근 완료 항목

### Sprint 14 — 스펙트로그램 분석 도구 강화 (2026-03-03)
- FFT 설정 패널: FFT 크기/윈도우 함수/동적 범위 사용자 조절
- 구간 재생 커서 동기화: O/F키 재생 시 녹색 커서 실시간 이동
- 피치 보존 모드: `HTMLAudioElement.preservesPitch` 토글
- 0.25x 재생 속도 확장: 최소 속도 0.5x → 0.25x
- PNG 스크린샷 내보내기: canvas → PNG 다운로드

### 핫키 버그 수정 (2026-03-03)
- Shift+Z(Undo All): viewport 스냅샷 전체 한번에 되돌리기 수정
- Ctrl+Shift+Z(Redo): Shift 시 대문자 Z 매칭 수정
- R키 박스 선택: 오버레이 pointer-events 수정

### Phase 2E 기반 (2026-03-03 이전)
- 스펙트로그램 영역 선택 청취 (원본 O / 필터링 F)
- 밴드패스 필터 WAV 내보내기
- 선택 정보 패널 (시간/주파수)
- 스펙트로그램 호버 메트릭스 (시간/주파수/dB)
- 주파수 축 토글 (선형/로그)

### Phase 2C 완료 (Sprint 13.x)
- i18n 한/영 10개 페이지 ~290개 문자열
- 단축키 10개 추가 + Alt+1~4 전역 네비게이션
- 레벨 시스템 6단계 + 업적 시스템 12개 + 일일 목표
- Non-WAV 오디오(MP3/M4A/FLAC) 지원
- Supabase Auth + RLS + Error Boundary + Toast

## 4) 운영 규칙
- 작업 중에는 `ai-context/logs/*.md` 중심 갱신
- 핵심 흐름 변경 시 `archive`와 핵심 문서(본 파일 포함) 동기화
- 완료된 상세 로그/핸드오프/리포트는 `ai-context/archive/YYYY-MM-DD/`에 보관

## 5) 다음 우선순위
1. Gamification V2 DB 적용: `gamification_v2_core_tables.sql` Supabase 마이그레이션
2. E2E 테스트: Sprint 14 기능 수동/자동 검증
3. Auth/RLS hardening: open policy → 사용자 기반 정책
4. 운영 안정화: Sentry 에러 모니터링 정착
5. CEO 스펙 나머지 6개 항목 검토 (선택적)
