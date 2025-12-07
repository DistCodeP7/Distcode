import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NeonLines from "@/components/custom/NeonLine";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { job_results, problems, ratings, users } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { and, asc, eq } from "drizzle-orm";
import { Calendar, Code2, Terminal, Trophy } from "lucide-react";
import { getServerSession } from "next-auth";
import { SubmissionCard } from "./SubmissionCard";

const formatDate = (date: Date | null) => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

const getProfileInfo = async (userId: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.userid, userId))
    .limit(1);

  const u = user[0];

  const submissions = await db
    .select({
      problem: problems,
      rating: ratings,
      results: job_results,
    })
    .from(problems)
    .leftJoin(
      ratings,
      and(eq(ratings.problemId, problems.id), eq(ratings.userId, userId))
    )
    .leftJoin(
      job_results,
      and(
        eq(job_results.problemId, problems.id),
        eq(job_results.userId, userId)
      )
    )
    .where(eq(problems.userId, userId))
    .orderBy(asc(job_results.finishedAt));
  return { user: u, submissions };
};

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Please log in to view your profile.
      </div>
    );
  }

  const { user: u, submissions } = await getProfileInfo(session.user.id);

  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(
    (s) => s.results?.outcome === "SUCCESS"
  ).length;
  const successRate = totalSubmissions
    ? Math.round((successfulSubmissions / totalSubmissions) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 space-y-8 animate-in fade-in duration-500">
      {/* 1. Header Section */}
      <NeonLines />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-25 h-25">
            <Avatar className="w-25 h-25">
              {session?.user?.image ? (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name ?? "avatar"}
                />
              ) : (
                <AvatarFallback>
                  {session.user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{u.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {u.email}
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border">
          <Calendar className="w-4 h-4 mr-2" />
          Joined {formatDate(u.createdAt)}
        </div>
      </div>

      <Separator />

      {/* 2. Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Exercises
            </CardTitle>
            <Code2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
          <CardFooter />
        </Card>

        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulSubmissions} passed tests
            </p>
          </CardContent>
          <CardFooter />
        </Card>
      </div>

      {/* 3. Submissions List */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5" /> Recent Activity
        </h2>
        <div>
          {submissions.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              No activity
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {submissions.map((s, i) => (
                <SubmissionCard
                  key={s.results?.jobUid || i}
                  problem={s.problem}
                  results={s.results}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
