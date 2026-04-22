#!/usr/bin/env node
import { runCli } from '../server/cli.js'

runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
})
