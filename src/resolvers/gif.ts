import { Resolvers } from '../generated/graphql'
import { Context } from '../context'
import { GraphQLError } from 'graphql'
import { finished } from 'stream/promises'
import { createWriteStream } from 'fs'
import path from 'path'
import fs from 'fs/promises'
import { Readable } from 'stream'
import { processJsonUpload } from '../utils/uploadGif'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'gifs')
fs.mkdir(UPLOAD_DIR, { recursive: true })
  .catch(error => console.error('Failed to create uploads directory:', error))

type GifResolvers = Resolvers<Context>

export const gifResolvers: GifResolvers = {
  Query: {
    gifs: async (_parent, _args, context) => {
      return await context.prisma.gif.findMany({
        include: {
          author: true
        }
      })
    },
    
    gif: async (_parent, { id }, context) => {
      const gif = await context.prisma.gif.findUnique({
        where: { id },
        include: {
          author: true
        }
      })
      
      if (!gif) {
        throw new GraphQLError('GIF not found')
      }
      
      return gif
    }
  },

  Mutation: {

    createGif: async (_parent, { name, file, authorId }, context) => {
      try {
        console.log('Starting createGif mutation:', { name, authorId })

        // Process and validate the JSON content
        const jsonContent = await processJsonUpload(file)
        console.log('JSON content processed successfully')

        // Create the GIF record with JSON content
        const gif = await context.prisma.gif.create({
          data: {
            name,
            content: jsonContent, // Store JSON directly in the database
            author: {
              connect: { id: authorId }
            }
          },
          include: {
            author: true
          }
        })

        console.log('GIF record created successfully:', gif.id)
        return gif

      } catch (error) {
        console.error('createGif error:', error)
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Failed to create GIF'
        )
      }
    },
    // createGif: async (_parent, { name, file, authorId }, context) => {
    //   try {
    //     console.log('Starting createGif mutation:', { name, authorId })

    //     // Process and validate the JSON file
    //     const { filePath, jsonContent } = await processJsonUpload(file)
    //     console.log('JSON file uploaded and validated:', filePath)

    //     // Create the GIF record
    //     const gif = await context.prisma.gif.create({
    //       data: {
    //         name,
    //         file: filePath,
    //         author: {
    //           connect: { id: authorId }
    //         }
    //       },
    //       include: {
    //         author: true
    //       }
    //     })

    //     console.log('GIF record created successfully:', gif.id)
    //     return gif

    //   } catch (error) {
    //     console.error('createGif error:', error)
    //     throw new GraphQLError(
    //       error instanceof GraphQLError ? error.message : 'Failed to create GIF'
    //     )
    //   }
    // },


    updateGif: async (_parent, { id, name, content }, context) => {
      const updateData: any = {}
      if (name) updateData.name = name
      if (content) updateData.content = content

      const gif = await context.prisma.gif.update({
        where: { id },
        data: updateData,
        include: {
          author: true
        }
      })
      
      if (!gif) {
        throw new GraphQLError('GIF not found')
      }
      
      return gif
    },

    deleteGif: async (_parent, { id }, context) => {
      try {
        const gif = await context.prisma.gif.delete({
          where: { id }
        })
        
        return {
          success: true,
          message: 'GIF deleted successfully'
        }
      } catch (error) {
        console.error('Failed to delete GIF:', error)
        return {
          success: false,
          message: 'Failed to delete GIF'
        }
      }
    }
  },

  Gif: {
    author: async (parent, _args, context) => {
      const author = await context.prisma.user.findUnique({
        where: { id: parent.authorId }
      });
      
      if (!author) {
        throw new GraphQLError('Author not found');
      }
      
      return author;
    }
  },

  User: {
    gifs: async (parent, _args, context) => {
      return await context.prisma.gif.findMany({
        where: { authorId: parent.id }
      });
    }
  }
};
