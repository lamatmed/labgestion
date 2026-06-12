import RegisterForm from './RegisterForm'

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <RegisterForm locale={locale} />
}
