# Sprint 12.5 완료 보고 — Labeling UX 강화 + 세션 관리 + 데이터 내보내기

기준일: 2026-02-12
상태: **완료**

---

## 1. 변경 요약

### Feature 1: 스페이스바 Play/Pause 단축키
- **파일**: `frontend/src/app/(dashboard)/labeling/[id]/page.tsx`, `frontend/src/components/layout/HotkeyHelp.tsx`
- **로직**: hotkey switch에 `case " ":` 추가, `e.preventDefault()`로 스크롤 방지
- **조건**: Input/Textarea 포커스 시 차단 가드 기존 존재

### Feature 7: 선택 구간 재생 (Region Playback)
- **파일**: `frontend/src/lib/hooks/use-audio-player.ts`, labeling page
- **로직**: `regionEndRef` + `playRegion(start, end)` 메서드. rAF tick 루프에서 `currentTime >= regionEnd` 시 자동 정지
- **스페이스바 통합**: suggestion 선택 상태 + 재생 중 아님 → region 재생, 그 외 → toggle

### Feature 8: Tab/Arrow 키보드 Suggestion 이동
- **파일**: labeling page, HotkeyHelp
- **로직**: Tab/Shift+Tab 순환 이동, ArrowUp/ArrowDown 경계 클램프 이동

### Feature 5: 파일별 진행 상황 세분화
- **파일**: labeling page
- **로직**: 전체 세션 suggestion에서 `fileProgressMap` 계산 (audioId별 total/reviewed)
- **UI**: 사이드바 파일 아래 `reviewed/total` 텍스트, 우측 패널 pending/confirmed/fixed 배지

### Feature 3: 세션/파일 삭제 API + UI
- **BE**: `backend/app/api/sessions/router.py` — `DELETE /{session_id}`
  - 순서: 존재확인(SELECT) → suggestions 삭제 → audio_files 삭제 → session 삭제 → 디스크 파일 제거
- **FE**: `frontend/src/app/(dashboard)/sessions/page.tsx` — 삭제 버튼 + 확인 모달
- **FE API**: `frontend/src/lib/api/sessions.ts` — `delete` 엔드포인트 추가
- **DB RLS**: `anon_delete_suggestions`, `anon_delete_audio_files`, `anon_delete_sessions` 정책 추가 (마이그레이션 `add_anon_delete_policies`)

### Feature 6: 라벨 데이터 내보내기 (CSV/JSON)
- **BE**: `backend/app/api/labeling/router.py` — `GET /{session_id}/export?format=csv|json`
  - `StreamingResponse` + `Content-Disposition: attachment`
  - CSV 컬럼: session_id, audio_id, filename, label, confidence, start_time, end_time, freq_low, freq_high, status, description
- **FE API**: `frontend/src/lib/api/labeling.ts` — `export` 엔드포인트 추가
- **FE UI**: 툴바에 CSV/JSON 다운로드 링크

### Feature 2: 파일 완료 감지 + 자동 다음 이동
- **파일**: labeling page
- **로직**: `pendingCount === 0 && totalCount > 0 && hasInteracted.current` → 토스트 1.5초 → `handleNextFile()`
- **마지막 파일 처리**: `isLastFile` 감지 → "All Files Complete! Returning to sessions..." → `/sessions`로 라우팅
- **방어**: `hasInteracted` ref로 초기 로드 시 오발동 방지, 파일 전환 시 reset

### Feature 4: 다중 선택 + 일괄 삭제
- **파일**: `frontend/src/app/(dashboard)/sessions/page.tsx`
- **로직**: `selectedIds: Set<string>`, 체크박스 컬럼, 전체선택, "Delete Selected" 버튼
- **벌크 삭제**: 순차 DELETE API 호출 후 상태 업데이트

---

## 2. 버그 수정

### DELETE 404 버그
- **증상**: Supabase DELETE 200 OK → FastAPI 엔드포인트 404 반환
- **원인**: PostgREST `.delete().eq().execute()`는 `.select()` 없이 삭제된 행을 반환하지 않음 → `res.data = []` → 404 트리거
- **수정**: 삭제 전 `SELECT id` 존재 확인 (Step 0) 추가, DELETE 후 빈 응답 체크 제거

### RLS DELETE 정책 누락
- **증상**: DELETE 200 OK지만 실제 데이터 미삭제 (세션 재진입 시 복원)
- **원인**: `sst_sessions`, `sst_audio_files`, `sst_suggestions` 테이블에 DELETE RLS 정책 없음
- **수정**: 마이그레이션 `add_anon_delete_policies` — 3개 테이블에 `FOR DELETE USING (true)` 추가

### 마지막 파일 auto-next 무한 토스트
- **증상**: 다음 파일 없을 때 "File Complete! Moving to next file..." 반복
- **원인**: `handleNextFile()`이 다음 파일 없으면 no-op → 토스트만 반복
- **수정**: `isLastFile` 분기 추가. 마지막이면 "All Files Complete!" + `/sessions` 라우팅

---

## 3. 변경 파일 목록

| 구분 | 파일 | 변경 |
|------|------|------|
| BE | `backend/app/api/sessions/router.py` | DELETE 엔드포인트 + Step 0 존재확인 |
| BE | `backend/app/api/labeling/router.py` | Export 엔드포인트 (CSV/JSON) |
| FE | `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` | Space/Tab/Arrow 핫키, region 재생, 진행률, auto-next, export 링크 |
| FE | `frontend/src/app/(dashboard)/sessions/page.tsx` | 삭제 + 다중선택 + 일괄삭제 |
| FE | `frontend/src/lib/hooks/use-audio-player.ts` | `playRegion()` + `regionEndRef` |
| FE | `frontend/src/lib/api/sessions.ts` | `delete` 엔드포인트 |
| FE | `frontend/src/lib/api/labeling.ts` | `export` 엔드포인트 |
| FE | `frontend/src/components/layout/HotkeyHelp.tsx` | Playback + Navigation 섹션 |
| DB | Supabase 마이그레이션 | `add_anon_delete_policies` (3 테이블 DELETE RLS) |

---

## 4. 검증

| # | Feature | 결과 |
|---|---------|------|
| 1 | Space 재생 | OK — 토글 동작, 스크롤 차단, input 제외 |
| 7 | 구간 재생 | OK — start~end 재생 후 자동 정지 |
| 8 | Tab/Arrow | OK — suggestion 순환/클램프 이동 |
| 5 | 진행률 | OK — 사이드바 reviewed/total, 배지 |
| 3 | 삭제 API | OK — DB 3테이블 삭제 + RLS 정책 추가 후 정상 |
| 6 | Export | OK — CSV/JSON StreamingResponse 다운로드 |
| 2 | 자동 다음 | OK — 토스트 + 이동, 마지막 파일 시 sessions 복귀 |
| 4 | 일괄 삭제 | OK — 다중선택 + 벌크 삭제 |
| - | FE 빌드 | `npm run build` 에러 0 |
| - | BE 기동 | `uvicorn app.main:app` 정상 |

---

## 5. 리스크 / 오픈 이슈

| 리스크 | 심각도 | 상태 |
|--------|--------|------|
| Region 재생 rAF 타이밍 드리프트 (~16ms) | LOW | 수용 |
| Tab 키 접근성 오버라이드 | LOW | 라벨링 전용 워크스페이스, 의도적 재정의 |
| DELETE RLS `USING (true)` — 인증 미적용 | MEDIUM | Phase 2 auth 도입 시 정책 강화 필요 |
| 벌크 삭제 순차 호출 (N개 세션 → N번 API) | LOW | 규모 작음, 추후 배치 API 검토 |

---

## 6. 다음 세션 우선순위 (Sprint 12.6 후보)

1. SoundLab V5.7 실 WAV fallback 원인 조사
2. 좁은 주파수 대역 UI 가시성 개선 (zoom 또는 freq 스케일 조정)
3. 스펙트로그램 Canvas/WebGL PoC
4. Non-WAV 포맷 지원 (librosa/soundfile)
5. In-memory job store → DB 전환
6. Phase 2 인증 도입 + RLS 정책 강화
