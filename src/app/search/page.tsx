"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search as SearchIcon, FileText, Link as LinkIcon, StickyNote, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        handleSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  async function handleSearch() {
    setLoading(true)
    try {
      const response = await fetch(`/api/resources?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Search</h1>
        <p className="text-muted-foreground">
          Find anything across your entire research workspace.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Type to search resources, tags, or content..."
          className="pl-10 h-12 text-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {query && !loading && results.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No results found for "{query}"
          </p>
        ) : (
          results.map((resource) => {
            const Icon =
              resource.type === "FILE"
                ? FileText
                : resource.type === "URL"
                ? LinkIcon
                : StickyNote

            return (
              <Card key={resource.id} className="hover:bg-accent/50 transition-colors">
                <Link href={`/resources/${resource.id}`}>
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {resource.title}
                        </CardTitle>
                        <CardDescription className="truncate">
                          {resource.type} • {resource.source || "Unknown Source"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {resource.tags && resource.tags.length > 0 && (
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map((rt: any) => (
                          <Badge key={rt.tag.id} variant="outline" className="text-[10px] px-1 py-0">
                            #{rt.tag.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Link>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
