import { getRequestAccount } from "../../_lib/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await getRequestAccount(request);
  if (!account) return Response.json({ ok: true, account: null });
  return Response.json({
    ok: true,
    account: {
      id: account.id,
      name: account.name,
      mobile: account.mobile,
      role: account.role,
      status: account.status,
    },
  });
}
