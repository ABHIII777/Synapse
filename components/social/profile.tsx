import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    MapPin,
    Calendar,
    Link as LinkIcon,
    Edit2,
    Camera,
    CheckCircle,
} from "lucide-react";
import { PostCard } from "./post-card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProfilePage({ username }: { username?: string }) {
    const [activeTab, setActiveTab] = useState<
        "posts" | "comments" | "reposts" | "bookmarks" | "likes"
    >("posts");
    const [tabContent, setTabContent] = useState<any>(null);

    const [user, setUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [isFollowing, setIsFollowing] = useState<boolean>(false);

    const router = useRouter();
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const isOwnProfile = !username || (currentUser && currentUser.name === username);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [])

    useEffect(() => {
        fetch("/api/user/me")
            .then((res) => res.json())
            .then((data) => setCurrentUser(data))
            .catch((err) => console.error(err))
    }, [])

    useEffect(() => {
        const url = username ? `/api/profile?username=${encodeURIComponent(username)}` : `/api/profile`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => setUser(data))
            .catch((err) => console.error(err))
    }, [username]);

    useEffect(() => {
        const url = username ? `/api/profile?tab=${activeTab}&username=${encodeURIComponent(username)}` : `/api/profile?tab=${activeTab}`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => setTabContent(data))
    }, [activeTab, username])

    useEffect(() => {
        if (!user || !currentUser || isOwnProfile) return;

        fetch(`/api/follow-following?followerId=${currentUser.id}&followingId=${user.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && typeof data.isFollowing === "boolean") {
                    setIsFollowing(data.isFollowing);
                }
            })
            .catch((err) => console.error("Error fetching follow status:", err));
    }, [user, currentUser, isOwnProfile]);

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-primary animate-pulse font-medium italic">
                    Loading Profile...
                </div>
            </div>
        );
    }

    const editPageNavigate = () => {
        router.push(`/edit-profile`);
    };

    const handleFollowingLogic = async () => {
        const nextState = !isFollowing;
        setIsFollowing(nextState)

        setUser((prev: any) => {
            if (!prev) return prev

            return{
                ...prev,
                followersCount: nextState ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0)) - 1
            }
        })

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const response = await fetch("/api/follow-following", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        followerId: currentUser.id,
                        followingId: user.id,
                        action: nextState ? "follow" : "unfollow"
                    }),
                })

                if (!response.ok) {
                    setIsFollowing(!nextState)

                    setUser((prev: any) => {
                        if (!prev) return prev

                        return {
                            ...prev,
                            followersCount: !nextState ? (prev.follwersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0) - 1)
                        }
                    })
                } else {
                    const resJson = await response.json();
                }
            } catch (err) {
                setIsFollowing(!nextState)

                setUser((prev: any) => {
                    if (!prev) return prev

                    return {
                        ...prev,
                        followersCount: !nextState ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0) - 1)
                    }
                })
            }
        }, 800)
    }


    return (
        <div className="min-h-screen bg-background text-foreground border-x border-border">
            {/* Cover / Banner */}
            <div
                className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-border"
                style={{
                    background: user?.banner ? `url("${user.banner}") center/cover no-repeat` : undefined
                }}
            >
                {
                    isOwnProfile && (
                        <button className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-primary border border-primary/20 transition hover:bg-black/70 backdrop-blur-sm">
                            <Camera className="h-4 w-4" />
                            Edit cover
                        </button>
                    )
                }
            </div>

            {/* Profile header */}
            <div className="mx-auto w-full max-w-none px-6 sm:px-10 lg:px-16">
                <div className="relative -mt-16 flex items-end justify-between">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-secondary border-4 border-background shadow-xl ring-2 ring-primary/20 overflow-hidden">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-16 w-16 text-muted-foreground" />
                        )}
                    </div>

                    {
                        !isOwnProfile && (
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="flex items-center gap-2 rounded-full border border-primary px-5 pt-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                                >
                                    <button
                                        className="mb-2"
                                        onClick={handleFollowingLogic}
                                    >
                                        {
                                            isFollowing ? "following" : "follow"
                                        }
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {
                        isOwnProfile && (
                            <div className="flex items-center gap-3 mb-2">
                                <button
                                    className="flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                                    onClick={editPageNavigate}
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit Profile
                                </button>
                                <ThemeToggle />
                            </div>
                        )
                    }
                </div>

                <div className="mt-4 space-y-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {user?.name}
                            </h1>
                            <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">@{user?.name}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground max-w-lg">
                        {user?.bio}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {user?.location || "Somewhere"}
                        </span>
                        <span className="flex items-center gap-1">
                            <LinkIcon className="h-4 w-4 text-primary" />
                            <span className="text-primary hover:underline cursor-pointer transition">
                                {user?.website || "example.com"}
                            </span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Joined April 2026
                        </span>
                    </div>
                    <div className="flex gap-6 mt-4 text-sm">
                        <button className="hover:underline transition">
                            <strong className="text-foreground">{user?.followingCount ?? 0}</strong>{" "}
                            <span className="text-muted-foreground">Following</span>
                        </button>
                        <button className="hover:underline transition">
                            <strong className="text-foreground">{user?.followerCount ?? 0}</strong>{" "}
                            <span className="text-muted-foreground">Followers</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 border-b border-border overflow-x-auto no-scrollbar">
                    <div className="flex min-w-max">
                        <TabButton
                            label="Posts"
                            active={activeTab === "posts"}
                            onClick={() => setActiveTab("posts")}
                        />
                        <TabButton
                            label="Likes"
                            active={activeTab === "likes"}
                            onClick={() => setActiveTab("likes")}
                        />
                        <TabButton
                            label="Comments"
                            active={activeTab === "comments"}
                            onClick={() => setActiveTab("comments")}
                        />
                        <TabButton
                            label="Reposts"
                            active={activeTab === "reposts"}
                            onClick={() => setActiveTab("reposts")}
                        />
                        <TabButton
                            label="Bookmarks"
                            active={activeTab === "bookmarks"}
                            onClick={() => setActiveTab("bookmarks")}
                        />
                    </div>
                </div>

                {activeTab === "posts" && (
                    <div className="mt-4 space-y-4 pb-12">
                        {user.posts && user.posts.length > 0 ? (
                            user.posts.map((postData: any) => (
                                <PostCard
                                    key={postData.id}
                                    post={{
                                        ...postData,
                                        author: {
                                            name: user.name,
                                            avatar: user.avatar,
                                            verified: true,
                                        },
                                    }}
                                    isProfileView={true}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                                No posts yet.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "likes" && (
                    <div className="mt-4 space-y-4 pb-12">
                        {tabContent.likes && tabContent.likes.length > 0 ? (
                            tabContent.likes.map((num: any) => (
                                <PostCard
                                    key={num.post.id}
                                    post={{
                                        ...num.post,
                                        author: {
                                            name: num.post.author.name,
                                        },
                                    }}
                                    isProfileView={true}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                                You haven't liked any post yet.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "reposts" && (
                    <div className="mt-4 space-y-4 pb-12">
                        {tabContent.reposts && tabContent.reposts.length > 0 ? (
                            tabContent.reposts.map((num: any) => (
                                <PostCard
                                    key={num.post.id}
                                    post={{
                                        ...num.post,
                                        author: {
                                            name: num.post.author.name,
                                        },
                                    }}
                                    isProfileView={true}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                                You haven't reposted any post yet.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "bookmarks" && (
                    <div className="mt-4 space-y-4 pb-12">
                        {tabContent.bookmarks && tabContent.bookmarks.length > 0 ? (
                            tabContent.bookmarks.map((num: any) => (
                                <PostCard
                                    key={num.post.id}
                                    post={{
                                        ...num.post,
                                        author: {
                                            name: num.post.author.name,
                                        },
                                    }}
                                    isProfileView={true}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                                You haven't bookmarked any post yet.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="mt-4 space-y-4 pb-12">
                        {tabContent.comments && tabContent.comments.length > 0 ? (
                            tabContent.comments.map((num: any) => (
                                <PostCard
                                    key={num.post.id}
                                    post={{
                                        ...num.post,
                                        author: {
                                            name: num.post.author.name,
                                        },
                                    }}
                                    isProfileView={true}
                                />
                            ))
                        ) : (
                            <div className="py-12 text-center text-muetd-foreground border border-dashed border-border reounded-2xl">
                                You haven't commented on any post yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({
    label,
    active = false,
    onClick,
}: {
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            className={`relative px-6 py-4 text-sm font-medium transition-colors hover:bg-secondary/50 ${active ? "text-primary font-bold" : "text-muted-foreground"
                }`}
            onClick={onClick}
        >
            {label}
            {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-primary shadow-[0_-2px_8px_rgba(var(--primary),0.3)]" />
            )}
        </button>
    );
}
