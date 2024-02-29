import { FILE_MS_URI } from "./config";
import { pb_services } from "./constant";
import * as grpc from "@grpc/grpc-js";

export const file_ms_client = new pb_services.FileService(
  FILE_MS_URI,
  grpc.credentials.createInsecure()
);
