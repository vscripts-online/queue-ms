import { QueueServiceHandlers } from "@pb/queue/QueueService";
import { GrpcResponserService } from "./type";
import { rabbitmq_channels } from "./rabbitmq";

export const queue_service: GrpcResponserService<QueueServiceHandlers> = {
  NewFileUploaded: async (data) => {
    const { queue, channel } =
      await rabbitmq_channels.new_file_uploaded_channel();

    const queue_data = Buffer.from(JSON.stringify(data));
    const res = channel.sendToQueue(queue, queue_data);
    return { value: res };
  },
};
