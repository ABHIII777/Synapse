"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostCard } from "./post-card"
import {
  Search,
  Flame,
  Users,
  Newspaper,
  Verified,
  UserPlus,
  UserMinus,
  ArrowRight,
} from "lucide-react"

export interface TrendingItem {
  tag: string;
  category: string;
  posts: string;
  trend: string;
}

export interface Post {
  id: string
  author: {
    name: string
    username: string
    avatar: string
    verified?: boolean
  }
  content: string
  image?: string
  likes: number
  comments: number
  reposts: number
  reports: number
  timestamp: string
  isLiked?: boolean
  isBookmarked?: boolean
  isReposted?: boolean
  isReported?: boolean
}

const initialTrending: TrendingItem[] = [
  { tag: "#NextJS16", category: "Trending in Web Dev", posts: "14.5K", trend: "+24% this week" },
  { tag: "React 19", category: "Trending in JavaScript", posts: "12.2K", trend: "+18% today" },
  { tag: "Tailwind CSS v4", category: "Trending in CSS", posts: "9.8K", trend: "Hot topic" },
  { tag: "#DesignSystems", category: "Trending in UI/UX", posts: "8.4K", trend: "+12% this week" },
  { tag: "Drizzle ORM", category: "Trending in Database", posts: "6.1K", trend: "+32% this week" },
  { tag: "Supabase", category: "Trending in Backend", posts: "5.3K", trend: "Hot topic" },
]


export function ExploreComponent() {

  const [initialPosts, setInitialPosts] = useState<any[]>([])
  const [initialPeople, setInitialPeople] = useState<any[]>([])

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("trending")

  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [followedState, setFollowedState] = useState<Record<number, boolean>>({})

  const router = useRouter();

  useEffect(() => {
    fetch("/api/feed")
      .then(res => res.json())
      .then(data => {
        setInitialPosts(data)
      })
      .catch(err => console.error("Failed to fetch the data.", err))
  }, [])

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => setInitialPeople(data))
      .catch(err => console.error("Failed to fetch the data.", err))
  }, [])

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data))
      .catch((err) => console.error("Failed to fetch current user.", err))
  }, [])

  useEffect(() => {
    if (!currentUser || initialPeople.length === 0) return

    initialPeople.forEach((person) => {
      fetch(`/api/follow-following?followerId=${currentUser.id}&followingId=${person.id}`)
        .then((res) => res.json())
        .then(data => {
          if (data && typeof data.isFollowing === "boolean") {
            setFollowedState(prev => ({
              ...prev,
              [person.id]: data.isFollowing
            }))
          }
        })
        .catch(err => console.error("Error checking following status: ", err))
    })
  }, [currentUser, initialPeople])

  const handleFollowToggle = async (targetUserId: number) => {
    console.log("Follow Button Clicked")

    if (!currentUser) return; 

    console.log(currentUser.id, targetUserId)

    const nextState = !followedState[targetUserId];

    setFollowedState((prev) => ({
      ...prev,
      [targetUserId]: nextState,
    }));

    console.log(followedState)

    try {
      const response = await fetch("/api/follow-following", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          followerId: currentUser.id,
          followingId: targetUserId,
          action: nextState ? "follow" : "unfollow",
        }),
      });

      console.log(response)

      if (!response.ok) {
        setFollowedState((prev) => ({
          ...prev,
          [targetUserId]: !nextState,
        }));
      }
    } catch (err) {

      console.error("Follow action failed:", err);

      setFollowedState((prev) => ({
        ...prev,
        [targetUserId]: !nextState,
      }));
    }
  }

  const filteredTrending = initialTrending.filter(item =>
    item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPosts = initialPosts.filter(post =>
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPeople = initialPeople.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 w-full border-x border-border min-h-screen pb-12">
      {/* Search Header - Sticky & Glassmorphic */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search topics, posts, or creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 h-12 bg-muted/40 border-0 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-muted/80 transition-all text-sm w-full"
          />
        </div>
      </div>

      {/* Tabs Container */}
      <div className="px-6 mt-6">
        <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-11 p-0 bg-transparent rounded-none border-b border-border/50 gap-6">
            <TabsTrigger
              value="trending"
              className="px-0 pb-3 rounded-none bg-transparent font-bold text-sm h-full flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all relative group"
            >
              <Flame className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="px-0 pb-3 rounded-none bg-transparent font-bold text-sm h-full flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all relative group"
            >
              <Newspaper className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="px-0 pb-3 rounded-none bg-transparent font-bold text-sm h-full flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all relative group"
            >
              <Users className="h-4 w-4" />
              Creators
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab Content */}
          <TabsContent value="trending" className="mt-6 focus-visible:ring-0 focus-visible:ring-offset-0">
            <div className="space-y-2">
              {filteredTrending.map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/40 hover:border-border hover:bg-secondary/20 transition-all duration-200 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{item.category}</span>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {item.tag}
                    </h4>
                    <span className="text-xs text-muted-foreground block">{item.posts} Posts · <span className="text-emerald-500 font-medium">{item.trend}</span></span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/50 text-foreground hover:bg-primary hover:text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {filteredTrending.length === 0 && (
                <div className="text-center py-16 text-muted-foreground italic">No matching trending topics found.</div>
              )}
            </div>
          </TabsContent>

          {/* Posts Tab Content */}
          <TabsContent value="posts" className="mt-6 focus-visible:ring-0 focus-visible:ring-offset-0">
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} isProfileView={false} />
              ))}
              {filteredPosts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground italic">No matching posts found.</div>
              )}
            </div>
          </TabsContent>

          {/* People Tab Content */}
          <TabsContent value="people" className="mt-6 focus-visible:ring-0 focus-visible:ring-offset-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPeople.map((person) => {
                const isFollowed = followedState[person.id] || false;
                return (
                  <div
                    key={person.id}
                    className="p-5 rounded-2xl border border-border/40 bg-card hover:border-border hover:bg-secondary/10 transition-all duration-200 flex flex-col justify-between gap-4 group"
                    onClick={() => {
                      if (person.name) {
                        router.push(`/profile/${encodeURIComponent(person.name)}`)
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {person.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-foreground hover:underline cursor-pointer truncate">{person.name}</h4>
                          {person.verified && <Verified className="h-4 w-4 fill-primary text-primary-foreground shrink-0" />}
                        </div>
                        <span className="text-xs text-muted-foreground block">@{person.name.toLowerCase().replace(/\s+/g, '')}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">{person.followers} Followers</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">
                      {person.bio}
                    </p>

                    <Button
                      variant={isFollowed ? "secondary" : "default"}
                      onClick={() => handleFollowToggle(person.id)}
                      className="w-full rounded-xl text-xs font-bold h-9 transition-all flex items-center justify-center gap-1.5"
                    >
                      {isFollowed ? (
                        <>
                          <UserMinus className="h-3.5 w-3.5" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
              {filteredPeople.length === 0 && (
                <div className="col-span-2 text-center py-16 text-muted-foreground italic">No creators found matching your query.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
