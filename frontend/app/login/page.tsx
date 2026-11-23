import LoginForm from "./login-form"

type LoginPageProps = {
  searchParams: Promise<{
    session?: string | string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { session } = await searchParams

  return <LoginForm sessionExpired={session === "expired"} />
}
