import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

/**
 * Bridges Zod schemas to react-hook-form when input/output types differ
 * (e.g. z.coerce.number(), z.preprocess). Form values use the schema output type.
 */
export function zodFormResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  // Zod 4 coerce/preprocess makes input ≠ output; cast through unknown for RHF.
  return zodResolver(schema as never) as Resolver<T>
}
