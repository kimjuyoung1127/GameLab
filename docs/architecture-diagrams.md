# Smart Spectro-Tagging — 프로젝트 시각화

> Mermaid 기반 다이어그램. GitHub, Notion, VS Code(Mermaid Preview)에서 렌더링 가능.

---

## 1. 시스템 아키텍처

```mermaid
graph TB
  subgraph Client["🖥️ Frontend (Next.js 16 + React 19)"]
    direction TB
    AppRouter["App Router<br/>SSR + CSR"]
    Zustand["Zustand Stores<br/>6 stores"]
    i18n["next-intl<br/>ko / en"]
    WebAudio["Web Audio API<br/>Waveform Decode"]
  end

  subgraph Server["⚙️ Backend (FastAPI)"]
    direction TB
    API["REST API<br/>7 domains"]
    Services["Services Layer"]
    subgraph Engine["Analysis Engine"]
      Pipeline["7-Step Pipeline"]
      V57["SoundLab V5.7<br/>(baseline)"]
      Fallback["Rule Fallback"]
    end
    JobMgr["Job Manager"]
  end

  subgraph DB["🗄️ Supabase (PostgreSQL)"]
    Tables["18 Tables<br/>RLS Enabled"]
    Auth["Supabase Auth<br/>OAuth / JWT"]
    Storage["File Storage"]
  end

  subgraph External["🌐 External"]
    Vercel["Vercel<br/>(FE Deploy)"]
    Railway["Railway<br/>(BE Deploy)"]
  end

  Client -->|"REST API<br/>authFetch()"| Server
  Server -->|"SQL / RPC"| DB
  Client -->|"Auth Session"| Auth
  Server -->|"Service Role"| Tables
  AppRouter --> Zustand
  API --> Services
  Services --> Engine
  Services --> JobMgr
  JobMgr --> Tables

  Vercel -.->|"호스팅"| Client
  Railway -.->|"호스팅"| Server

  style Client fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
  style Server fill:#1e293b,stroke:#10b981,color:#e2e8f0
  style DB fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
  style Engine fill:#0f172a,stroke:#8b5cf6,color:#e2e8f0
  style External fill:#1e293b,stroke:#6b7280,color:#e2e8f0
```

---

## 2. 데이터 흐름 (핵심 파이프라인)

```mermaid
flowchart LR
  subgraph Upload["📤 업로드"]
    U1["파일 선택<br/>(WAV/MP3/FLAC)"]
    U2["POST /upload/files<br/>멀티파트"]
    U3["파일 저장<br/>메타 추출"]
  end

  subgraph Analysis["🔬 분석"]
    A1["Job 등록<br/>(sst_jobs)"]
    A2["LoadAudio"]
    A3["FeatureExtract<br/>(MFCC, Spectral)"]
    A4["NoiseRemoval"]
    A5["Threshold<br/>(Otsu)"]
    A6["StateMachine"]
    A7["GapFill + Trim"]
    A8["Suggestions<br/>생성"]
  end

  subgraph Labeling["🏷️ 라벨링"]
    L1["AI 제안 표시<br/>(스펙트로그램)"]
    L2["O Confirm<br/>X Reject"]
    L3["수정 모드<br/>(Edit → Apply)"]
    L4["점수 업데이트<br/>(+10/+20)"]
    L5["수동 생성/수정/삭제<br/>(user 제안)"]
  end

  subgraph Output["📊 결과"]
    O1["리더보드"]
    O2["업적 해제"]
    O3["CSV/JSON<br/>내보내기"]
  end

  U1 --> U2 --> U3 --> A1
  A1 --> A2 --> A3 --> A4 --> A5 --> A6 --> A7 --> A8
  A8 --> L1 --> L2 --> L4
  L2 -->|"Reject"| L3 --> L4
  L1 -->|"수동 태깅"| L5 --> L4
  L4 --> O1
  L4 --> O2
  L1 -->|"Export"| O3

  style Upload fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
  style Analysis fill:#1a3a2a,stroke:#10b981,color:#e2e8f0
  style Labeling fill:#3a2a1a,stroke:#f59e0b,color:#e2e8f0
  style Output fill:#2a1a3a,stroke:#8b5cf6,color:#e2e8f0
```

---

## 3. ERD (데이터베이스 관계도)

```mermaid
erDiagram
  sst_sessions ||--o{ sst_audio_files : "has files"
  sst_sessions ||--o{ sst_jobs : "has jobs"
  sst_audio_files ||--o{ sst_suggestions : "has suggestions"
  sst_users ||--o{ sst_user_achievements : "earned"
  sst_achievements ||--o{ sst_user_achievements : "awarded to"

  sst_sessions {
    text id PK
    text name
    text device_type
    text status "pending|processing|completed"
    int file_count
    float progress "0~100"
    float score
    timestamp created_at
  }

  sst_audio_files {
    text id PK
    text session_id FK
    text filename
    float duration
    int sample_rate
    text status "pending|processing|completed|failed"
    text audio_url
    timestamp created_at
  }

  sst_suggestions {
    text id PK "default gen_random_uuid()::text"
    text audio_id FK
    text label
    float confidence "0~100"
    text description
    float start_time "seconds"
    float end_time "seconds"
    float freq_low "Hz (double precision)"
    float freq_high "Hz (double precision)"
    text status "pending|confirmed|rejected|corrected"
    text source "ai|user (default ai)"
    text created_by "nullable, user id"
    timestamp created_at
    timestamp updated_at
  }

  sst_jobs {
    text id PK
    text session_id FK
    text status "idle|uploading|queued|processing|done|failed"
    float progress "0~100"
    int file_count
    text error
    timestamp created_at
    timestamp updated_at
  }

  sst_users {
    text id PK
    text name
    text email
    text role "junior_tagger"
    text avatar
    float today_score
    float accuracy
    float all_time_score
    timestamp created_at
  }

  sst_achievements {
    text id PK
    text title
    text description
    text icon
    int sort_order
    timestamp created_at
  }

  sst_user_achievements {
    text user_id FK
    text achievement_id FK
    timestamp unlocked_at
  }
```

---

## 4. 프론트엔드 라우트 & 컴포넌트 트리

```mermaid
graph TD
  subgraph Routes["📁 App Router"]
    Root["/ (redirect)"]
    subgraph AuthGroup["(auth)"]
      Login["/login<br/>OAuth 로그인"]
      Callback["/auth/callback"]
    end
    subgraph Dashboard["(dashboard) — DashboardShell"]
      Overview["/overview<br/>대시보드 메트릭"]
      Upload["/upload<br/>파일 업로드"]
      Sessions["/sessions<br/>세션 목록"]
      Leaderboard["/leaderboard<br/>리더보드"]
      LabelingId["/labeling/[id]<br/>라벨링 워크스페이스"]
    end
  end

  subgraph LabelingComponents["🏷️ Labeling 컴포넌트"]
    LH["LabelingHeader"]
    FLP["FileListPanel"]
    SP["SpectrogramPanel"]
    AP["AnalysisPanel"]
    PC["PlayerControls"]
    SC["SuggestionCard"]
    TB["ToolBar"]
    PB["ProgressBadge"]
    StP["StatusPills"]
  end

  subgraph LayoutComponents["🧩 Layout 컴포넌트"]
    DS["DashboardShell"]
    SB["Sidebar"]
    TopBar["TopBar"]
    HK["HotkeyHelp"]
    LS["LocaleSwitcher"]
    UM["UnsavedModal"]
  end

  subgraph UIComponents["🎨 UI 컴포넌트"]
    Toast["Toast"]
    WC["WaveformCanvas"]
  end

  Dashboard --> DS
  DS --> SB
  DS --> TopBar
  DS --> Toast
  SB --> LS
  SB --> HK
  LabelingId --> LH
  LabelingId --> FLP
  LabelingId --> SP
  LabelingId --> AP
  LabelingId --> PC
  LabelingId --> TB
  SP --> WC
  AP --> SC
  AP --> StP
  AP --> PB

  style Routes fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
  style LabelingComponents fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
  style LayoutComponents fill:#1e293b,stroke:#10b981,color:#e2e8f0
  style UIComponents fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
```

---

## 5. 상태관리 흐름 (Zustand Stores)

```mermaid
graph TB
  subgraph Stores["🗃️ Zustand Stores"]
    AuthStore["auth-store<br/>user | loading"]
    SessionStore["session-store<br/>sessions | files<br/>currentSession | currentFileId"]
    AnnotStore["annotation-store<br/>mode | tool | suggestions<br/>annotations | undo/redo"]
    ScoreStore["score-store<br/>score | streak | level<br/>dailyGoal | dailyProgress<br/>💾 persist"]
    UIStore["ui-store<br/>sidebar | modal | toast<br/>hotkeyHelp | loading"]
    AchStore["achievement-store<br/>achievements | unlocked<br/>recentUnlock"]
  end

  subgraph Pages["📄 Pages"]
    LoginPage["Login"]
    OverviewPage["Overview"]
    UploadPage["Upload"]
    SessionsPage["Sessions"]
    LabelingPage["Labeling"]
    LeaderPage["Leaderboard"]
  end

  subgraph API["🌐 API Layer"]
    AuthFetch["authFetch()"]
    Endpoints["endpoints.ts"]
  end

  LoginPage --> AuthStore
  OverviewPage --> SessionStore
  UploadPage --> SessionStore
  UploadPage --> UIStore
  SessionsPage --> SessionStore
  LabelingPage --> SessionStore
  LabelingPage --> AnnotStore
  LabelingPage --> ScoreStore
  LabelingPage --> UIStore
  LabelingPage --> AchStore
  LeaderPage --> ScoreStore
  LeaderPage --> AchStore

  AuthStore -->|"Bearer Token"| AuthFetch
  AuthFetch --> Endpoints
  ScoreStore -->|"fetchFromServer()"| Endpoints
  AchStore -->|"checkAndUnlock()"| Endpoints
  AnnotStore -->|"confirm/reject"| Endpoints

  style Stores fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
  style Pages fill:#1e293b,stroke:#10b981,color:#e2e8f0
  style API fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
```

---

## 6. 사용자 여정 (User Journey)

```mermaid
journey
  title Smart Spectro-Tagging 사용자 여정
  section 인증
    로그인 (OAuth): 3: User
    대시보드 진입: 5: User
  section 업로드
    오디오 파일 선택: 4: User
    업로드 + 자동 분석: 5: System
    분석 진행 폴링: 3: System
  section 라벨링
    세션 선택: 4: User
    AI 제안 검토: 5: User, System
    O 확인 / X 거절: 5: User
    수정 모드 편집: 3: User
    점수 획득 (+10/+20): 5: User
  section 게이미피케이션
    리더보드 확인: 4: User
    업적 해제 알림: 5: System
    레벨업 토스트: 5: System
  section 내보내기
    CSV/JSON 다운로드: 4: User
```

---

## 7. API 엔드포인트 맵

```mermaid
graph LR
  subgraph Upload["📤 Upload"]
    POST_upload["POST /upload/files<br/>멀티파트 업로드"]
  end

  subgraph Jobs["⏳ Jobs"]
    GET_job["GET /jobs/{id}<br/>상태 폴링"]
  end

  subgraph Sessions["📋 Sessions"]
    GET_sessions["GET /sessions<br/>세션 목록"]
    GET_files["GET /sessions/{id}/files<br/>파일 목록"]
    DEL_session["DELETE /sessions/{id}<br/>세션 삭제 (cascade)"]
  end

  subgraph Labeling["🏷️ Labeling"]
    GET_suggestions["GET /labeling/{id}/suggestions<br/>제안 조회"]
    POST_suggestions["POST /labeling/{id}/suggestions<br/>수동 제안 생성"]
    PATCH_suggestion["PATCH /labeling/suggestions/{id}<br/>상태/위치/라벨 변경"]
    DEL_suggestion["DELETE /labeling/suggestions/{id}<br/>사용자 제안 삭제"]
    GET_export["GET /labeling/{id}/export<br/>CSV / JSON"]
  end

  subgraph Overview["📊 Overview"]
    GET_metrics["GET /overview/metrics<br/>대시보드 집계"]
  end

  subgraph Leader["🏆 Leaderboard"]
    GET_leader["GET /leaderboard<br/>랭킹"]
    GET_me["GET /leaderboard/me<br/>내 점수"]
  end

  subgraph Achieve["🎖️ Achievements"]
    GET_achieve["GET /achievements<br/>전체 업적"]
    GET_my_achieve["GET /achievements/me<br/>내 업적"]
    POST_unlock["POST /achievements/unlock<br/>업적 해제"]
  end

  POST_upload -->|"job_id"| GET_job
  GET_job -->|"session_id"| GET_sessions
  GET_sessions -->|"session_id"| GET_files
  GET_files -->|"session_id"| GET_suggestions
  GET_suggestions -->|"suggestion_id"| PATCH_suggestion
  GET_suggestions -->|"suggestion_id"| DEL_suggestion
  GET_files -->|"session_id"| POST_suggestions
  PATCH_suggestion -->|"점수 반영"| GET_me
  PATCH_suggestion -->|"업적 체크"| POST_unlock

  style Upload fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
  style Jobs fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
  style Sessions fill:#1a3a2a,stroke:#10b981,color:#e2e8f0
  style Labeling fill:#3a2a1a,stroke:#f59e0b,color:#e2e8f0
  style Overview fill:#2a1a3a,stroke:#8b5cf6,color:#e2e8f0
  style Leader fill:#3a1a2a,stroke:#ec4899,color:#e2e8f0
  style Achieve fill:#1a2a3a,stroke:#06b6d4,color:#e2e8f0
```

---

## 8. 분석 엔진 파이프라인

```mermaid
graph TD
  subgraph Input["입력"]
    Audio["오디오 파일<br/>(WAV/MP3/FLAC)"]
  end

  subgraph Pipeline["SoundLab V5.7 Pipeline"]
    S1["1. LoadAudio<br/>soundfile + ffmpeg 폴백"]
    S2["2. FeatureExtraction<br/>MFCC, Spectral Centroid,<br/>Spectral Bandwidth"]
    S3["3. NoiseRemoval<br/>Spectral Subtraction"]
    S4["4. Threshold<br/>Otsu 동적 임계값"]
    S5["5. StateMachine<br/>Silence/Signal 클러스터링"]
    S6["6. GapFill<br/>짧은 갭 병합"]
    S7["7. Trim<br/>앞뒤 무음 제거"]
  end

  subgraph Output["출력"]
    Sugg["SuggestionDraft[]<br/>label, confidence,<br/>freq_low/high,<br/>start/end_time"]
  end

  subgraph Fallback["폴백"]
    Rule["RuleFallbackEngine<br/>규칙 기반 (no ML)"]
  end

  Audio --> S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> Sugg
  S1 -->|"실패/타임아웃<br/>(120s)"| Rule
  Rule --> Sugg

  style Input fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
  style Pipeline fill:#1a3a2a,stroke:#10b981,color:#e2e8f0
  style Output fill:#2a1a3a,stroke:#8b5cf6,color:#e2e8f0
  style Fallback fill:#3a1a1a,stroke:#ef4444,color:#e2e8f0
```

---

## 9. BE ↔ FE 미러 구조

```mermaid
graph LR
  subgraph BE["⚙️ Backend (Python)"]
    BM1["models/upload.py"]
    BM2["models/sessions.py"]
    BM3["models/labeling.py"]
    BM4["models/leaderboard.py"]
    BM5["models/achievement.py"]
    BR1["api/upload/router.py"]
    BR2["api/sessions/router.py"]
    BR3["api/labeling/router.py"]
    BR4["api/leaderboard/router.py"]
    BR5["api/achievements/router.py"]
  end

  subgraph FE["🖥️ Frontend (TypeScript)"]
    FT1["types/upload.ts"]
    FT2["types/sessions.ts"]
    FT3["types/labeling.ts"]
    FT4["types/leaderboard.ts"]
    FT5["types/achievement.ts"]
    FA1["lib/api/upload.ts"]
    FA2["lib/api/sessions.ts"]
    FA3["lib/api/labeling.ts"]
    FA4["lib/api/leaderboard.ts"]
    FA5["lib/api/achievement.ts"]
  end

  BM1 ---|"1:1 타입"| FT1
  BM2 ---|"1:1 타입"| FT2
  BM3 ---|"1:1 타입"| FT3
  BM4 ---|"1:1 타입"| FT4
  BM5 ---|"1:1 타입"| FT5
  BR1 ---|"1:1 API"| FA1
  BR2 ---|"1:1 API"| FA2
  BR3 ---|"1:1 API"| FA3
  BR4 ---|"1:1 API"| FA4
  BR5 ---|"1:1 API"| FA5

  style BE fill:#1a3a2a,stroke:#10b981,color:#e2e8f0
  style FE fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
```

---

## 10. 기술 스택 요약

```mermaid
mindmap
  root((Smart<br/>Spectro-Tagging))
    Frontend
      Next.js 16
      React 19
      TypeScript 5
      Zustand 5
      Tailwind CSS 4
      next-intl
      Lucide Icons
      Web Audio API
    Backend
      FastAPI
      Pydantic v2
      Python 3.x
      NumPy / SciPy
      scikit-image
      soundfile
    Database
      Supabase
      PostgreSQL
      RLS Enabled
      18 Tables
    Infrastructure
      Vercel (FE)
      Railway (BE)
      GitHub
    Features
      AI 음향 분석
      7-Step Pipeline
      Tinder UX 라벨링
      게이미피케이션
      i18n (ko/en)
      업적 시스템
```
