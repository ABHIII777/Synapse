import { db } from "@/db";
import { likes, users, posts, comments, follows } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tabParams = searchParams.get("tab");
    const usernameParams = searchParams.get("username");

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "No Token Found" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let userID = Number(decoded.userId);

    if (usernameParams) {
        const targetUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.name, usernameParams)
        })

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        userID = targetUser.id;

    };

    const validTabs = [
        "posts",
        "likes",
        "comments",
        "bookmarks",
        "reposts",
    ] as const;
    const tabs = validTabs.includes(tabParams as any) ? tabParams : "posts";

    let data;

    switch (tabs) {
        case "posts":
            data = await db.query.users.findFirst({
                where: (users, { eq, and }) => eq(users.id, userID),
                with: {
                    posts: true,
                },
            });
            break;

        case "likes":
            data = await db.query.users.findFirst({
                where: (users, { eq, and }) => eq(users.id, userID),
                with: {
                    likes: {
                        with: {
                            post: {
                                with: {
                                    author: true,
                                },
                            },
                        },
                    },
                },
            });
            break;

        case "reposts":
            data = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, userID),
                with: {
                    reposts: {
                        with: {
                            post: {
                                with: {
                                    author: true,
                                },
                            },
                        },
                    },
                },
            });
            break;

        case "bookmarks":
            data = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, userID),
                with: {
                    bookmarks: {
                        with: {
                            post: {
                                with: {
                                    author: true,
                                },
                            },
                        },
                    },
                },
            });
            break;

        case "comments":
            data = await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, userID),
                with: {
                    comments: {
                        with: {
                            post: {
                                with: {
                                    author: true,
                                },
                            },
                        },
                    },
                },
            });
            break;
    }

    const followersCountResult = await db.select({
        count: sql<number>`count(*)`
    }).from(follows).where(eq(follows.followingID, userID))

    const followingCountResult = await db.select({
        count: sql<number>`count(*)`
    }).from(follows).where(eq(follows.followerID, userID))

    return NextResponse.json({
        ...data,
        followingCount: Number(followingCountResult[0]?.count || 0),
        followerCount: Number(followersCountResult[0]?.count || 0)
    });
}

export async function PUT(req: Request) {
    const body = await req.json();

    const { name, bio, location, website, avatar, banner } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "No Token Found" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userID = Number(decoded.userId);

    try {
        await db
            .update(users)
            .set({
                name: name,
                bio: bio,
                location: location,
                website: website,
                avatar: avatar,
                banner: banner,
            })
            .where(eq(users.id, userID));

        revalidatePath("/", "layout");
        return NextResponse.json({ message: "Profile Updated" }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: err }, { status: 500 });
    }
}

