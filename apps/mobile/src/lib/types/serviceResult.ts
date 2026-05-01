import type { ErrorKind } from "@/src/lib/errors/errorKinds";

/** Successful RPC / edge outcome with a typed payload (use `undefined` when there is none). */
export type ServiceSuccess<T> = { success: true; data: T };

export type ServiceFailureBusiness<Code extends string> = {
  success: false;
  kind: "business";
  errorCode: Code;
};

export type ServiceFailureTechnicalOrUnexpected = {
  success: false;
  kind: Exclude<ErrorKind, "business">;
};

/**
 * Standard service outcome: discriminated by `success`, failures carry `kind`;
 * stable `errorCode` only when `kind === "business"`.
 */
export type ServiceResult<T, BusinessCode extends string> =
  | ServiceSuccess<T>
  | ServiceFailureBusiness<BusinessCode>
  | ServiceFailureTechnicalOrUnexpected;
