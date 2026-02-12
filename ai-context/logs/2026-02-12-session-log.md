### [2026-02-12 12:10 KST] /upload 실 API 전환 + 사용자 작동 가이드 정리
- 목표:
  - /upload를 mock 시뮬레이션에서 실제 백엔드 호출로 전환
  - 현재 결과물 기준 사용자 작동 흐름(로그인/업로드/라벨링/단축키) 문서화
- 범위:
  - `smart-spectro-tagging/src/app/(dashboard)/upload/page.tsx`
  - `smart-spectro-tagging/src/lib/api/endpoints.ts`
  - `backend/app/api/upload/router.py`
  - `backend/app/models/schemas.py`
  - `ai-context/sprint-handoff-2026-02-11-pm.md`
- 변경 파일:
  - `smart-spectro-tagging/src/app/(dashboard)/upload/page.tsx` - 실 API 호출, job polling, 연결 실패 메시지 개선
  - `smart-spectro-tagging/src/lib/api/endpoints.ts` - Sprint 12 API 계약 경로 추가
  - `backend/app/api/upload/router.py` - upload 응답에 job_id 포함, register_job 연결
  - `backend/app/models/schemas.py` - UploadResult에 job_id/error 필드 확장
  - `ai-context/sprint-handoff-2026-02-11-pm.md` - 14번 진행상태 업데이트 + 15번 사용자 작동 가이드 추가
- 실행 명령:
  - `cd smart-spectro-tagging && npm run build`
  - `python -m compileall backend/app`
- 결과:
  - build 성공, backend python compile 성공
- 커밋:
  - (미커밋)
- 다음 작업:
  1. FE에서 sessions/overview/labeling 실 API 연동
  2. Supabase Storage 업로드 및 DB insert 도입(영속화)

### [2026-02-12 02:20 KST] Sprint 12.2 완료 문서화 + Acceptance 실측 정리
- 목표:
  - Sprint 12.2 완료 기준 문서 확정 및 활성 문서/아카이브 정리
  - 핫키 스팸/업로드/엔진 스왑 acceptance 실측 결과를 로그에 반영
- 범위:
  - `ai-context/sprint-close-2026-02-12.md`
  - `ai-context/START-HERE.md`
  - `ai-context/master-plan.md`
  - `ai-context/project-context.md`
  - `ai-context/logs/2026-02-12-session-log.md`
- 변경 파일:
  - `ai-context/sprint-close-2026-02-12.md` - Sprint 12.2 완료 보고서 신규 작성
  - `ai-context/START-HERE.md` - Active Docs를 close report 기준으로 갱신
  - `ai-context/master-plan.md` - 문서 운영 규칙 및 Sprint 12.2 완료 상태 반영
  - `ai-context/project-context.md` - 현재 구현 API/운영 상태로 업데이트
- 실행 명령:
  - `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` (job)
  - `npm run dev -- --hostname 127.0.0.1 --port 3000` (job)
  - `curl -X POST /api/upload/files`, `GET /api/jobs/{job_id}`, `GET/PATCH /api/labeling/*`
- 결과:
  - 핫키 스팸(API 기준): final status `corrected`
  - 업로드: `.wav/.m4a/.mp3` 큐잉/완료 흐름 확인, `>1GB` 차단(`File too large`) 확인
  - 엔진 스왑: `soundlab_v57` / `rule_fallback` env 전환 동작 확인
- 커밋:
  - (미커밋)
- 다음 작업:
  1. 브라우저 키입력 기반 hotkey spam E2E(Playwright) 추가
  2. `SoundLabV57Engine` 실 알고리즘 연동(Phase 2)
