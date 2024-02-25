import { Channel, Connection, connect } from "amqplib";
import { RABBITMQ_URI } from "./config";

let conn: Connection;

export async function rabbitmq_client() {
  if (!conn) {
    try {
      conn = await connect(RABBITMQ_URI);
      console.log("Connected to rabbitmq");
    } catch (error) {
      console.log("ERROR WHILE CONNECTING RABBITMQ", error);
      process.exit(1);
    }
  }
  return conn;
}

enum RABBITMQ_QUEUES_ENUM {
  NEW_FILE_UPLOADED_QUEUE = "NEW_FILE_UPLOADED_QUEUE",
}

const rabbitmq_channels_state = new Map<RABBITMQ_QUEUES_ENUM, Channel>();

const channel_cacher = async (queue: RABBITMQ_QUEUES_ENUM) => {
  const cached = rabbitmq_channels_state.get(queue);
  if (cached) {
    return { queue, channel: cached };
  }

  const client = await rabbitmq_client();
  const channel = await client.createChannel();
  await channel.assertQueue(queue);
  rabbitmq_channels_state.set(queue, channel);
  return { queue, channel };
};

export const rabbitmq_channels = {
  new_file_uploaded_channel: () =>
    channel_cacher(RABBITMQ_QUEUES_ENUM.NEW_FILE_UPLOADED_QUEUE),
};
