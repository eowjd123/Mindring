// app/(public)/signup/page.tsx

import SignupForm from "./SignupForm";

export const metadata = { title: "회원가입 - DigitalNote" };

type Search = Record<string, string | string[] | undefined>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const sp = (await searchParams) ?? {};
  const errParam = sp.error;
  const error = (Array.isArray(errParam) ? errParam[0] : errParam) ?? "";

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <SignupForm initialError={error} />
      </div>
    </main>
  );
}
