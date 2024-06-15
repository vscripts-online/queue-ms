import { FilePart__Output } from "@pb/file/FilePart";
import { GetFilesRequestDTO__Output } from "@pb/file/GetFilesRequestDTO";
import { GetFilesResponse__Output } from "@pb/file/GetFilesResponse";
import { FilePartUpload__Output } from "@pb/queue/FilePartUpload";
import { QueueServiceHandlers } from "@pb/queue/QueueService";
import bytes from "bytes";
import protobufjs from "protobufjs";
import { FILE_PROTO_PATH, QUEUE_PROTO_PATH } from "./constant";
import { file_ms_client } from "./microservices";
import { rabbitmq_channels } from "./rabbitmq";
import { GrpcResponserService } from "./type";
import { File__Output } from "@pb/file/File";

const queue_root = protobufjs.loadSync(QUEUE_PROTO_PATH);
const FilePartUpload = queue_root.lookupType("queue.FilePartUpload");

const file_root = protobufjs.loadSync(FILE_PROTO_PATH);
const FilePart = file_root.lookupType("file.FilePart");

async function SyncUnUploadedFiles() {
  console.log('Syncing un uploaded files')

  const files = await getFiles({
    where: {
      parts_length: "0",
      created_at_lte: new Date(Date.now() - 60000 * 5).toISOString()
    }
  })


  for (const file of files) {
    queue_service.NewFileUploaded({ value: file._id })
  }
}

// SyncUnUploadedFiles()
// setInterval(SyncUnUploadedFiles, 60000 * 5) // 5 min

async function getFiles(args: GetFilesRequestDTO__Output) {
  const { files } = await new Promise<GetFilesResponse__Output>((resolve, reject) => {
    file_ms_client.GetFiles(args, (err, value) => {
      if (value) {
        resolve(value)
      }

      reject(err || value)
    })
  })

  return files
}

export const queue_service: GrpcResponserService<QueueServiceHandlers> = {
  NewFileUploaded: async (data) => {
    const { queue, channel } =
      await rabbitmq_channels.file_part_upload_channel();

    const files = await getFiles({
      where: { _id: data.value },
      limit: { limit: 1 },
    })

    const file = files[0]

    const seperate_byte = bytes("100mb") - 1;
    const length = Math.ceil(parseInt(file.size) / seperate_byte);
    let offset = 0;
    for (let i = 0; i < length; i++) {
      const payload: FilePartUpload__Output = {
        _id: file._id,
        offset: offset + "",
        size: Math.min(seperate_byte, parseInt(file.size) - offset) + "",
        name: file.name,
      };

      if (i === length - 1)
        payload.last = true

      const message = FilePartUpload.fromObject(payload);
      const buffer = FilePartUpload.encode(message).finish() as Buffer;

      console.log("sended to", queue, buffer.length);
      channel.sendToQueue(queue, buffer);
      offset += seperate_byte + 1;
    }

    return { value: true };
  },
  DeleteFile: async (data) => {
    const { queue, channel } = await rabbitmq_channels.delete_file_channel();

    const file = await new Promise<File__Output>((resolve, reject) => {
      file_ms_client.DeleteFile({ _id: data.value }, (err, value) => {
        if (value) {
          resolve(value)
        }

        reject(err || value)
      })
    })

    for (const part of file.parts || []) {
      const payload: FilePart__Output = {
        id: part.id,
        name: part.name,
        offset: part.offset,
        owner: part.owner,
        size: part.size,
      };

      const message = FilePart.fromObject(payload);
      const buffer = FilePart.encode(message).finish() as Buffer;

      console.log("sended to", queue, buffer.length);
      channel.sendToQueue(queue, buffer);
    }

    return { value: true };
  },
};
