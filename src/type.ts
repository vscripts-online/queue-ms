import type * as grpc from "@grpc/grpc-js";

type GetResponseType<Type> = Type extends grpc.handleUnaryCall<infer X, infer Y>
  ? Promise<Y>
  : null;

type GetRequestType<Type> = Type extends grpc.handleUnaryCall<infer X, infer Y>
  ? X
  : null;

export type GrpcResponserService<T extends grpc.UntypedServiceImplementation> =
  {
    [K in keyof T]: (data: GetRequestType<T[K]>) => GetResponseType<T[K]>;
  };
