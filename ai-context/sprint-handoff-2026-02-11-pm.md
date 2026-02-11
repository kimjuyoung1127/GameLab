# Sprint Handoff (2026-02-11 오후) - Codex 리뷰 기준

기준일: 2026-02-11 (KST)
기준 브랜치: `main`
실행 경로: `smart-spectro-tagging`

## 1) 스프린트 결과 (완료/미완)

### 완료 (백로그 6건)
| # | 항목 | 커밋 ID | 목적 |
|---|---|---|---|
| 1 | sessions 생성 + 필터 안정화 | `3dd4329` | `createSession`, `setCurrentSessionById`로 세션 진입 정합성 확보 |
| 2 | labeling/[id] 3패널 UX 완성 | `639c109` | 핫키/편집모드/파일전환/진행률 표시 |
| 3 | Spectrogram 시각화 확장 | `b7ca706` | suggestion 기반 annotation 박스/상태별 시각 표현 |
| 4 | undo/redo + hotkeys 연결 | `639c109` | `HistorySnapshot` 기반 상태 복원 |
| 5 | autosave + offline queue | `b7ca706` | 30초 자동저장 + beforeunload 저장 |
| 6 | leaderboard 라이브 점수 | `b7ca706` | score-store persist + 세션 화면 네비게이션 연결 |

### 미완 (1건)
| # | 항목 | 사유 |
|---|---|---|
| 7 | SoundLab 패턴 이식 | Phase 2 전제 작업으로 우선순위 이관 |

## 2) 커밋 매트릭스 (커밋ID / 파일 / 목적)
| 커밋 | 핵심 파일 | 목적 |
|---|---|---|
| `3dd4329` | `src/lib/store/session-store.ts` | 세션 생성/진입 API 확장 |
| `3dd4329` | `src/lib/store/annotation-store.ts` | undo/redo 복원 단위 강화 |
| `3dd4329` | `src/components/layout/Sidebar.tsx` | 404 유발 메뉴 제거 |
| `639c109` | `src/app/(dashboard)/labeling/[id]/page.tsx` | 3패널 UX 및 핫키 완성 |
| `b7ca706` | `src/lib/hooks/use-autosave.ts` | 자동저장/오프라인 큐 도입 |
| `b7ca706` | `src/app/(dashboard)/leaderboard/page.tsx` | 점수 연동/복귀 네비게이션 |

## 3) Codex 리뷰 포인트 (Severity별)

### 치명적/높음
- 없음

### 보통
- [보통] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx:517` - `${sc.bg}/90` 형태의 동적 Tailwind 클래스 사용 - 운영 빌드에서 purge 시 태그 배경색 누락 가능 - 정적 클래스 맵 또는 safelist로 변경 - 검증: `npm run build` 후 상태별 태그 색상 확인.
- [보통] `smart-spectro-tagging/src/lib/hooks/use-autosave.ts:6` - 단일 키 `sst-autosave` 사용 - 다중 파일 동시 작업 시 마지막 파일 데이터로 덮어쓰기 - `sst-autosave-${audioId}`로 키 분리 - 검증: 파일 A/B 교차 편집 후 각각 복원 확인.
- [보통] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx:470` - CSS gradient 기반 mock 스펙트로그램 - 실제 오디오 데이터 기반 시각화 부재 - Phase 2에서 Canvas/WebGL 전환 - 검증: PoC 단계에서 Canvas 렌더 경로 추가 확인.

### 낮음
- [낮음] `smart-spectro-tagging/src/lib/store/score-store.ts:1` - persist 버전/마이그레이션 없음 - 기존 로컬 데이터와 충돌 가능 - `version`/`migrate` 도입 - 검증: 기존 localStorage 데이터로 재실행 테스트.
- [낮음] `smart-spectro-tagging/src/app/(dashboard)/leaderboard/page.tsx:120` - Samples/Speed/Duration 하드코딩 - 실제 상태 반영 불가 - store selector 기반 계산값 치환 - 검증: 데이터 변경 시 카드 지표 동기 반영 확인.
- [낮음] `smart-spectro-tagging/src/app/(dashboard)/labeling/[id]/page.tsx:585` - 재생 커서 위치(38%) 고정 - 재생 위치 UI 신뢰성 저하 - Web Audio API 시간축 연동 - 검증: 재생 시간 변화에 커서 위치 동기화.

## 4) 수용 기준 체크리스트
- [x] 사이드바 404 링크 제거(Overview/Sessions/Leaderboard만 노출)
- [x] `/sessions`에서 Create Session 클릭 시 `/labeling/{id}` 이동
- [x] `/labeling/{id}` 직접 접근 시 해당 세션 데이터만 로드
- [x] Confirm/Reject/Apply Fix 점수/모드 전이 정상
- [x] Undo/Redo 시 mode + selection + suggestions 복원
- [x] 핫키 O/X/B/E/R/S/F/Ctrl+Z/Ctrl+Shift+Z 동작
- [x] autosave 동작(주기 저장 + beforeunload)
- [x] `npm run build` 성공

## 5) 다음 스프린트 TODO (우선순위)

### P1 (즉시)
1. Tailwind 동적 클래스 purge 리스크 제거
2. autosave 키를 파일 단위로 분리
3. review-log 포맷을 단일 형식으로 통일

### P2 (Phase 2 진입 전)
4. leaderboard 하드코딩 지표를 상태 기반 계산으로 교체
5. score-store persist 버전/마이그레이션 추가
6. 모바일 레이아웃 점검(세션/라벨링/리더보드)

### P3 (Phase 2 착수)
7. Canvas/WebGL 기반 스펙트로그램 PoC
8. SoundLab 패턴 이식(heavy/light 분리, timeline/event-log)

## 6) handoff 태스크 포맷 (고정)
- 우선순위:
- 파일:
- 구현지시:
- 완료기준:
- 리스크:

## 7) 업로드 입력 포맷 정책 (비개발자 친화)

목표:
- 현장/비개발자 사용자가 휴대폰 녹음 파일을 그대로 업로드할 수 있어야 한다.

지원 입력 포맷(1차):
1. `.wav` (권장)
2. `.m4a` (iPhone 기본 녹음)
3. `.mp3` (Android/메신저 공유 파일)

서버 처리 정책:
- 업로드 파일은 내부 분석 전에 표준 포맷으로 자동 변환한다.
- 표준 분석 포맷: `wav`, `mono`, `16kHz` (또는 `44.1kHz` 운영 옵션)
- 사용자에게는 “자동 변환됨” 안내를 노출하고 추가 작업을 요구하지 않는다.

유효성 검사:
- 허용 확장자 외 업로드 차단
- 최대 파일 크기 제한(예: 100MB, 운영환경에 맞게 조정)
- 변환 실패 시 원인 + 재시도 가이드 제공

수용 기준:
- iPhone `.m4a` 업로드 성공
- Android `.mp3` 업로드 성공
- `.wav` 업로드 성공
- 3개 포맷 모두 분석 파이프라인 진입 확인

## 8) 실행/검증 명령 (고정)
```bash
cd smart-spectro-tagging
npm install
npm run dev
npm run build
```
