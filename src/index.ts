import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import express from 'express'
import { graphqlUploadExpress } from 'graphql-upload-minimal'
import cors from 'cors'
import { resolvers } from './resolvers'
import { prisma } from './context'
import { readFileSync } from 'fs'
import path from 'path'

const typeDefs = readFileSync(
  path.join(__dirname, 'schema.graphql'),
  'utf8'
)

async function startServer() {
  const app = express()

  // Basic middleware
  app.use(cors({
    origin: '*',
    credentials: true
  }))

  // Important: File upload middleware must come BEFORE Apollo middleware
  app.use(
    graphqlUploadExpress({
      maxFieldSize: 50000000, // 50 MB
      maxFiles: 1
    })
  )

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false,
    cache: 'bounded',
    formatError: (error) => {
      console.error('GraphQL Error:', error)
      return error
    }
  })

  await server.start()

  // Serve static files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

  // GraphQL endpoint - Important: add express.json() middleware
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async () => ({
        prisma
      })
    })
  )

  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => {
    console.log(`
🚀 Server ready at http://localhost:${PORT}/graphql
📁 Uploads available at http://localhost:${PORT}/uploads
    `)
  })
}

startServer().catch(console.error)