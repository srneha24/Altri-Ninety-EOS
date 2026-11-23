"use client"

import { useEffect, useState, type SubmitEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  getAccessToken,
  getRefreshToken,
  loginWithEmail,
  refreshSession,
} from "@/lib/auth"

type LoginFormProps = {
  sessionExpired: boolean
}

export default function LoginForm({ sessionExpired }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState(
    sessionExpired ? "Your session has expired. Sign in again to continue." : ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      if (getAccessToken()) {
        router.replace("/")
        return
      }

      if (getRefreshToken()) {
        try {
          await refreshSession()
          if (active) {
            router.replace("/")
          }
        } catch {
          if (active) {
            setError("Your session has expired. Sign in again to continue.")
          }
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [router])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await loginWithEmail(email.trim())
      router.replace("/")
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-svh bg-[#faf8f6] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-svh flex-col justify-between overflow-hidden bg-[#2b1b13] p-12 text-white lg:flex xl:p-16">
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-36 size-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-16 size-[25rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-48 -left-40 size-[30rem] rounded-full bg-orange-500/10 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#ffc078] text-sm font-bold tracking-tight text-[#3d2517]">
            A
          </div>
          <span className="text-sm font-semibold tracking-[0.18em]">ALTRI</span>
          <span className="ml-1 border-l border-white/20 pl-4 text-xs tracking-[0.16em] text-white/60">
            EOS WORKSPACE
          </span>
        </div>

        <div className="relative max-w-xl pb-8">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-orange-100/90">
            <span className="size-1.5 rounded-full bg-[#ffc078]" />A clearer way
            to work together
          </div>
          <h1 className="max-w-lg text-5xl leading-[1.08] font-medium tracking-[-0.045em] xl:text-6xl">
            Make every week count.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            Bring your team&apos;s priorities, progress, and conversations into
            one steady rhythm.
          </p>
        </div>

        <p className="relative text-xs tracking-wide text-white/45">
          Clarity for the work that moves you forward.
        </p>
      </section>

      <section className="flex min-h-svh flex-col px-6 py-7 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center gap-3 lg:invisible">
          <div className="grid size-9 place-items-center rounded-lg bg-[#ffc078] text-xs font-bold tracking-tight text-[#3d2517]">
            A
          </div>
          <span className="text-xs font-semibold tracking-[0.18em] text-[#7c3e17]">
            ALTRI
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[25rem]">
            <div className="mb-8 grid size-12 place-items-center rounded-2xl border border-[#eee5de] bg-white text-[#9b4d18] shadow-sm">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>

            <p className="text-xs font-semibold tracking-[0.16em] text-[#8a6b55] uppercase">
              Your team workspace
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#30261f]">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#756d67]">
              Sign in with the email address linked to your seeded account.
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-[#3a3028]"
                  htmlFor="email"
                >
                  Work email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#93877e]"
                  />
                  <input
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-[#e7ded6] bg-white pr-4 pl-11 text-sm text-[#31241c] transition outline-none placeholder:text-[#a3988f] focus:border-[#c96a29] focus:ring-4 focus:ring-[#c96a29]/10"
                    id="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              {error ? (
                <p
                  aria-live="polite"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <Button
                className="h-12 w-full rounded-xl bg-[#a64e16] text-sm text-white shadow-sm hover:bg-[#873e10]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Signing in
                  </>
                ) : (
                  <>
                    Continue with email
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-[#93877e]">
              No password is required for this seeded-account login.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 text-[11px] text-[#91867e]">
          <span>ALTRI · EOS team workspace</span>
          <span>Built for a better week</span>
        </footer>
      </section>
    </main>
  )
}
