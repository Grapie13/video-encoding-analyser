import { promises as fs } from 'fs'

export async function setupTempDir (): Promise<void> {
  try {
    const dirStat = await fs.stat('temp')

    if (dirStat.isDirectory() || dirStat.isFile()) {
      await fs.rm('temp', { recursive: true, force: true })
    }
  } catch (_) {}

  await fs.mkdir('temp')
}

export async function cleanup (): Promise<void> {
  try {
    const dirStat = await fs.stat('temp')

    if (dirStat.isDirectory() || dirStat.isFile()) {
      await fs.rm('temp', { recursive: true, force: true })
    }
  } catch (_) {}
}
