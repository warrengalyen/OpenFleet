import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { tokenStorage } from '@/lib/api'
import type { LoginRequest } from '@/types'

const ME_QUERY_KEY = ['auth', 'me'] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.me,
    enabled: !!tokenStorage.get(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: LoginRequest) => authService.login(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    authService.logout()
    queryClient.clear()
    window.location.replace('/login')
  }
}

export function useIsAuthenticated(): boolean {
  const { data } = useCurrentUser()
  return !!data
}
