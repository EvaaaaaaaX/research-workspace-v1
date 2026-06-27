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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { FileUp, Link as LinkIcon, StickyNote, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const resourceSchema = z.object({
  type: z.enum(["FILE", "URL", "NOTE"]),
  title: z.string().min(1, "Title is required"),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  contentPreview: z.string().optional(),
  content: z.string().optional(),
  authors: z.string().optional(),
  source: z.string().optional(),
  file: z.any().optional(),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

export function ResourceForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Custom states for auto-generated metadata
  const [analyzing, setAnalyzing] = useState(false)
  const [tagsList, setTagsList] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState("")

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      type: "FILE",
      title: "",
      url: "",
      description: "",
      contentPreview: "",
      content: "",
      authors: "",
      source: "",
    },
  })

  const resourceType = form.watch("type")

  async function triggerAnalysis(fileToAnalyze?: File, urlToAnalyze?: string, contentToAnalyze?: string) {
    const type = form.getValues("type")
    
    if (type === "FILE" && !fileToAnalyze) return
    if (type === "URL" && !urlToAnalyze) return
    if (type === "NOTE" && !contentToAnalyze) return

    setAnalyzing(true)
    const toastId = toast.loading("Analyzing resource and generating metadata...")

    try {
      const formData = new FormData()
      formData.append("type", type)
      formData.append("title", form.getValues("title") || "")
      formData.append("description", form.getValues("description") || "")
      formData.append("authors", form.getValues("authors") || "")
      formData.append("source", form.getValues("source") || "")

      if (type === "FILE" && fileToAnalyze) {
        formData.append("file", fileToAnalyze)
      } else if (type === "URL" && urlToAnalyze) {
        formData.append("url", urlToAnalyze)
      } else if (type === "NOTE" && contentToAnalyze) {
        formData.append("content", contentToAnalyze)
      }

      const response = await fetch("/api/resources?analyze=true", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
      
      // Auto-fill fields
      if (data.title) form.setValue("title", data.title)
      if (data.description) form.setValue("description", data.description)
      if (data.contentPreview) form.setValue("contentPreview", data.contentPreview)
      if (data.authors) form.setValue("authors", data.authors)
      if (data.source) form.setValue("source", data.source)
      if (data.tags) setTagsList(data.tags)

      toast.success("Metadata and tags generated!", { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error("Failed to analyze content automatically.", { id: toastId })
    } finally {
      setAnalyzing(false)
    }
  }

  async function onSubmit(values: ResourceFormValues) {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value)
        }
      })

      if (resourceType === "FILE" && selectedFile) {
        formData.append("file", selectedFile)
      }

      // Append tags as JSON array string
      if (tagsList.length > 0) {
        formData.append("tags", JSON.stringify(tagsList))
      }

      const response = await fetch("/api/resources", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to create resource")
      }

      toast.success("Resource created successfully")
      router.push("/resources")
      router.refresh()
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
            <CardTitle>Resource Details</CardTitle>
            <CardDescription>
              Provide the details for your new research resource.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FILE">
                        <div className="flex items-center">
                          <FileUp className="mr-2 h-4 w-4" />
                          File
                        </div>
                      </SelectItem>
                      <SelectItem value="URL">
                        <div className="flex items-center">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          URL
                        </div>
                      </SelectItem>
                      <SelectItem value="NOTE">
                        <div className="flex items-center">
                          <StickyNote className="mr-2 h-4 w-4" />
                          Note
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {resourceType === "FILE" && (
              <FormField
                control={form.control}
                name="file"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        disabled={analyzing}
                        {...field}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedFile(file)
                            onChange(file)
                            if (!form.getValues("title")) {
                              form.setValue("title", file.name)
                            }
                            // Auto-analyze selected file
                            triggerAnalysis(file)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload PDF, DOCX, TXT or Markdown files.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {resourceType === "URL" && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            disabled={analyzing}
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              const val = e.target.value;
                              if (val && z.string().url().safeParse(val).success) {
                                triggerAnalysis(undefined, val);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the URL of the webpage or document.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={analyzing || !form.getValues("url")}
                  onClick={() => triggerAnalysis(undefined, form.getValues("url"))}
                  className="mb-6 flex gap-2 items-center"
                >
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            )}

            {resourceType === "NOTE" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your note here (Markdown supported)..."
                          className="min-h-[200px]"
                          disabled={analyzing}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={analyzing || !form.getValues("content")}
                  onClick={() => triggerAnalysis(undefined, undefined, form.getValues("content"))}
                  className="flex gap-2 items-center"
                >
                  {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {analyzing ? "Analyzing..." : "🪄 Auto-generate Summary & Tags"}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="authors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authors</FormLabel>
                    <FormControl>
                      <Input placeholder="Author names..." disabled={analyzing} {...field} />
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
                      <Input placeholder="Journal, Website, etc." disabled={analyzing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Summary (2-3 sentences)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief summary will be auto-generated or type here..." 
                      disabled={analyzing}
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentPreview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Preview (first 300 chars)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Automatic preview will display here..." 
                      disabled={analyzing}
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Editable Tags list */}
            <div className="space-y-3">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tags</label>
              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-muted/40">
                {tagsList.length === 0 ? (
                  <span className="text-sm text-muted-foreground self-center px-1">
                    No tags generated yet.
                  </span>
                ) : (
                  tagsList.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTagsList(tagsList.filter(t => t !== tag))}
                        className="text-muted-foreground hover:text-foreground rounded-full font-bold ml-0.5 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={newTagInput}
                  disabled={analyzing}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newTagInput.trim();
                      if (trimmed && !tagsList.includes(trimmed)) {
                        setTagsList([...tagsList, trimmed]);
                        setNewTagInput("");
                      }
                    }
                  }}
                  className="max-w-[200px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={analyzing}
                  onClick={() => {
                    const trimmed = newTagInput.trim();
                    if (trimmed && !tagsList.includes(trimmed)) {
                      setTagsList([...tagsList, trimmed]);
                      setNewTagInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 border-t px-6 py-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={loading || analyzing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || analyzing}>
              {loading ? "Creating..." : "Create Resource"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
