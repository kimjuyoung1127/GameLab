# GameLab Project Status

Last Updated: 2026-03-03 (KST)
Owner Doc: `CLAUDE.md` (root slim index)

## Current Phase
- Phase 2E (spectrogram listening + 분석 도구 강화)
- Sprint 14 완료: 스펙트로그램 분석 도구 5개 기능
- Gamification V2 구현 완료 (mission/reward/leaderboard scope tabs)
- Labeling UI 집중화 적용: Mission Center 제거, 프로필 진입으로 통합

## Sprint 14 — 스펙트로그램 분석 도구 강화 (완료)
1. **FFT 설정 패널**: FFT Size(512/1024/2048/4096), 윈도우 함수(Hann/Hamming/Blackman), 동적 범위 슬라이더
2. **구간 재생 커서 동기화**: O/F키 구간 재생 시 녹색 세로 커서가 선택 영역 안에서 실시간 이동
3. **피치 보존 모드**: 재생 속도 변경 시 음높이 유지 토글 (HTMLAudioElement.preservesPitch)
4. **0.25x 재생 속도 확장**: 최소 속도 0.5x → 0.25x 하한 확장
5. **PNG 스크린샷 내보내기**: 스펙트로그램 canvas → PNG 다운로드 (ToolBar 내보내기 메뉴)

## Spectrogram Listening Scope (Locked: 2026-03-03 KST)
- Workspace target: `frontend/src/app/(dashboard)/labeling/[id]` only
- MVP included:
  - selection-based original playback (`O`)
  - selection-based filtered playback (`F`, band-pass)
  - filtered segment WAV download
  - selection info panel (time/frequency)
  - spectrogram hover metrics (time/frequency/estimated dB)
  - frequency axis toggle (linear/log display)
  - FFT 설정 패널 (크기/윈도우/동적범위)
  - 구간 재생 커서 동기화 (녹색 세로선)
  - 피치 보존 모드 (속도 변경 시 음높이 유지)
  - 0.25x~2.0x 재생 속도 범위
  - PNG 스크린샷 내보내기

## Hotkey Policy (Current)
| 키 | 동작 |
|----|------|
| `Space` | 재생/일시정지 (선택 구간 있으면 구간 재생) |
| `C` | 제안 확정 (review 모드) |
| `X` | 제안 거절 (review 모드) |
| `Shift+F` | 수정 적용 (edit 모드) |
| `F` | 필터링 구간 재생 |
| `O` | 원본 구간 재생 |
| `A` | Select 도구 |
| `R` | Box 도구 |
| `Shift+R` | 줌 박스 모드 |
| `E` | Eraser 도구 |
| `G` | 스냅 토글 |
| `+`/`=` | 줌 인 (+0.5, max 10x) |
| `-` | 줌 아웃 (-0.5, min 1x) |
| `[`/`]` | 재생 속도 감소/증가 (0.25x~2.0x) |
| `I`/`P`/`L` | 루프 시작/끝/토글 |
| `M` | needs_analysis 북마크 |
| `Tab`/`Shift+Tab` | 다음/이전 pending 제안 |
| `↑`/`↓` | 제안 목록 탐색 |
| `Shift+↑`/`Shift+↓` | 볼륨 증가/감소 |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Shift+Z` | Undo All (뷰포트+어노테이션 전체 되돌리기) |
| `Shift+0` | 뷰 리셋 |
| `Ctrl+→`/`Ctrl+←` | 다음/이전 파일 |
| `Ctrl+Shift+→`/`Ctrl+Shift+←` | 다음/이전 북마크 |
| `Ctrl+Enter` | 수동 draft 저장 |
| `Delete`/`Backspace` | 선택된 draft/제안 삭제 |
| `Escape` | 줌 박스 모드 해제 |

## Automation Rollout Status
- docs structure migration: InProgress
- code-doc integrity pipeline: InProgress
- automation health monitor: Ready
- slack daily summary: Ready

## Next Actions
1. Apply `scripts/sql-chunks/gamification_v2_core_tables.sql` to Supabase project.
2. QA pass for gamification endpoints (`/api/gamification/*`) and leaderboard scope tabs.
3. Validate mission claim/idempotency with real suggestion lifecycle data.
4. E2E 테스트: Sprint 14 기능(FFT/커서/피치/속도/PNG) 수동 검증
5. Profile(`/profile`) 중심으로 배지/미션/진행상황 UX 통합

## Recent Hotfixes (2026-03-03 KST)
- Shift+Z(Undo All): viewport 스냅샷 전체 한번에 되돌리기 (1단계씩 → 전체)
- Ctrl+Shift+Z(Redo): Shift 누를 때 대문자 Z 매칭 수정
- R키 박스 선택: 오버레이 div pointer-events-none 추가로 이벤트 통과 수정
- segment playback mode visibility and stop/toggle control
- numeric selection input delete/retype stabilization
