import { Resolvers } from '../generated/graphql'
import { Context } from '../context'

export type ResolverContext = Context
export type AppResolvers = Resolvers<ResolverContext>