import * as fs from 'fs/promises'
import { encodeVideo } from './encodeVideo'
import { probeVideo } from './probeVideo'
import { cleanup, setupTempDir } from './util'
import { runVmaf } from './runVmaf'
import { extractFrameToImage } from './extractFrameToImage'

export interface VideoEncodingOptions {
  format: string
  codec: string
  bitrate: string
  resolution?: string
  fps?: number
  bStrategy?: number
  gopSize?: number
  keyintMin?: number
  scThreshold?: number
  refs?: number
  crf?: number
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow' | 'placebo'
}

if (process.argv.length !== 4) {
  console.error('Usage: node video-encoding-analyzer.js input_video encoding_options')
  process.exit(1)
}

async function main (): Promise<void> {
  await setupTempDir()

  const input = process.argv[2]
  let encodingOptions: VideoEncodingOptions

  const encodingArg = process.argv[3]
  if (encodingArg.includes('.json')) {
    const data = await fs.readFile(encodingArg, 'utf-8')
    encodingOptions = JSON.parse(data) as VideoEncodingOptions
  } else {
    encodingOptions = JSON.parse(encodingArg) as VideoEncodingOptions
  }

  const output = await encodeVideo(input, encodingOptions)
  const outputProbe = await probeVideo(output)
  const vmafResult = await runVmaf(input, output)
  const bitrateKb: string = `${(outputProbe.format.bit_rate ?? 0) / 1000}K`
  const lowestRatedFrameImgPath = await extractFrameToImage(input, vmafResult.lowestRatedFrame.frameNum)
  await fs.writeFile('out.json', JSON.stringify({
    bitrateKb,
    vmafResult: {
      ...vmafResult,
      lowestRatedFrame: {
        ...vmafResult.lowestRatedFrame,
        imgPath: lowestRatedFrameImgPath
      }
    }
  }))
  console.log('Analysis complete.')

  await cleanup()
}

void main()
