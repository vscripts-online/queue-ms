import * as path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ProtoGrpcType as QueueProtoGrpcType } from "@pb/queue";
import { ProtoGrpcType as FileProtoGrpcType } from "@pb/file";

export const QUEUE_PROTO_PATH = path.resolve("./proto/queue.proto");

export const FILE_PROTO_PATH = path.resolve("./proto/file.proto");

export const pb_services = {
  get QueueService() {
    const packageDef = protoLoader.loadSync(QUEUE_PROTO_PATH);

    const proto = grpc.loadPackageDefinition(
      packageDef
    ) as unknown as QueueProtoGrpcType;

    return proto.queue.QueueService;
  },
  get FileService() {
    const packageDef = protoLoader.loadSync(FILE_PROTO_PATH);

    const proto = grpc.loadPackageDefinition(
      packageDef
    ) as unknown as FileProtoGrpcType;

    return proto.file.FileService;
  },
};
