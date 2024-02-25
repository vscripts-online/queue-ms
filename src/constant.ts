import * as path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ProtoGrpcType } from "@pb/queue";

export const QUEUE_PROTO_PATH = path.resolve("./proto/queue.proto");

export const pb_services = {
  get queue() {
    const packageDef = protoLoader.loadSync(QUEUE_PROTO_PATH);

    const proto = grpc.loadPackageDefinition(
      packageDef
    ) as unknown as ProtoGrpcType;

    return proto.queue.QueueService.service;
  },
};
