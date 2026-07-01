"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share,
    Bookmark,
    MoreHorizontal,
    Verified,
    X,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { like } from "drizzle-orm"
import { bookmark, posts } from "@/db/schema"
import CommentBox from "./comment-box"
import { useRouter } from "next/navigation"

interface PostProps {
    post: {
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
    },
    isProfileView?: boolean
}

export function PostCard({ post, isProfileView }: PostProps) {
    const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);

    const [likes, setLikes] = useState(post.likes || 0);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);

    const [repost, setRepost] = useState(post.reposts || 0);
    const [isReposted, setIsReposted] = useState(post.reposts || false);

    const [report, setReport] = useState<any>(post.reports || 0);
    const [isReported, setIsReported] = useState(post.reports || false);
    const [reportContainer, setReportContainer] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitted, setReportSubmitted] = useState(false);

    const [comment, setComment] = useState<any[]>([]);
    const [showComment, setShowComment] = useState(false);
    const [commentContent, setCommentContent] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    const [userId, setUserId] = useState<any>(null);
    const [likeRes, setLikeRes] = useState<Boolean>();

    const maxLength = 200;
    const router = useRouter();

    const renderContentWithLinks = (content: string) => {
        if (!content) return "";
        const parts = content.split(/([#@]\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith("#")) {
                return (
                    <span
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/explore?search=${encodeURIComponent(part)}`);
                        }}
                        className="text-primary hover:underline cursor-pointer font-medium"
                    >
                        {part}
                    </span>
                );
            } else if (part.startsWith("@")) {
                const username = part.substring(1);
                return (
                    <span
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${encodeURIComponent(username)}`);
                        }}
                        className="text-primary hover:underline cursor-pointer font-medium"
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const handleLikes = async () => {
        if (!userId) return
        const newIsLiked = !isLiked;
        const newLikes = newIsLiked ? likes + 1 : Math.max(0, likes - 1);

        setIsLiked(newIsLiked);
        setLikes(newLikes);

        const data = await fetch("/api/post-card", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                postId: post.id,
                action: newIsLiked ? "like" : "unlike"
            })
        });

        const res = await data.json();
        if (res.updated === false) {
            setLikes(likes);
            setIsLiked(res.liked);
        }
    }

    const handleReposts = async () => {
        if (!userId) return

        const newIsReposted = !isReposted;
        const newReposts = newIsReposted ? (repost + 1) : Math.max(0, repost - 1)

        setIsReposted(newIsReposted)
        setRepost(newReposts)

        const data = await fetch("/api/post-card", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                postId: post.id,
                action: newIsReposted ? "repost" : "unrepost"
            })
        });

        const res = await data.json()

        if (res.updated === false) {
            setRepost(repost)
            setIsReposted(res.reposted)
        }
    }

    const handleBookmarks = async () => {
        if (!userId) return

        console.log(userId)

        const newIsBookmarked = !isBookmarked;
        setIsBookmarked(newIsBookmarked);

        const data = await fetch("/api/post-card", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                postId: post.id,
                action: newIsBookmarked ? "bookmarked" : "unbookmarked"
            })
        });

        const res = await data.json()

        if (res.updated === false) {
            setIsBookmarked(res.bookmarked)
        }

    }

    const handleComments = async () => {
        if (!userId) return
        if (!commentContent.trim()) return

        setLoadingComments(true);

        const res = await fetch("/api/comments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                postId: post.id,
                content: commentContent
            })
        })

        const newComment = await res.json();

        setComment((prev) => [newComment, ...prev])
        window.location.reload();
        setCommentContent("")
        setLoadingComments(false);
    }

    const handleProfileClick = () => {
        if (post.author.name) {
            router.push(`/profile/${encodeURIComponent(post.author.name)}`)
        }
    }

    useEffect(() => {
        fetch(`/api/comments?postId=${post.id}`)
            .then(res => res.json())
            .then(data => setComment(data));
    }, [post.id]);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await fetch("/api/user/me");
                if (res.ok) {
                    const data = await res.json()
                    setUserId(data.id)

                    const likeCheck = await fetch(`/api/post-card?userId=${data.id}&postId=${post.id}`);
                    if (likeCheck.ok) {
                        const likeData = await likeCheck.json();
                        setIsLiked(likeData.liked);
                        setIsReposted(likeData.reposted);
                        setIsBookmarked(likeData.bookmarked);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }

        fetchMe();
    }, [])

    const handleCloseReportModal = () => {
        setReportContainer(false);
        setReportReason("");
        setReportDetails("");
        setReportSubmitted(false);
    }

    const handleSubmitReport = async () => {

        const data = await fetch("/api/reports", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                postId: post.id,
                reason: reportReason
            })
        })

        const res = await data.json()

        console.log(res);

        setIsReported(true);
        setReport((prev: number) => prev + 1);
        setReportSubmitted(true);
    }

    return (
        <Card className="post-card-border bg-card hover:bg-secondary/20 transition-all duration-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="flex flex-row gap-3 p-4">
                {/* Avatar Column */}
                <div className="flex flex-col items-center">
                    <Avatar
                        className="h-11 w-11 transition-opacity hover:opacity-90 cursor-pointer"
                        onClick={handleProfileClick}
                    >
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {post.author.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>

                {/* Content Column */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                            <span
                                className="font-bold text-[15px] text-foreground hover:underline cursor-pointer truncate"
                                onClick={handleProfileClick}
                            >
                                {post.author.name}
                            </span>
                            {post.author.verified && (
                                <Verified className="h-[15px] w-[15px] fill-primary text-primary-foreground shrink-0" />
                            )}
                            <span
                                className="text-muted-foreground text-[14px] truncate"
                                onClick={handleProfileClick}
                            >
                                @{post.author.name.toLowerCase().replace(/\s+/g, '')}
                            </span>
                            <span className="text-muted-foreground text-[14px]">·</span>
                            <span className="text-muted-foreground text-[14px] hover:underline cursor-pointer">1h</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem className="gap-2">Not interested</DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">Follow @{post.author.name}</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive gap-2" onClick={() => setReportContainer(prev => !prev)}>Report post</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Text Content */}
                    <p className="text-[15px] text-foreground whitespace-pre-wrap leading-normal mb-3">
                        {renderContentWithLinks(post.content)}
                    </p>

                    {/* Media Placeholder */}
                    {post.image && (
                        <div className="mb-3 rounded-2xl overflow-hidden border border-border">
                            <img src={post.image} alt="post" className="w-full object-contain max-h-[512px]" />
                        </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between -ml-2 max-w-md">
                        {/* Like */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLikes}
                            className={cn(
                                "group flex items-center gap-2 rounded-full h-9 px-3 transition-all",
                                isLiked ? "text-rose-500 hover:bg-rose-500/10" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                            )}
                        >
                            <Heart className={cn("h-[18px] w-[18px] transition-all group-active:scale-125", isLiked && "fill-current")} />
                            <span className="text-xs font-medium">{likes}</span>
                        </Button>
                        {/* Comment */}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="group flex items-center gap-2 text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 rounded-full h-9 px-3 transition-all"
                            onClick={() => {
                                setShowComment(!showComment);

                            }}
                        >
                            <MessageCircle className="h-[18px] w-[18px] group-active:scale-90 transition-transform" />
                            <span className="text-xs font-medium">{post.comments}</span>
                        </Button>

                        {/* Repost */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReposts}
                            className={cn(
                                "group flex items-center gap-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full h-9 px-3 transition-all",
                                isReposted ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                            )}
                        >
                            <Repeat2 className="h-[18px] w-[18px] group-active:scale-90 transition-transform" />
                            <span className="text-xs font-medium">{repost}</span>
                        </Button>
                        {/* Bookmark & Share */}
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBookmarks}
                                className={cn(
                                    "group p-2 rounded-full transition-all h-9 w-9",
                                    isBookmarked ? "text-sky-500 hover:bg-sky-500/10" : "text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10"
                                )}
                            >
                                <Bookmark className={cn("h-[18px] w-[18px] transition-all group-active:scale-90", isBookmarked && "fill-current")} />
                            </Button>
                        </div>
                    </div>

                    {
                        showComment && (
                            <div className="mt-4 space-y-3">
                                {comment.map((comm) => (
                                    <CommentBox
                                        key={comm.id}
                                        comment={{
                                            ...comm
                                        }}
                                        isProfileView={isProfileView}
                                    />
                                ))}
                            </div>
                        )
                    }

                    {showComment && (
                        <div className="mt-3 border-t border-border/50 pt-3 flex flex-col items-end">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                className="w-full p-2.5 text-sm border border-border bg-background/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                maxLength={maxLength}
                            />
                            <Button
                                size="sm"
                                className="mt-2 h-8 px-4 rounded-full font-medium"
                                onClick={handleComments}
                            >Post</Button>
                        </div>
                    )}
                </div>
                {
                    reportContainer && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-2xl w-full max-w-md p-6 relative flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                                {reportSubmitted ? (
                                    <div className="flex flex-col items-center text-center py-6 gap-4">
                                        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-bold">Thank You</h2>
                                            <p className="text-sm text-muted-foreground">
                                                We've received your report. Your feedback helps keep Synapse safe.
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full mt-2 h-10 rounded-xl font-medium"
                                            onClick={handleCloseReportModal}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-bold leading-none">Report Post</h2>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Your report is anonymous. Help us understand what's wrong.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary"
                                                onClick={handleCloseReportModal}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Options */}
                                        <div className="flex flex-col gap-2 my-2">
                                            {["Spam", "Harassment", "Violence", "Misinformation", "Other"].map((reason) => {
                                                const isSelected = reportReason === reason;
                                                return (
                                                    <button
                                                        key={reason}
                                                        type="button"
                                                        onClick={() => setReportReason(reason)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left",
                                                            isSelected
                                                                ? "border-primary bg-primary/10 text-foreground"
                                                                : "border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <span>{reason}</span>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Notes Textarea */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">
                                                Additional details (Optional)
                                            </label>
                                            <textarea
                                                placeholder="Please provide any extra context..."
                                                value={reportDetails}
                                                onChange={(e) => setReportDetails(e.target.value)}
                                                className="w-full min-h-[80px] p-3 text-sm border border-border bg-background rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                                                maxLength={300}
                                            />
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                                            <Button
                                                variant="ghost"
                                                onClick={handleCloseReportModal}
                                                className="h-9 px-4 rounded-xl font-medium"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                disabled={!reportReason}
                                                onClick={handleSubmitReport}
                                                className="h-9 px-4 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                            >
                                                Submit Report
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                }
            </div>
        </Card >
    );
}
