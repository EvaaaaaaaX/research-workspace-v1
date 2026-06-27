"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

interface EditResourceFormProps {
  resource: {
    id: string
    type: string
    title: string
    authors: string | null
    source: string | null
    url: string | null
    description: string | null
    note?: { body: string | null } | null
  }
}

export function EditResourceForm({ resource }: EditResourceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource.title,
      authors: resource.authors || "",
      source: resource.source || "",
      url: resource.url || "",
      description: resource.description || "",
      content: resource.note?.body || "",
    },
  })

  async function onSubmit(values: ResourceFormValues) {
    setLoading(true)
    try {
      const response = await fetch(`/api/resources?id=${resource.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          type: resource.type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update resource")
      }

      toast.success("Resource updated successfully")
      // 先刷新，然后延迟跳转回详情页
      router.refresh()
      setTimeout(() => {
        router.push(`/resources/${resource.id}`)
      }, 300)
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Resource</CardTitle>
            <CardDescription>
              Update the details for your resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="authors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authors</FormLabel>
                    <FormControl>
                      <Input placeholder="Author names..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Journal, Website, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {resource.type === "URL" && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief summary..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {resource.type === "NOTE" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Note content..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-4 border-t px-6 py-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(`/resources/${resource.id}`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
