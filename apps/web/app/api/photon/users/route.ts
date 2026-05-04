import { NextResponse } from "next/server";

const PHOTON_BASE_URL = "https://spectrum.photon.codes";

function normalisePhone(phone: string) {
  const compact = phone.replace(/[\s\-().]/g, "");
  const digits = compact.replace(/\D/g, "");

  if (compact.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  return compact;
}

function photonAuth() {
  const projectId = process.env.SPECTRUM_PROJECT_ID;
  const projectSecret = process.env.SPECTRUM_PROJECT_SECRET;

  if (!projectId || !projectSecret) {
    throw new Error("Photon credentials are not configured");
  }

  return {
    projectId,
    authorization: `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString("base64")}`,
  };
}

function userRedirect(userId: string) {
  return `${PHOTON_BASE_URL}/users/${userId}/redirect?msg=${encodeURIComponent("Hey KUPI!")}`;
}

function photonErrorMessage(message?: string) {
  if (message?.includes("No available shared phone numbers")) {
    return "Photon has no shared iMessage numbers available for this project. Delete an unused shared test user in Photon or upgrade the project, then try again.";
  }

  return message ?? "Photon user creation failed";
}

async function findExistingSharedUser(projectId: string, authorization: string, phoneNumber: string) {
  const response = await fetch(
    `${PHOTON_BASE_URL}/projects/${projectId}/users?type=shared`,
    { headers: { Authorization: authorization } }
  );

  if (!response.ok) return null;

  const payload = await response.json();
  const users = (payload?.data?.users ?? []) as Array<{
    assignedPhoneNumber?: string;
    id: string;
    phoneNumber?: string;
  }>;

  return users.find(user => normalisePhone(user.phoneNumber ?? "") === phoneNumber) ?? null;
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      name?: string;
      phone?: string;
    };

    const firstName = input.name?.trim();
    const phoneNumber = normalisePhone(input.phone ?? "");

    if (!firstName || !phoneNumber) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const { projectId, authorization } = photonAuth();
    const response = await fetch(`${PHOTON_BASE_URL}/projects/${projectId}/users`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "shared",
        firstName,
        phoneNumber,
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.succeed) {
      const existing = await findExistingSharedUser(
        projectId,
        authorization,
        phoneNumber
      );

      if (existing) {
        return NextResponse.json({
          assignedPhoneNumber: existing.assignedPhoneNumber ?? null,
          photonUserId: existing.id,
          redirectUrl: userRedirect(existing.id),
        });
      }

      return NextResponse.json(
        { error: photonErrorMessage(payload.message), photonMessage: payload.message ?? null },
        { status: response.status || 500 }
      );
    }

    const user = payload.data as {
      assignedPhoneNumber?: string;
      id: string;
    };

    return NextResponse.json({
      assignedPhoneNumber: user.assignedPhoneNumber ?? null,
      photonUserId: user.id,
      redirectUrl: userRedirect(user.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
