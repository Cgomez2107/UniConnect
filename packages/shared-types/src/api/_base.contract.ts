import type { ZodSchema } from "zod";

export interface ApiContract<
  TReq extends ZodSchema,
  TRes extends ZodSchema,
> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  request: TReq;
  response: TRes;
}
