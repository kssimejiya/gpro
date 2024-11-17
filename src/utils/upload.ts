import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'
import { FileUpload } from 'graphql-upload-minimal'
import { GraphQLError } from 'graphql'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Define the actual structure we receive
interface UploadedFile {
  fieldName: string
  filename: string
  mimetype: string
  encoding: string
  createReadStream: () => NodeJS.ReadableStream
}

interface Upload {
  promise: Promise<UploadedFile>
  file: UploadedFile
}

export const processUpload = async (upload: Promise<FileUpload | Upload>): Promise<string> => {
  try {
    // Create uploads directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Wait for the upload promise to resolve
    const uploadObject = await upload

    // Get file details, handling both potential structures
    const fileDetails = 'file' in uploadObject ? uploadObject.file : uploadObject
    const { filename, mimetype, createReadStream } = fileDetails

    console.log('Upload details:', {
      hasCreateReadStream: !!createReadStream,
      filename,
      mimetype,
    })

    // Validate upload
    if (!createReadStream || !filename) {
      throw new GraphQLError('Invalid upload provided - missing required fields')
    }

    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${filename}`
    const filePath = path.join(UPLOAD_DIR, uniqueFilename)

    console.log('Starting file write to:', filePath)

    return new Promise((resolve, reject) => {
      const stream = createReadStream()
      const writeStream = createWriteStream(filePath)

      // Add error handlers for both streams
      stream.on('error', (error: Error) => {
        console.error('Read stream error:', error)
        reject(new GraphQLError(`File upload stream failed: ${error.message}`))
      })

      writeStream.on('error', (error: Error) => {
        console.error('Write stream error:', error)
        reject(new GraphQLError(`File write failed: ${error.message}`))
      })

      writeStream.on('finish', () => {
        console.log('File write completed:', uniqueFilename)
        resolve(`/uploads/${uniqueFilename}`)
      })

      // Pipe the file data
      stream.pipe(writeStream)
    })
  } catch (error) {
    console.error('Upload processing error:', error)
    throw new GraphQLError(
      error instanceof Error ? error.message : 'File upload failed'
    )
  }
}