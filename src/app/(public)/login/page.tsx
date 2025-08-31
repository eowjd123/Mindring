// app/(public)/login/page.tsx

import LoginForm from "./Loginform";

export const metadata = {
  title: "로그인 - DigitalNote",
  description: "DigitalNote에 로그인하여 디지털 자서전과 인생그래프를 만들어보세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // searchParams를 await으로 기다림
  const params = await searchParams;
  const error =
    (Array.isArray(params?.error) ? params?.error[0] : params?.error) ?? "";

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-md z-10">
        <LoginForm initialError={error} />
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
      <div className="absolute top-1/4 right-10 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-indigo-300 rounded-full animate-bounce"></div>
      <div className="absolute bottom-10 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
    </main>
  );
}