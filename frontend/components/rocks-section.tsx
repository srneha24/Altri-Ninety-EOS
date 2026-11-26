"use client"

import { ChevronDown, Flag, Milestone } from "lucide-react"

import { useTeamWorkspace } from "@/components/team-workspace-provider"

function ownerName(
  ownerId: string,
  members: { id: string; name: string }[]
): string {
  return members.find((user) => user.id === ownerId)?.name ?? "Unknown owner"
}

function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function RocksSection() {
  const { rocks, members, today } = useTeamWorkspace()

  return (
    <section
      aria-labelledby="rocks-title"
      className="overflow-hidden rounded-2xl border border-[#eee5de] bg-white shadow-sm shadow-[#3d2517]/[0.025]"
    >
      <div className="border-b border-[#f1ebe6] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f7e5d7] text-[#9b4d18]">
            <Flag aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2
              className="text-base font-semibold tracking-[-0.02em] text-[#30261f]"
              id="rocks-title"
            >
              Quarterly Rocks
            </h2>
            <p className="mt-1 text-xs text-[#91867e]">
              Q4 priorities · read only
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#f5f0ec]">
        {rocks.map((rock) => {
          const completedCount = rock.milestones.filter(
            (milestone) => milestone.done
          ).length
          const progress =
            rock.milestones.length === 0
              ? rock.seededStatus === "complete"
                ? 100
                : 0
              : Math.floor(
                  (completedCount / rock.milestones.length) * 100 + 0.5
                )
          const hasOverdueMilestone = rock.milestones.some(
            (milestone) => !milestone.done && milestone.dueDate < today
          )
          const status =
            rock.seededStatus === "complete"
              ? "Complete"
              : rock.seededStatus === "off_track" || hasOverdueMilestone
                ? "Off track"
                : "On track"
          const statusColor =
            status === "Complete"
              ? "bg-emerald-50 text-emerald-800"
              : status === "Off track"
                ? "bg-rose-50 text-rose-800"
                : "bg-amber-50 text-amber-800"

          return (
            <details className="group px-5 py-4 sm:px-6" key={rock.id}>
              <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fcf2e9] text-[#a64e16]">
                  <Milestone aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#30261f]">
                    {rock.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#91867e]">
                    Owner: {ownerName(rock.ownerId, members)} · {completedCount}/
                    {rock.milestones.length} milestones
                  </span>
                </span>
                <span className="flex items-center gap-3 pl-11 sm:pl-0">
                  <span className="w-24">
                    <span className="mb-1 flex justify-between text-[10px] text-[#91867e]">
                      Progress <span>{progress}%</span>
                    </span>
                    <span
                      aria-label={`${progress}% complete`}
                      className="block h-1.5 overflow-hidden rounded-full bg-[#f1ebe6]"
                      role="img"
                    >
                      <span
                        className="block h-full rounded-full bg-[#c96a29]"
                        style={{ width: `${progress}%` }}
                      />
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusColor}`}
                  >
                    {status}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 text-[#91867e] transition-transform group-open:rotate-180"
                  />
                </span>
              </summary>
              <div className="mt-4 ml-4 border-l border-[#eee5de] pl-5 sm:ml-4">
                {rock.milestones.length ? (
                  <ul className="space-y-3">
                    {rock.milestones.map((milestone) => (
                      <li
                        className="flex items-start justify-between gap-3"
                        key={milestone.id}
                      >
                        <span className="flex items-start gap-2 text-xs text-[#53463d]">
                          <span
                            className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
                              milestone.done
                                ? "bg-emerald-50 text-emerald-700"
                                : "border border-[#ddd0c5] text-transparent"
                            }`}
                          >
                            {milestone.done ? (
                              <span aria-hidden="true" className="text-[9px]">
                                ✓
                              </span>
                            ) : null}
                          </span>
                          {milestone.title}
                        </span>
                        <span
                          className={`shrink-0 text-[11px] ${
                            !milestone.done && milestone.dueDate < today
                              ? "font-medium text-rose-700"
                              : "text-[#91867e]"
                          }`}
                        >
                          Due {dateLabel(milestone.dueDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#91867e]">
                    No milestones for this Rock.
                  </p>
                )}
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
