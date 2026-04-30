import { Response, NextFunction } from "express";
import env from "src/util/validateEnv";
import { AuthenticatedRequest } from "src/validators/authUserMiddleware";

/**
 * Extra allowlist entries (merged with STUDENT_ORG_ALLOWED_EMAILS from .env).
 * Both lists apply: add long-lived defaults here and/or set STUDENT_ORG_ALLOWED_EMAILS in .env.
 */
const ALLOWED_ORGANIZATION_EMAILS: string[] = [
  // "mik127@ucsd.edu",
];

function allowedEmailsSet(): Set<string> {
  const fromCode = ALLOWED_ORGANIZATION_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean);
  const raw = env.STUDENT_ORG_ALLOWED_EMAILS || "";
  const fromEnv = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const combined = [...fromCode, ...fromEnv];
  if (!combined.length) return new Set();
  return new Set(combined);
}

/** Returns whether the given email can have "My Organization" access. */
export function hasStudentOrgAccess(email: string): boolean {
  const normalized = (email || "").trim().toLowerCase();
  const allowed = allowedEmailsSet();
  return allowed.size > 0 && allowed.has(normalized);
}

/**
 * Middleware that restricts "My Organization" to allowed emails only.
 * Union of ALLOWED_ORGANIZATION_EMAILS and STUDENT_ORG_ALLOWED_EMAILS (.env). Use after authenticateUser.
 */
export const requireStudentOrgAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const email = (req.user.userEmail || "").trim().toLowerCase();
  const allowed = allowedEmailsSet();
  if (!allowed.size) {
    return res.status(403).json({
      message: "Student organization access is not enabled for any accounts.",
    });
  }
  if (!allowed.has(email)) {
    return res.status(403).json({
      message: "You do not have access to student organization features.",
    });
  }
  next();
};
