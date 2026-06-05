export const ADMIN_UIDS = [
  "jVy9P9PaBMhZNCiOU89BoclQmqf1",
]

export const ADMIN_EMAILS = [
  "sandrogogitidze316@gmail.com",
  "sabagiorgadze18@gmail.com",
]

export const ALLOWED_UIDS = [
  "jVy9P9PaBMhZNCiOU89BoclQmqf1",
  "Z7spj3PqYzV9Bvh75wLQ3HSDKEU2",
]

export const isUserAdmin = (uid: string, email: string | null): boolean => {
  if (ADMIN_UIDS.includes(uid)) return true
  if (email && ADMIN_EMAILS.includes(email)) return true
  return false
}
