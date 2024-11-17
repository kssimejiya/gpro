import { Resolvers } from '../generated/graphql'
import { Context } from '../context'
import { userResolvers } from './user'
import { postResolvers } from './post'
import { gifResolvers } from './gif'

export const resolvers: Resolvers<Context> = {
  Query: {
    ...userResolvers.Query,
    ...postResolvers.Query,
    ...gifResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...gifResolvers.Mutation
  },
  User: userResolvers.User,
  Post: postResolvers.Post,
  Gif: gifResolvers.Gif
}