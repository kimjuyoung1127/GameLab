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
