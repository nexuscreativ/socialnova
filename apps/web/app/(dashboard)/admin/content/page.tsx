import { redirect } from "next/navigation"

export default function AdminContentRedirect() {
  redirect("/settings/content")
}
