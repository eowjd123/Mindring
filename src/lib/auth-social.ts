import { prisma } from "./prisma";

type SocialProfile = {
  provider: "kakao" | "naver" | "google" | "apple";
  providerUserId: string;     // sub/id
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  refreshTokenEnc?: string | null;
};

export async function upsertUserFromSocial(p: SocialProfile) {
  // 이메일 기반 기존 사용자 매칭 → 없으면 생성
  const existingByEmail = p.email
    ? await prisma.user.findUnique({ where: { email: p.email } })
    : null;

  const account = await prisma.socialAccount.findUnique({
    where: { provider_providerUserId: { provider: p.provider, providerUserId: p.providerUserId } },
  });

  if (account) {
    // 기존 소셜 계정 → 사용자 반환(프로필 업데이트는 선택)
    return prisma.user.findUnique({ where: { userId: account.userId } });
  }

  const user =
    existingByEmail ??
    (await prisma.user.create({
      data: {
        email: p.email ?? null,
        name: p.displayName ?? null,
        avatarUrl: p.avatarUrl ?? null,
      },
    }));

  await prisma.socialAccount.create({
    data: {
      userId: user.userId,
      provider: p.provider,
      providerUserId: p.providerUserId,
      email: p.email ?? null,
      displayName: p.displayName ?? null,
      avatarUrl: p.avatarUrl ?? null,
      refreshTokenEnc: p.refreshTokenEnc ?? null,
    },
  });

  return user;
}
