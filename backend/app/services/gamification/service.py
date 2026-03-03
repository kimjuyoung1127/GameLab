"""Gamification service helpers for reward idempotency and mission progress."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.core.supabase_client import supabase
from app.models.gamification import (
    ClaimMissionResponse,
    GamificationSnapshotResponse,
    MissionProgressResponse,
    MissionReward,
    MissionsResponse,
    NextAchievement,
    RewardEventResponse,
)
from app.models.labeling import SuggestionStatusValue

KST = timezone(timedelta(hours=9))
DAILY_GOAL_DEFAULT = 20


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _now_kst() -> datetime:
    return _now_utc().astimezone(KST)


def _period_key(scope: str, now_kst: datetime) -> str:
    if scope == "daily":
        return now_kst.strftime("%Y-%m-%d")
    iso_year, iso_week, _ = now_kst.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


def _fetch_user_scores(user_id: str) -> dict:
    res = (
        supabase.table("sst_users")
        .select("today_score, all_time_score")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return {"today_score": 0, "all_time_score": 0}
    row = rows[0]
    return {
        "today_score": int(row.get("today_score", 0)),
        "all_time_score": int(row.get("all_time_score", 0)),
    }


def _insert_reward_event(
    user_id: str,
    event_type: str,
    message: str,
    *,
    points: int = 0,
    ref_type: str | None = None,
    ref_id: str | None = None,
) -> None:
    supabase.table("sst_reward_events").insert(
        {
            "user_id": user_id,
            "event_type": event_type,
            "ref_type": ref_type,
            "ref_id": ref_id,
            "points": points,
            "message": message,
        }
    ).execute()


def update_mission_progress(
    user_id: str,
    *,
    confirm_delta: int = 0,
    fix_delta: int = 0,
    review_delta: int = 0,
    score_delta: int = 0,
) -> None:
    if not any([confirm_delta, fix_delta, review_delta, score_delta]):
        return

    now_kst = _now_kst()
    missions_res = (
        supabase.table("sst_missions")
        .select("*")
        .eq("is_active", True)
        .order("sort_order")
        .execute()
    )
    missions = missions_res.data or []
    for mission in missions:
        target_type = mission.get("target_type")
        delta = 0
        if target_type == "confirm_count":
            delta = confirm_delta
        elif target_type == "fix_count":
            delta = fix_delta
        elif target_type == "review_count":
            delta = review_delta
        elif target_type == "score_gain":
            delta = score_delta
        if delta <= 0:
            continue

        scope = mission.get("scope", "daily")
        key = _period_key(scope, now_kst)
        mission_id = mission["id"]
        target = int(mission.get("target_value", 0))

        row_res = (
            supabase.table("sst_user_mission_progress")
            .select("*")
            .eq("user_id", user_id)
            .eq("mission_id", mission_id)
            .eq("period_key", key)
            .limit(1)
            .execute()
        )
        rows = row_res.data or []
        existing = rows[0] if rows else None
        prev_progress = int((existing or {}).get("progress", 0))
        next_progress = min(target, prev_progress + delta)
        is_new_completion = prev_progress < target and next_progress >= target

        payload = {
            "user_id": user_id,
            "mission_id": mission_id,
            "period_key": key,
            "progress": next_progress,
            "updated_at": _now_utc().isoformat(),
        }
        if is_new_completion:
            payload["completed_at"] = _now_utc().isoformat()
        elif existing and existing.get("completed_at"):
            payload["completed_at"] = existing["completed_at"]

        if existing:
            supabase.table("sst_user_mission_progress").update(payload).eq("id", existing["id"]).execute()
        else:
            supabase.table("sst_user_mission_progress").insert(payload).execute()

        if is_new_completion:
            _insert_reward_event(
                user_id,
                "mission_completed",
                f"Mission completed: {mission.get('title', mission_id)}",
                ref_type="mission",
                ref_id=mission_id,
                points=0,
            )


def apply_suggestion_reward(
    suggestion_id: str,
    previous_status: str,
    next_status: str,
    user_id: str,
) -> int:
    if previous_status != SuggestionStatusValue.pending.value:
        return 0
    if next_status not in (SuggestionStatusValue.confirmed.value, SuggestionStatusValue.corrected.value):
        return 0

    sug_res = (
        supabase.table("sst_suggestions")
        .select("reward_granted_at,reward_points")
        .eq("id", suggestion_id)
        .limit(1)
        .execute()
    )
    rows = sug_res.data or []
    if not rows:
        return 0
    row = rows[0]
    if row.get("reward_granted_at"):
        return 0

    points = 10 if next_status == SuggestionStatusValue.confirmed.value else 20
    user_scores = _fetch_user_scores(user_id)
    new_today = user_scores["today_score"] + points
    new_all = user_scores["all_time_score"] + points

    supabase.table("sst_users").update(
        {"today_score": new_today, "all_time_score": new_all}
    ).eq("id", user_id).execute()

    supabase.table("sst_suggestions").update(
        {"reward_granted_at": _now_utc().isoformat(), "reward_points": points}
    ).eq("id", suggestion_id).execute()

    _insert_reward_event(
        user_id,
        "score",
        f"Suggestion {next_status}: +{points}",
        points=points,
        ref_type="suggestion",
        ref_id=suggestion_id,
    )

    update_mission_progress(
        user_id,
        confirm_delta=1 if next_status == SuggestionStatusValue.confirmed.value else 0,
        fix_delta=1 if next_status == SuggestionStatusValue.corrected.value else 0,
        review_delta=1,
        score_delta=points,
    )
    return points


def _compute_weekly_scores() -> dict[str, int]:
    since = (_now_utc() - timedelta(days=7)).isoformat()
    res = (
        supabase.table("sst_reward_events")
        .select("user_id,points")
        .gte("occurred_at", since)
        .execute()
    )
    rows = res.data or []
    bucket: dict[str, int] = defaultdict(int)
    for row in rows:
        uid = row.get("user_id")
        if uid:
            bucket[uid] += int(row.get("points", 0))
    return bucket


def _calc_rank(sorted_user_ids: list[str], user_id: str) -> int | None:
    try:
        return sorted_user_ids.index(user_id) + 1
    except ValueError:
        return None


def _next_achievement(all_time_score: int) -> NextAchievement:
    targets = [("score-500", 500), ("score-5000", 5000)]
    for ach_id, target in targets:
        if all_time_score < target:
            return NextAchievement(id=ach_id, remaining=target - all_time_score)
    return NextAchievement(id=None, remaining=0)


def _compute_streak_days(user_id: str) -> int:
    """Compute consecutive active days in KST from reward events."""
    now_kst = _now_kst().date()
    since = (_now_utc() - timedelta(days=60)).isoformat()
    res = (
        supabase.table("sst_reward_events")
        .select("occurred_at")
        .eq("user_id", user_id)
        .gte("occurred_at", since)
        .order("occurred_at", desc=True)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return 0

    active_dates: set = set()
    for row in rows:
        ts = row.get("occurred_at")
        if not ts:
            continue
        try:
            dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00")).astimezone(KST)
            active_dates.add(dt.date())
        except ValueError:
            continue

    if not active_dates:
        return 0

    streak = 0
    cursor = now_kst
    # allow "yesterday start" when no activity today yet
    if cursor not in active_dates:
        cursor = cursor - timedelta(days=1)
    while cursor in active_dates:
        streak += 1
        cursor = cursor - timedelta(days=1)
    return streak


def build_gamification_snapshot(user_id: str) -> GamificationSnapshotResponse:
    user_scores = _fetch_user_scores(user_id)
    today_score = user_scores["today_score"]
    all_time_score = user_scores["all_time_score"]
    weekly_scores = _compute_weekly_scores()
    week_score = weekly_scores.get(user_id, 0)

    users_res = supabase.table("sst_users").select("id,today_score,all_time_score").execute()
    users = users_res.data or []
    daily_sorted = [x["id"] for x in sorted(users, key=lambda x: int(x.get("today_score", 0)), reverse=True)]
    all_sorted = [x["id"] for x in sorted(users, key=lambda x: int(x.get("all_time_score", 0)), reverse=True)]
    weekly_sorted = [uid for uid, _ in sorted(weekly_scores.items(), key=lambda kv: kv[1], reverse=True)]

    now_kst = _now_kst()
    daily_key = _period_key("daily", now_kst)
    progress_res = (
        supabase.table("sst_user_mission_progress")
        .select("progress")
        .eq("user_id", user_id)
        .eq("mission_id", "daily-review-20")
        .eq("period_key", daily_key)
        .limit(1)
        .execute()
    )
    progress_rows = progress_res.data or []
    daily_progress = int(progress_rows[0].get("progress", 0)) if progress_rows else 0

    events_res = (
        supabase.table("sst_reward_events")
        .select("*")
        .eq("user_id", user_id)
        .order("occurred_at", desc=True)
        .limit(10)
        .execute()
    )
    recent_rows = events_res.data or []
    recent_events = [
        RewardEventResponse(
            id=str(r.get("id", "")),
            event_type=str(r.get("event_type", "")),
            ref_type=r.get("ref_type"),
            ref_id=r.get("ref_id"),
            points=int(r.get("points", 0)),
            message=str(r.get("message", "")),
            occurred_at=str(r.get("occurred_at", "")),
        )
        for r in recent_rows
    ]

    return GamificationSnapshotResponse(
        today_score=today_score,
        week_score=week_score,
        all_time_score=all_time_score,
        streak_days=_compute_streak_days(user_id),
        daily_goal=DAILY_GOAL_DEFAULT,
        daily_progress=daily_progress,
        rank_daily=_calc_rank(daily_sorted, user_id),
        rank_weekly=_calc_rank(weekly_sorted, user_id),
        rank_all_time=_calc_rank(all_sorted, user_id),
        next_achievement=_next_achievement(all_time_score),
        recent_events=recent_events,
    )


def get_missions(user_id: str) -> MissionsResponse:
    missions_res = (
        supabase.table("sst_missions")
        .select("*")
        .eq("is_active", True)
        .order("scope")
        .order("sort_order")
        .execute()
    )
    missions = missions_res.data or []
    now_kst = _now_kst()
    out_daily: list[MissionProgressResponse] = []
    out_weekly: list[MissionProgressResponse] = []

    for m in missions:
        scope = str(m.get("scope", "daily"))
        period_key = _period_key(scope, now_kst)
        row_res = (
            supabase.table("sst_user_mission_progress")
            .select("*")
            .eq("user_id", user_id)
            .eq("mission_id", m["id"])
            .eq("period_key", period_key)
            .limit(1)
            .execute()
        )
        rows = row_res.data or []
        row = rows[0] if rows else {}
        progress = int(row.get("progress", 0))
        target = int(m.get("target_value", 0))
        claimed_at = row.get("claimed_at")
        state = "NotStarted"
        if claimed_at:
            state = "Claimed"
        elif progress >= target:
            state = "Completed"
        elif progress > 0:
            state = "InProgress"

        item = MissionProgressResponse(
            mission_id=m["id"],
            scope=scope,
            title=str(m.get("title", "")),
            description=str(m.get("description", "")),
            progress=progress,
            target=target,
            state=state,
            reward=MissionReward(
                points=int(m.get("reward_points", 0)),
                badge=m.get("reward_badge"),
            ),
        )
        if scope == "weekly":
            out_weekly.append(item)
        else:
            out_daily.append(item)

    return MissionsResponse(daily=out_daily, weekly=out_weekly)


def claim_mission_reward(user_id: str, mission_id: str) -> ClaimMissionResponse:
    m_res = supabase.table("sst_missions").select("*").eq("id", mission_id).eq("is_active", True).limit(1).execute()
    m_rows = m_res.data or []
    if not m_rows:
        return ClaimMissionResponse(mission_id=mission_id, state="NotFound", reward_points=0)
    mission = m_rows[0]

    scope = str(mission.get("scope", "daily"))
    period_key = _period_key(scope, _now_kst())
    p_res = (
        supabase.table("sst_user_mission_progress")
        .select("*")
        .eq("user_id", user_id)
        .eq("mission_id", mission_id)
        .eq("period_key", period_key)
        .limit(1)
        .execute()
    )
    p_rows = p_res.data or []
    if not p_rows:
        return ClaimMissionResponse(mission_id=mission_id, state="NotStarted", reward_points=0)
    progress = p_rows[0]
    if progress.get("claimed_at"):
        return ClaimMissionResponse(
            mission_id=mission_id,
            state="Claimed",
            claimed_at=str(progress.get("claimed_at")),
            reward_points=int(mission.get("reward_points", 0)),
        )
    if int(progress.get("progress", 0)) < int(mission.get("target_value", 0)):
        return ClaimMissionResponse(mission_id=mission_id, state="InProgress", reward_points=0)

    claim_time = _now_utc().isoformat()
    supabase.table("sst_user_mission_progress").update({"claimed_at": claim_time}).eq("id", progress["id"]).execute()
    reward_points = int(mission.get("reward_points", 0))
    if reward_points > 0:
        user_scores = _fetch_user_scores(user_id)
        supabase.table("sst_users").update(
            {
                "today_score": user_scores["today_score"] + reward_points,
                "all_time_score": user_scores["all_time_score"] + reward_points,
            }
        ).eq("id", user_id).execute()

    _insert_reward_event(
        user_id,
        "mission_claimed",
        f"Mission claimed: {mission.get('title', mission_id)}",
        ref_type="mission",
        ref_id=mission_id,
        points=reward_points,
    )
    return ClaimMissionResponse(
        mission_id=mission_id,
        state="Claimed",
        claimed_at=claim_time,
        reward_points=reward_points,
    )
