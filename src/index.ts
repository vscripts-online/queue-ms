import { config } from "dotenv";
config();

import * as grpc from "@grpc/grpc-js";
import { PORT } from "./config";
import { pb_services } from "./constant";
import { queue_contoller } from "./controller";
import { rabbitmq_client } from "./rabbitmq";

async function main() {
  await rabbitmq_client();

  const server = new grpc.Server();
  server.addService(pb_services.QueueService.service, queue_contoller);

  server.bindAsync(
    "0.0.0.0:" + PORT,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.log(err)
        process.exit(1);
      }

      console.log("listening on port:", port);
    }
  );
}

main();
