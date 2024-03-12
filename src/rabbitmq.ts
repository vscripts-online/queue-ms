import { Channel, Connection, connect } from "amqplib";
import { RABBITMQ_URI } from "./config";
import { Queues, Queues__Output } from "../pb/queue/Queues";

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

const rabbitmq_channels_state = new Map<Queues__Output, Channel>();

const channel_cacher = async (queue: Queues__Output) => {
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
  file_part_upload_channel: () => channel_cacher(Queues.FILE_PART_UPLOAD),
  forgot_password_mail_channel: () => channel_cacher(Queues.SEND_FORGOT_PASSWORD_EMAIL)
};
