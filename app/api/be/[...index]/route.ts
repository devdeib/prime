/**
 * BFF proxy for the VG Furniture storefront: `/api/be/*` → backend `/v1/*`.
 * When `API_BASE` is unset, uses local mock auth/users/products persisted in `data/.mock-backend-store.json`.
 */
import axios, { AxiosError } from "axios";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { API_BASE } from "@/data/utils/api.urls";
import { tryMockBeRequest } from "@/lib/mock-be-http";

type SessionWithToken = {
  access_token?: string;
};

async function proxy(req: NextRequest, method: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!API_BASE) {
      const mock = await tryMockBeRequest(req, method, session);
      if (mock) return mock;
      return NextResponse.json(
        { statusCode: 404, message: "Not found", error: "Not Found" },
        { status: 404 }
      );
    }

    const url = req.nextUrl.pathname.replace("/api/be", "");
    const apiUrl = `${API_BASE}/v1${url}${req.nextUrl.search}`;
    const body = method === "GET" || method === "HEAD" ? undefined : await req.json();

    const accessToken = (session as SessionWithToken | null)?.access_token;
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;

    const apiRes = await axios({
      method,
      url: apiUrl,
      data: body,
      headers,
    });

    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (error) {
    if (error instanceof AxiosError) {
      return NextResponse.json(error.response?.data ?? {}, {
        status: error.response?.status ?? 400,
      });
    }
    return NextResponse.json(
      {
        statusCode: 400,
        message: "Unknown server error",
        error: "Bad Request",
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxy(req, "GET");
}

export async function POST(req: NextRequest) {
  return proxy(req, "POST");
}

export async function PATCH(req: NextRequest) {
  return proxy(req, "PATCH");
}

export async function PUT(req: NextRequest) {
  return proxy(req, "PUT");
}

export async function DELETE(req: NextRequest) {
  return proxy(req, "DELETE");
}
