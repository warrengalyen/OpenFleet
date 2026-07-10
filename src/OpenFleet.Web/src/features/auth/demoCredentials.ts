/** Demo credentials shown on the login page. Admin is local-only; production shows Viewer. */
export function getDemoLoginCredentials(): {
  email: string
  password: string
  label: string
} {
  if (import.meta.env.PROD) {
    return {
      email: 'viewer@openfleet.io',
      password: 'Viewer@1234',
      label: 'Demo (read-only Viewer)',
    }
  }

  return {
    email: 'admin@openfleet.io',
    password: 'Admin@1234',
    label: 'Default',
  }
}
