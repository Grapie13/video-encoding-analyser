import type { FfprobeData } from 'fluent-ffmpeg'
import { ffprobe } from 'fluent-ffmpeg'

export async function probeVideo (input: string): Promise<FfprobeData> {
  return await new Promise((resolve, reject) => {
    ffprobe(input, (err, data) => {
      if (err instanceof Error) {
        reject(err)
        return
      }

      resolve(data)
    })
  })
}
