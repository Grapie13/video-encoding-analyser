import type { VideoEncodingOptions } from './main'
import Ffmpeg from 'fluent-ffmpeg'
import crypto from 'crypto'

export async function encodeVideo (input: string, options: VideoEncodingOptions): Promise<string> {
  return await new Promise((resolve, reject) => {
    const outputName = crypto.randomBytes(4).toString('hex')
    const format = options.format ?? 'mp4'
    const output = `temp/${outputName}.${format}`
    const ffmpeg = Ffmpeg()
      .input(input)
      .videoCodec(options.codec)
      .videoBitrate(options.bitrate)
      .output(output)

    if (typeof options.resolution === 'string') {
      ffmpeg.setSize(options.resolution)
    }

    if (typeof options.fps === 'number') {
      ffmpeg.fps(options.fps)
    }

    if (typeof options.bStrategy === 'number') {
      ffmpeg.addOption('-b_strategy', options.bStrategy.toString())
    }

    if (typeof options.gopSize === 'number') {
      ffmpeg.addOption('-g', options.gopSize.toString())
    }

    if (typeof options.keyintMin === 'number') {
      ffmpeg.addOption('-keyint_min', options.keyintMin.toString())
    }

    if (typeof options.scThreshold === 'number') {
      ffmpeg.addOption('-sc_threshold', options.scThreshold.toString())
    }

    if (typeof options.refs === 'number') {
      ffmpeg.addOption('-refs', options.refs.toString())
    }

    if (typeof options.crf === 'number') {
      ffmpeg.addOption('-crf', options.crf.toString())
    }

    if (typeof options.preset === 'string') {
      ffmpeg.addOption('-preset', options.preset)
    }

    ffmpeg.on('start', console.log)
    ffmpeg.on('progress', (progress: { percent: number }) => {
      console.log(`Encoding to ${output}: ${isNaN(progress.percent) ? 0 : progress.percent.toFixed(2)}%`)
    })
    ffmpeg.on('error', reject)
    ffmpeg.on('end', () => {
      resolve(output)
    })
    ffmpeg.run()
  })
}
