import { notFound } from "next/navigation"
import { fetchPublicPage } from "@/lib/site-content"
import { CmsPage } from "@/components/marketing/cms-page"

export default async function CmsSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const path = slug.join("/")

  let data
  try {
    data = await fetchPublicPage(path)
  } catch (err) {
    console.error("[cms] fetchPublicPage failed for", path, err)
    data = null
  }

  if (!data) {
    notFound()
  }

  return <CmsPage page={data} />
}