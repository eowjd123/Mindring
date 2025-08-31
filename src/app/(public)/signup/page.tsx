// app/(public)/signup/page.tsx

import SignupForm from "./SignupForm";

export const metadata = {
  title: "회원가입 - DigitalNote",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const error = (Array.isArray(sp?.error) ? sp.error[0] : sp?.error) ?? "";
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <SignupForm initialError={error} />
      </div>
    </main>
  );
}
