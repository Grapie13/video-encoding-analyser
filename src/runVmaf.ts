import fs from 'fs'
import Ffmpeg from 'fluent-ffmpeg'
import { probeVideo } from './probeVideo'

interface Frame {
  frameNum: number
  metrics: {
    vmaf: number
  }
}

interface VmafOutput {
  frames: Frame[]
  pooled_metrics: {
    vmaf: {
      min: number
      max: number
      mean: number
      harmonic_mean: number
    }
  }
}

interface VmafResult {
  score: {
    min: number
    max: number
    mean: number
  }
  lowestRatedFrame: Frame
}

export async function runVmaf (original: string, derivative: string): Promise<VmafResult> {
  const originalProbe = await probeVideo(original)
  let originalSize: { height: number, width: number }
  let originalFps: number

  originalProbe.streams
    .filter(stream => stream.codec_type === 'video')
    .forEach(stream => {
      if (stream.height === undefined || stream.width === undefined || stream.avg_frame_rate === undefined) {
        return
      }

      originalSize = {
        height: stream.height,
        width: stream.width
      }
      originalFps = parseInt(stream.avg_frame_rate.split('/')[0]) / parseInt(stream.avg_frame_rate.split('/')[1])
    })

  return await new Promise((resolve, reject) => {
    const logPath = `${derivative.split('.').slice(0, -1).join('.')}.json`

    const ffmpeg = Ffmpeg()
      .addInput(original)
      .inputFps(originalFps)
      .addInput(derivative)
      .inputFps(originalFps)
      .complexFilter([
        {
          filter: 'setpts',
          inputs: ['0:v'],
          options: [
            'PTS-STARTPTS'
          ],
          outputs: ['ref']
        },
        {
          filter: 'setpts',
          inputs: ['1:v'],
          options: [
            'PTS-STARTPTS'
          ],
          outputs: ['distorted']
        },
        {
          filter: 'scale',
          inputs: ['distorted'],
          options: [
            originalSize.width,
            originalSize.height,
            'flags=bicubic'
          ],
          outputs: ['scaled']
        },
        {
          filter: 'libvmaf',
          inputs: ['ref', 'scaled'],
          options: [
            'log_fmt=json',
            `log_path=${logPath}`,
            `model=path=${process.env.VMAF_MODEL}`
          ]
        }
      ])
      .format('null')
      .addOutput('-')

    ffmpeg.on('start', console.log)
    ffmpeg.on('progress', progress => {
      console.log(`Running VMAF: ${progress.percent.toFixed(2)}%`)
    })
    ffmpeg.on('error', reject)
    ffmpeg.on('end', () => {
      const vmafJson = fs.readFileSync(logPath, 'utf-8')
      const vmafData = JSON.parse(vmafJson) as VmafOutput
      const result: VmafResult = {
        score: {
          min: vmafData.pooled_metrics.vmaf.min,
          max: vmafData.pooled_metrics.vmaf.max,
          mean: vmafData.pooled_metrics.vmaf.mean
        },
        lowestRatedFrame: vmafData.frames.reduce((lowest, frame) => {
          if (frame.metrics.vmaf < lowest.metrics.vmaf) {
            return {
              frameNum: frame.frameNum,
              metrics: {
                vmaf: frame.metrics.vmaf
              }
            }
          }

          return lowest
        }, { frameNum: -1, metrics: { vmaf: 999 } })
      }

      resolve(result)
    })
    ffmpeg.run()
  })
}
