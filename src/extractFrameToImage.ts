import Ffmpeg from 'fluent-ffmpeg'
import path from 'path'

export async function extractFrameToImage (input: string, frame: number): Promise<string> {
  return await new Promise((resolve, reject) => {
    const output = `${input.split('.').slice(0, -1).join('.')}-frame-${frame}.png`
    const ffmpeg = Ffmpeg()
      .input(input)
      .videoFilter([
        `select=eq(n\\,${frame})`
      ])
      .frames(1)
      .output(output)

    ffmpeg.on('error', reject)
    ffmpeg.on('end', () => { resolve(path.resolve('.', output)) })
    ffmpeg.run()
  })
}
