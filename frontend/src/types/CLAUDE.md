# 도메인 타입 (BE models/와 1:1 미러)

## 파일 목록

| 파일 | 주요 타입 | 설명 |
|------|----------|------|
| `common.ts` | `LabelingMode`, `DrawTool`, `WaveformData` | 공용 타입. LabelingMode = `"review"` \| `"edit"`, DrawTool 5종 |
| `upload.ts` | `UploadFile` 관련 | 파일 업로드 관련 타입 |
| `sessions.ts` | `Session`, `AudioFile` | 세션 및 오디오 파일 인터페이스 |
| `labeling.ts` | `AISuggestion`, `Annotation`, `SuggestionStatus`, `HistorySnapshot` | 라벨링 핵심 타입. SuggestionStatus enum, undo/redo 스냅샷 |
| `overview.ts` | `OverviewMetrics` | 대시보드 메트릭스 |
| `leaderboard.ts` | `LeaderboardEntry` | 리더보드 항목 |
| `index.ts` | — | barrel re-export (하위 호환) |

## 규칙

### BE 동기화
- BE `models/{도메인}.py` 변경 시 **반드시** 대응하는 FE 타입 파일도 동시 수정
- 필드명은 **CamelCase** (BE의 CamelModel `alias_generator`와 일치)

### 새 타입 추가 절차
1. 해당 도메인 파일에 타입/인터페이스 추가
2. `index.ts`에 re-export 추가
3. BE 대응 모델 확인

### 네이밍 규칙
- 인터페이스: PascalCase (`AISuggestion`, `AudioFile`)
- enum: PascalCase 이름 + 문자열 리터럴 값
- 타입 별칭: PascalCase (`LabelingMode`, `DrawTool`)

## 참고

- `index.ts`는 기존 코드의 `import from '@/types'` 호환을 위한 barrel 파일
- 새 import는 `@/types/labeling` 형태의 직접 import 권장
