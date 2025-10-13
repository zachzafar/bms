"use server";

import { jwtVerify, SignJWT } from "jose";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";


export type Session = {
  refreshToken: string;
  accessToken: string;
};


const secretKey = process.env.SESSION_SECRET_KEY;
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(payload: Session) {
  const expiredAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );
  


  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  cookies().set("session", session, {
    httpOnly: true,
    // secure: process.env.SECURE === "true",
    expires: expiredAt,
    sameSite: "lax",
    path: "/",
    // domain: process.env.DOMAIN,
  });
}

export async function getSessionFromRequest(req: NextRequest) {
  const cookie = req.cookies.get("session")?.value
  if (!cookie) return null;


  try {
    const { payload } = await jwtVerify(
      cookie,
      encodedKey,
      {
        algorithms: ["HS256"],
      }
    );


    return payload as Session;
  } catch (err) {
    console.error("Failed to verify the session", err);
    return null
  }
}

export async function getSession() {
  const cookie = cookies().get("session")?.value;

  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(
      cookie,
      encodedKey,
      {
        algorithms: ["HS256"],
      }
    );
    console.log("payload",payload)
    return payload as Session;
  } catch (err) {
    console.error("Failed to verify the session", err);
    redirect("/login");
  }
}

export  async function deleteSession() {
   await cookies().delete("session");
}

export async function updateTokens( refreshToken:string ,accessToken: string) {

  console.log("Trying to update session")
  
  const cookie = cookies().get("session")?.value;
  if (!cookie) return null;

  const { payload } = await jwtVerify<Session>(
    cookie,
    encodedKey
  );
  

  if (!payload) throw new Error("Session not found");
  console.log("new Session payload", payload)

  const newPayload: Session = {
    refreshToken,
    accessToken
  };

  await createSession(newPayload);
}