import jwt from "jsonwebtoken";

export function authGuard(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    throw new Error("Unauthorized");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret not configured");
  }

  try {
    const user = jwt.verify(token, secret);
    return user; // return the user to be used in the handler
  } catch {
    throw new Error("Invalid token");
  }
}
