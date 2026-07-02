import { id } from "date-fns/locale";
import { Trash2, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CommentProps {
    comment: {
        id: string,
        content: string,
        userId: string,
        postId: string,
        created_at?: string,
        user: {
            id: string,
            name: string,
            avatar?: string
        }
    },
    isProfileView?: boolean
}

export default function CommentBox({ comment, isProfileView }: CommentProps) {

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState<number>(0)
    const [currentMe, setCurrentMe] = useState<any>(null)
    const [replies, setReplies] = useState<any[]>([])
    const [showReplyInput, setShowReplyInput] = useState(false)
    const [replyContent, setReplyContent] = useState("")
    const [showRepliesList, setShowRepliesList] = useState(false)

    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedReplies = localStorage.getItem(`commentReplies_${comment.id}`);
            if (savedReplies) {
                try {
                    setReplies(JSON.parse(savedReplies));
                } catch (e) {
                    console.error("Failed to parse saved replies", e);
                }
            }

            const savedLiked = localStorage.getItem(`commentIsLiked_${comment.id}`);
            const savedCount = localStorage.getItem(`commentLikesCount_${comment.id}`);
            setIsLiked(savedLiked === "true");
            setLikesCount(savedCount ? parseInt(savedCount, 10) : 0);
        }
    }, [comment.id]);

    useEffect(() => {
        fetch("/api/user/me")
            .then(res => {
                if(res.ok) return res.json()
                return
            })
            .then(data => {
                if (data) setCurrentMe(data)
            })
            .catch(err => console.error(err))
    }, []);

    const handleLikeToggle = () => {
        const nextLiked = !isLiked;
        const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
        setIsLiked(nextLiked);
        setLikesCount(nextCount);

        if (typeof window !== "undefined") {
            localStorage.setItem(`commentIsLiked_${comment.id}`, String(nextLiked));
            localStorage.setItem(`commentLikesCount_${comment.id}`, String(nextCount));
        }
    }

    const handleAddReply = () => {
        if (!replyContent.trim()) return

        const newReply =  {
            id: Date.now().toString(),
            user: {
                name: currentMe?.name || "You",
                avatar: currentMe?.avatar || ""
            },
            content: replyContent,
            created_at: new Date().toISOString()
        };

        const updatedReplies = [...replies, newReply];
        setReplies(updatedReplies);
        if (typeof window !== "undefined") {
            localStorage.setItem(`commentReplies_${comment.id}`, JSON.stringify(updatedReplies));
        }
        setReplyContent("")
        setShowReplyInput(false)
        setShowRepliesList(true)
    }

    const handleProfileClick = () => {
        if (comment.user.name) {
            router.push(`/profile/${encodeURIComponent(comment.user.name)}`)
        }
    }

    const formatCommentTime = (dateString?: string) => {
        if (!dateString) return "1d";

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`
        if (diffHours < 24) return `${diffHours}hr`

        return `${diffDays}d`;
    }

    const handleDelete = async () => {
        try {
            const data = await fetch("/api/comments", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: comment.id })
            });

            if (data.ok) {
                window.location.reload();
            } else {
                const res = await data.json()
                console.error("Failed to delete the comment: ", res)
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <div className="comment-box-border flex flex-col py-2.5 group w-full">
            <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Clickable Avatar to Profile */}
                    <Avatar 
                        className="h-8 w-8 shrink-0 border border-border/50 cursor-pointer"
                        onClick={handleProfileClick}
                    >
                        <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold flex items-center justify-center h-full w-full">
                            {comment.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 text-sm">
                        <p className="leading-normal">
                            {/* Clickable Username to Profile */}
                            <span 
                                className="font-semibold text-foreground mr-1.5 hover:underline cursor-pointer"
                                onClick={handleProfileClick}
                            >
                                {comment.user.name}
                            </span>
                            <span className="text-foreground/90 whitespace-pre-wrap">{comment.content}</span>
                        </p>

                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground select-none">
                            <span>
                                {formatCommentTime(comment.created_at)}
                            </span>
                            {/* Toggle Reply Input */}
                            <button 
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="hover:text-foreground font-semibold transition-colors"
                            >
                                Reply
                            </button>
                            {replies.length > 0 && (
                                <button
                                    onClick={() => setShowRepliesList(!showRepliesList)}
                                    className="hover:text-foreground font-semibold transition-colors"
                                >
                                    {showRepliesList ? "Hide Replies" : `View Replies (${replies.length})`}
                                </button>
                            )}
                            {
                                isProfileView && (
                                    <button
                                        onClick={handleDelete}
                                        className="opacity-0 group-hover:opacity-100 hover:text-destructive flex items-center gap-1 transition-all duration-200"
                                    >
                                        <Trash2 className="h-3 w-3">Delete</Trash2>
                                    </button>
                                )
                            }
                        </div>
                    </div>
                </div>

                {/* Heart Button and Likes Count */}
                <div className="flex flex-col items-center shrink-0">
                    <button
                        onClick={handleLikeToggle}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5"
                    >
                        <Heart className={
                            `h-3.5 w-3.5 transition-transform duration-200 active:scale-125 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`
                        }></Heart>
                    </button>
                    {likesCount > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-[-2px]">{likesCount}</span>
                    )}
                </div>
            </div>

            {/* Reply Input Box */}
            {showReplyInput && (
                <div className="mt-2.5 pl-11 flex items-center gap-2 w-full">
                    <input
                        type="text"
                        placeholder={`Reply to @${comment.user.name}...`}
                        className="flex-1 p-2 text-xs border border-border bg-background/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddReply();
                        }}
                    />
                    <button
                        onClick={handleAddReply}
                        className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        Reply
                    </button>
                    <button
                        onClick={() => {
                            setShowReplyInput(false);
                            setReplyContent("");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground px-1 py-2 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Nested Replies Rendering */}
            {showRepliesList && replies.length > 0 && (
                <div className="mt-3 pl-11 space-y-2.5">
                    {replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2.5 text-xs py-1">
                            <Avatar 
                                className="h-6 w-6 shrink-0 border border-border/50 cursor-pointer"
                                onClick={() => router.push(`/profile/${encodeURIComponent(reply.user.name)}`)}
                            >
                                <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center h-full w-full">
                                    {reply.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="leading-normal">
                                    <span 
                                        className="font-semibold text-foreground mr-1.5 hover:underline cursor-pointer"
                                        onClick={() => router.push(`/profile/${encodeURIComponent(reply.user.name)}`)}
                                    >
                                        {reply.user.name}
                                    </span>
                                    <span className="text-foreground/90 whitespace-pre-wrap">{reply.content}</span>
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                    {formatCommentTime(reply.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}