"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Play, Star, Users } from "lucide-react";

import { IssuesSection } from "@/components/issues-section";
import { ScorecardSection } from "@/components/scorecard-section";
import { useTeamWorkspace } from "@/components/team-workspace-provider";
import { Button } from "@/components/ui/button";
import {
  getActiveMeeting,
  getMeetingSummaries,
  getMeetingSummary,
  getServerNow,
  joinMeeting,
  rateMeeting,
  updateMeetingState,
  type ApiMeeting,
  type ApiMeetingSummary,
  type MeetingState,
} from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { getAccessToken, refreshSession } from "@/lib/auth";
import { readMeetingEventStream } from "@/lib/meeting-sse";
import type { DemoIssue, DemoTodo } from "@/lib/types";

const AGENDA = [
  { id: "start", label: "Scorecard", minutes: 5 },
  { id: "ids", label: "IDS · Identify, Discuss, Solve", minutes: 60 },
  { id: "conclude", label: "Conclude", minutes: 10 },
] as const;

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "The request failed."; }
function formatTime(value: string) { return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }); }
function formatDuration(value: number) { const seconds = Math.abs(value); return `${value < 0 ? "+" : ""}${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }
function sectionStartedAt(meeting: ApiMeeting) { return meeting.state === "conclude" ? meeting.conclude_started_at ?? meeting.started_at : meeting.state === "ids" ? meeting.ids_started_at ?? meeting.started_at : meeting.started_at; }
function roundHalfUp1dp(value: number) { return (Math.floor(value * 10 + 0.5 + Number.EPSILON) / 10).toFixed(1); }

export function MeetingPage() {
  const {
    currentUser,
    members,
    todos,
    issues,
    selectedTeamId,
    loading: workspaceLoading,
    refreshWorkspace,
  } = useTeamWorkspace();
  const [meeting, setMeeting] = useState<ApiMeeting | null>(null);
  const [summaries, setSummaries] = useState<ApiMeetingSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<ApiMeetingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [clockAnchor, setClockAnchor] = useState<{
    meetingId: string;
    serverMs: number;
    clientMs: number;
  } | null>(null);
  const serverNowRef = useRef<number | null>(null);

  const syncMeetingState = useCallback((next: ApiMeeting | null) => {
    setMeeting(next && !next.ended_at ? next : null);
    if (next && !next.ended_at) {
      // Refresh the server-owned clock from the latest server_now so the timer
      // stays anchored to the server, not the machine wall clock.
      if (next.server_now) {
        serverNowRef.current = new Date(next.server_now).getTime();
      }
      const serverMs =
        serverNowRef.current ??
        new Date(sectionStartedAt(next)).getTime();
      // Establish a fresh anchor only when we have none for this meeting, or
      // when the server clock has drifted beyond our projection. Joins,
      // ratings and advances within the same meeting must not reset/rewind the
      // clock; it keeps advancing from the server anchor.
      setClockAnchor((prev) => {
        if (prev && prev.meetingId === next.id) {
          const projected =
            prev.serverMs + Math.max(0, Date.now() - prev.clientMs);
          if (serverMs > projected + 1000) {
            return { meetingId: next.id, serverMs, clientMs: Date.now() };
          }
          return prev;
        }
        return { meetingId: next.id, serverMs, clientMs: Date.now() };
      });
    } else {
      setClockAnchor(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setNotice(null);
    try {
      // Anchor the client clock on the server-owned clock so the timer
      // advances correctly even when the machine clock differs from APP_NOW.
      const serverNowPayload = await getServerNow().catch(() => null);
      serverNowRef.current = serverNowPayload?.server_now
        ? new Date(serverNowPayload.server_now).getTime()
        : null;
      const [active, historic] = await Promise.all([
        getActiveMeeting(selectedTeamId).catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }),
        getMeetingSummaries(selectedTeamId),
      ]);
      syncMeetingState(active); setSummaries(historic);
      // Refresh workspace data so issues/todos/scores reflect changes made by
      // other users (e.g. an Issue solved in the meeting) before this client
      // connected to the meeting SSE stream.
      void refreshWorkspace();
    } catch (error) { setNotice(errorMessage(error)); } finally { setLoading(false); }
  }, [selectedTeamId, syncMeetingState, refreshWorkspace]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => {
    if (!meeting) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [meeting]);

  const waitForSummary = useCallback(async (meetingId: string) => {
    setNotice("Preparing the meeting summary…");
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const summary = await getMeetingSummary(selectedTeamId, meetingId);
        setSelectedSummary(summary);
        setSummaries((old) => [summary, ...old.filter((item) => item.id !== summary.id)]);
        setNotice(null); return;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 503) { setNotice(errorMessage(error)); return; }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
      }
    }
    setNotice("The summary is still being prepared. Please reopen it shortly.");
  }, [selectedTeamId]);

  const activeMeetingId = meeting?.id;
  useEffect(() => {
    if (!activeMeetingId) return;
    const controller = new AbortController(); let retry: number | undefined; let attempts = 0; let ended = false;
    const connect = async () => {
      try {
        // Provide a fresh token before every attempt so reconnects do not
        // depend on a 401 round-trip and the stream stays authenticated.
        let token = getAccessToken();
        if (!token) {
          const refreshed = await refreshSession();
          token = refreshed.access_token;
        }
        // Catch up on any workspace changes missed while the SSE stream was
        // disconnected (reconnection gap, tab hidden, network blip). This
        // ensures issues solved, todos toggled, and scores edited by other
        // attendees are reflected even if their workspace_updated events were
        // dropped while this client was offline.
        void refreshWorkspace();
        await readMeetingEventStream(selectedTeamId, activeMeetingId, token, controller.signal, {
          onMeetingState: (next) => {
            syncMeetingState(next);
            if (next.ended_at) {
              ended = true;
              void waitForSummary(next.id);
              void load();
            }
          },
          onWorkspaceUpdated: () => { void refreshWorkspace(); },
          onUnavailable: setNotice,
        });
        // Clean close: reconnect with backoff instead of resetting attempts to
        // zero, so repeated clean closes back off like error reconnects.
        attempts += 1;
        if (!controller.signal.aborted && !ended) {
          retry = window.setTimeout(
            () => void connect(),
            Math.min(1000 * 2 ** attempts, 15000)
          );
        }
      } catch (error) {
        if (controller.signal.aborted || ended) return;
        if (error instanceof ApiError && error.status === 401) {
          try {
            await refreshSession();
            retry = window.setTimeout(() => void connect(), 1000);
          } catch {
            setNotice("Your session has expired. Please sign in.");
            return;
          }
          return;
        }
        attempts += 1;
        setNotice(errorMessage(error));
        retry = window.setTimeout(() => void connect(), Math.min(1000 * 2 ** attempts, 15000));
      }
    };
    void connect();
    return () => { controller.abort(); if (retry) window.clearTimeout(retry); };
  }, [activeMeetingId, load, refreshWorkspace, selectedTeamId, syncMeetingState, waitForSummary]);

  const mutate = useCallback(async (request: () => Promise<ApiMeeting | void>) => {
    setPending(true); setNotice(null);
    try { const result = await request(); if (result) syncMeetingState(result); return result; }
    catch (error) { setNotice(errorMessage(error)); return undefined; }
    finally { setPending(false); }
  }, [syncMeetingState]);

  const start = () => void mutate(() => updateMeetingState(selectedTeamId, "start"));
  const join = () => void mutate(async () => { if (!meeting) return; await joinMeeting(selectedTeamId, meeting.id); });
  const advance = () => { if (!meeting) return; const state: MeetingState = meeting.state === "start" ? "ids" : "conclude"; void mutate(() => updateMeetingState(selectedTeamId, state, meeting.id)); };
  const end = () => { if (!meeting) return; const id = meeting.id; void mutate(async () => { const result = await updateMeetingState(selectedTeamId, "end", id); void waitForSummary(id); return result; }); };
  const rate = (rating: number) =>
    void mutate(async () => {
      if (!meeting) return;
      await rateMeeting(selectedTeamId, meeting.id, rating);
    });

  if (workspaceLoading || loading) return <p className="rounded-xl border border-[#eee5de] bg-white px-5 py-4 text-sm text-[#756d67]">Loading meeting workspace…</p>;
  return <div className="space-y-6">
    {notice ? <p aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{notice}</p> : null}
    {meeting ? <ActiveMeeting meeting={meeting} currentUserId={currentUser.id} canRate={currentUser.role !== "observer"} members={members} todos={todos} issues={issues} clockAnchor={clockAnchor} now={now} pending={pending} onJoin={join} onAdvance={advance} onEnd={end} onRate={rate} /> : <InactiveMeeting canStart={currentUser.role !== "observer"} pending={pending} summaries={summaries} selectedSummary={selectedSummary && summaries.some((item) => item.id === selectedSummary.id) ? selectedSummary : null} onStart={start} onSelect={setSelectedSummary} onClose={() => setSelectedSummary(null)} />}
  </div>;
}

function InactiveMeeting({
  canStart,
  pending,
  summaries,
  selectedSummary,
  onStart,
  onSelect,
  onClose,
}: {
  canStart: boolean;
  pending: boolean;
  summaries: ApiMeetingSummary[];
  selectedSummary: ApiMeetingSummary | null;
  onStart: () => void;
  onSelect: (summary: ApiMeetingSummary) => void;
  onClose: () => void;
}) {
  return <>
    <section className="rounded-2xl border border-[#eee5de] bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold tracking-wide text-[#9b4d18] uppercase">Weekly Level 10</p><h2 className="mt-2 text-2xl font-semibold text-[#30261f]">Make space for what matters.</h2><p className="mt-2 text-sm text-[#756d67]">Review the Scorecard, identify and solve Issues, then conclude with clear To-Dos and a meeting rating.</p></div>{canStart ? <Button className="bg-[#a64e16] text-white hover:bg-[#873e10]" disabled={pending} onClick={onStart} type="button"><Play className="size-4" />Start Level 10</Button> : <p className="text-sm text-[#756d67]">Observers can join an active meeting but cannot start one.</p>}</div></section>
    <AgendaCards state={null} />
    <section className="rounded-2xl border border-[#eee5de] bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-[#30261f]">Recent ended meetings</h2>{summaries.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{summaries.map((summary) => <button className="rounded-xl border border-[#f1ebe6] bg-[#fcfaf8] p-4 text-left hover:border-[#e8bd9e]" key={summary.id} onClick={() => onSelect(summary)} type="button"><p className="text-xs font-semibold text-[#30261f]">Level 10 · {formatTime(summary.ended_at)}</p><p className="mt-2 text-[11px] text-[#756d67]">{summary.attendees.length} attendees · {summary.average_rating === null ? "No rating" : `${summary.average_rating.toFixed(1)} average`}</p></button>)}</div> : <p className="mt-3 text-sm text-[#91867e]">No ended meetings yet.</p>}</section>
    {selectedSummary ? <SummaryDetail summary={selectedSummary} onClose={onClose} /> : null}
  </>;
}

function ActiveMeeting({
  meeting,
  currentUserId,
  canRate,
  members,
  todos,
  issues,
  clockAnchor,
  now,
  pending,
  onJoin,
  onAdvance,
  onEnd,
  onRate,
}: {
  meeting: ApiMeeting;
  currentUserId: string;
  canRate: boolean;
  members: { id: string; name: string; initials: string; }[];
  todos: DemoTodo[];
  issues: DemoIssue[];
  clockAnchor: { meetingId: string; serverMs: number; clientMs: number; } | null;
  now: number;
  pending: boolean;
  onJoin: () => void;
  onAdvance: () => void;
  onEnd: () => void;
  onRate: (rating: number) => void;
}) {
  const section = AGENDA.find((item) => item.id === meeting.state) ?? AGENDA[0];
  const startedMs = new Date(sectionStartedAt(meeting)).getTime();
  const clock =
    clockAnchor && clockAnchor.meetingId === meeting.id
      ? clockAnchor.serverMs + Math.max(0, (now || clockAnchor.clientMs) - clockAnchor.clientMs)
      : startedMs;
  const seconds = Math.ceil((section.minutes * 60_000 - (clock - startedMs)) / 1000);
  const attending = meeting.attendees.some((item) => item.user.id === currentUserId);
  const facilitating = meeting.facilitator.id === currentUserId;
  const selfRating = meeting.attendees.find((item) => item.user.id === currentUserId)?.rating ?? null;
  const ratings = meeting.attendees.map((item) => item.rating).filter((item): item is number => item !== null);
  const average = ratings.length ? ratings.reduce((total, item) => total + item, 0) / ratings.length : null;
  // "New To-Dos" = to-dos created within this meeting's window. Bound by
  // [started_at, ended_at] once ended, or [started_at, conclude_started_at]
  // while Conclude is active (ended_at is null). Parse timestamps instead of
  // comparing ISO strings, and scope to this meeting's window.
  const startedAtMs = new Date(meeting.started_at).getTime();
  const endMs = meeting.ended_at
    ? new Date(meeting.ended_at).getTime()
    : meeting.conclude_started_at
      ? new Date(meeting.conclude_started_at).getTime()
      : Infinity;
  const meetingTodos = todos.filter((todo) => {
    const createdMs = new Date(todo.createdAt).getTime();
    return createdMs >= startedAtMs && createdMs <= endMs;
  });
  return <>
    <section className="overflow-hidden rounded-2xl border border-[#eee5de] bg-white shadow-sm"><div className="flex flex-col gap-5 border-b border-[#f1ebe6] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-emerald-500" /><span className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">Meeting in progress</span>{facilitating ? <span className="rounded-full bg-[#fcf2e9] px-2 py-0.5 text-[10px] font-semibold text-[#9b4d18]">You are facilitating</span> : null}</div><h2 className="mt-2 text-lg font-semibold text-[#30261f]">{section.label}</h2><p className="mt-1 text-xs text-[#91867e]">Facilitator: {meeting.facilitator.name}</p></div><div className="flex flex-wrap items-center gap-3"><div className={`min-w-32 rounded-xl px-4 py-2.5 text-center ${seconds <= 0 ? "bg-rose-50 text-rose-800" : "bg-[#fcfaf8] text-[#30261f]"}`}><p className="text-[10px] font-medium tracking-wide uppercase">{seconds <= 0 ? "Over time" : "Section timer"}</p><p className="mt-0.5 font-mono text-xl font-semibold tabular-nums">{formatDuration(seconds)}</p></div>{!attending ? <Button disabled={pending} onClick={onJoin} type="button" variant="outline"><Users className="size-3.5" />Join meeting</Button> : null}{facilitating ? <>{meeting.state !== "conclude" ? <Button className="bg-[#a64e16] text-white hover:bg-[#873e10]" disabled={pending} onClick={onAdvance} type="button">Advance agenda <ArrowRight className="size-3.5" /></Button> : null}<Button disabled={pending} onClick={onEnd} type="button" variant="outline">End meeting</Button></> : null}</div></div><div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_260px]"><AgendaCards state={meeting.state} /><aside><h3 className="flex items-center gap-2 text-xs font-semibold text-[#53463d]"><Users className="size-3.5 text-[#9b4d18]" />Attendees · {meeting.attendees.length}</h3><ul className="mt-3 space-y-2">{meeting.attendees.map((attendee) => { const member = members.find((item) => item.id === attendee.user.id); return <li className="flex items-center justify-between rounded-lg bg-[#fcfaf8] px-3 py-2" key={attendee.id}><span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#f7e5d7] text-[9px] font-semibold text-[#8e4214]">{member?.initials ?? attendee.user.name.slice(0, 2)}</span><span className="text-xs font-medium text-[#53463d]">{attendee.user.name}</span></span>{attendee.rating !== null ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9b4d18]"><Star className="size-3 fill-current" />{attendee.rating}</span> : null}</li>; })}</ul>{meeting.state === "conclude" ? <div className="mt-5 border-t border-[#f1ebe6] pt-4"><h3 className="text-xs font-semibold text-[#53463d]">Rate this meeting</h3>{attending && canRate ? <RatingSlider initialRating={selfRating} disabled={pending} onSave={onRate} /> : <p className="mt-2 text-[11px] text-[#91867e]">Join the meeting to rate it. Observers cannot submit ratings.</p>}</div> : null}</aside></div></section>
    {meeting.state === "start" ? <ScorecardSection /> : null}{meeting.state === "ids" ? <IssuesSection /> : null}{meeting.state === "conclude" ? <section className="rounded-2xl border border-[#eee5de] bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-[#30261f]">Conclude</h2><p className="mt-1 text-xs text-[#91867e]">Recap this meeting&apos;s new To-Dos and the team rating.</p><p className="mt-4 rounded-lg bg-[#fcfaf8] px-3 py-2 text-xs text-[#756d67]">Average rating <strong className="text-[#30261f]">{average === null ? "Not rated" : `${roundHalfUp1dp(average)} / 10`}</strong></p><div className="mt-4"><h3 className="text-xs font-semibold text-[#53463d]">New To-Dos · {meetingTodos.length}</h3>{meetingTodos.length ? <ul className="mt-2 space-y-2">{meetingTodos.map((todo) => { const owner = members.find((item) => item.id === todo.ownerId)?.name ?? "Unknown owner"; const sourceIssue = todo.issueId ? issues.find((item) => item.id === todo.issueId)?.title : null; return <li className="rounded-lg bg-[#fcfaf8] px-3 py-2 text-xs text-[#30261f]" key={todo.id}><p className="font-medium">{todo.title}</p><p className="mt-0.5 text-[11px] text-[#756d67]">Owner: {owner} · Due {todo.dueDate}{sourceIssue ? ` · From Issue: ${sourceIssue}` : ""}</p></li>; })}</ul> : <p className="mt-2 text-xs text-[#91867e]">No new To-Dos created in this meeting yet.</p>}</div></section> : null}
  </>;
}

function RatingSlider({
  initialRating,
  disabled,
  onSave,
}: {
  initialRating: number | null;
  disabled: boolean;
  onSave: (rating: number) => void;
}) {
  const [rating, setRating] = useState(initialRating ?? 5);
  return <form className="mt-3 space-y-3" onSubmit={(event) => { event.preventDefault(); onSave(rating); }}><div className="flex items-end justify-between"><label className="text-[11px] text-[#91867e]" htmlFor="meeting-rating">Your rating</label><output className="rounded-lg bg-[#fff1e6] px-2.5 py-1 text-lg font-semibold tabular-nums text-[#9b4d18]" htmlFor="meeting-rating">{rating}<span className="text-xs font-medium text-[#756d67]"> / 10</span></output></div><input aria-valuemax={10} aria-valuemin={1} aria-valuenow={rating} className="h-2 w-full cursor-pointer accent-[#a64e16]" disabled={disabled} id="meeting-rating" max="10" min="1" onChange={(event) => setRating(Number(event.target.value))} step="1" type="range" value={rating} /><div className="flex justify-between text-[10px] font-medium text-[#91867e]"><span>1</span><span>5</span><span>10</span></div><Button className="w-full bg-[#a64e16] text-white hover:bg-[#873e10]" disabled={disabled} type="submit">{initialRating === null ? "Submit rating" : "Update rating"}</Button></form>;
}

function AgendaCards({ state }: { state: MeetingState | null; }) { const activeIndex = AGENDA.findIndex((item) => item.id === state); return <div className="grid gap-3 md:grid-cols-3">{AGENDA.map((item, index) => <div className={`rounded-xl border p-4 ${item.id === state ? "border-[#e8bd9e] bg-[#fff9f3]" : activeIndex > index ? "border-emerald-100 bg-emerald-50/60" : "border-[#f1ebe6] bg-white"}`} key={item.id}><div className="flex items-center justify-between"><span className="grid size-7 place-items-center rounded-full bg-[#f5f0ec] text-xs font-semibold text-[#756d67]">{activeIndex > index ? <Check className="size-3.5" /> : index + 1}</span><span className="text-[10px] text-[#91867e]">{item.minutes} min</span></div><p className="mt-3 text-xs font-semibold text-[#30261f]">{item.label}</p></div>)}</div>; }
function SummaryDetail({ summary, onClose }: { summary: ApiMeetingSummary; onClose: () => void; }) { return <section className="rounded-2xl border border-[#eee5de] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold tracking-wide text-[#91867e] uppercase">Ended meeting</p><h2 className="mt-1 text-lg font-semibold text-[#30261f]">Level 10 · {formatTime(summary.ended_at)}</h2><p className="mt-1 text-xs text-[#756d67]">Reviewed week of {summary.reviewed_week} · Average rating: {summary.average_rating === null ? "Not rated" : `${summary.average_rating.toFixed(1)} / 10`}</p></div><Button onClick={onClose} type="button" variant="outline">Close</Button></div><div className="mt-5 grid gap-6 lg:grid-cols-2"><SummaryList title="Last closed-week measurable statuses" items={summary.measurables.map((item) => `${item.name}: ${item.score === null ? "No score" : `${item.score} ${item.unit}`} · ${item.status === "on_track" ? "On track" : "Off track"}`)} /><SummaryList title="Solved Issues" items={summary.issues.solved.map((item) => item.title)} /><SummaryList title="Created To-Dos" items={summary.todos.created.map((item) => `${item.title} · due ${item.due_date}`)} /><SummaryList title="Attendees and ratings" items={summary.attendees.map((item) => `${item.user.name}: ${item.rating ?? "Not rated"}`)} /></div></section>; }
function SummaryList({ title, items }: { title: string; items: string[]; }) { return <div><h3 className="text-sm font-semibold text-[#30261f]">{title}</h3>{items.length ? <ul className="mt-3 space-y-2">{items.map((item, index) => <li className="rounded-lg bg-[#fcfaf8] px-3 py-2.5 text-xs text-[#53463d]" key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="mt-3 text-xs text-[#91867e]">None recorded.</p>}</div>; }
