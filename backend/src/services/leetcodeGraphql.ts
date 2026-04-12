import axios, { AxiosInstance } from 'axios';
import { getCache, setCache } from './cache';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

// Custom error class for all LeetCode GraphQL failures
export class LeetCodeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'LeetCodeError';
  }
}

// Axios client configured for LeetCode GraphQL
const client: AxiosInstance = axios.create({
  baseURL: LEETCODE_GRAPHQL_URL,
  headers: {
    'Content-Type': 'application/json',
    'Referer': 'https://leetcode.com',
    'Origin': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  timeout: 15000,
});

// Generic GraphQL executor with error handling
async function query<T>(
  operationName: string,
  graphqlQuery: string,
  variables: Record<string, unknown> = {},
  retryCount: number = 0
): Promise<T> {
  try {
    const response = await client.post('', {
      operationName,
      query: graphqlQuery,
      variables,
    });

    if (response.data.errors) {
      const firstError = response.data.errors[0];
      throw new LeetCodeError(
        firstError.message || 'GraphQL query returned errors',
        'GRAPHQL_ERROR',
        400
      );
    }

    if (!response.data.data) {
      throw new LeetCodeError(
        'GraphQL response contained no data',
        'NO_DATA',
        500
      );
    }

    return response.data.data as T;
  } catch (error: unknown) {
    if (error instanceof LeetCodeError) {
        if (error.code === 'RATE_LIMITED' && retryCount === 0) {
            // Wait 2 seconds and retry once
            await new Promise(resolve => setTimeout(resolve, 2000));
            return query<T>(operationName, graphqlQuery, variables, 1);
        }
        throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new LeetCodeError(
          'LeetCode request timed out. Try again.',
          'TIMEOUT',
          504
        );
      }
      if (error.response?.status === 429) {
          if (retryCount === 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              return query<T>(operationName, graphqlQuery, variables, 1);
          }
        throw new LeetCodeError(
          'LeetCode is rate limiting requests. Wait 30 seconds and try again.',
          'RATE_LIMITED',
          429
        );
      }
      throw new LeetCodeError(
        `LeetCode request failed: ${error.message}`,
        'NETWORK_ERROR',
        502
      );
    }

    throw new LeetCodeError(
      'Unexpected error querying LeetCode',
      'UNKNOWN_ERROR',
      500
    );
  }
}

// ─────────────────────────────────────────────
// TYPE DEFINITIONS — All response shapes typed
// ─────────────────────────────────────────────

export interface LeetCodeProfile {
  username: string;
  profile: {
    ranking: number;
    reputation: number;
    starRating: number;
    realName: string;
    aboutMe: string;
    userAvatar: string;
    countryName: string;
  };
}

export interface SubmissionStat {
  difficulty: string;
  count: number;
  submissions: number;
}

export interface LeetCodeSolved {
  solvedProblem: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissionNum: SubmissionStat[];
  acSubmissionNum: SubmissionStat[];
}

export interface SkillTag {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface LeetCodeSkills {
  advanced: SkillTag[];
  intermediate: SkillTag[];
  fundamental: SkillTag[];
}

export interface LanguageStat {
  languageName: string;
  problemsSolved: number;
}

export interface LeetCodeCalendar {
  submissionCalendar: string;
  totalActiveDays: number;
  streak: number;
}

export interface ContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  topPercentage: number;
  totalParticipants: number;
}

export interface ContestHistoryEntry {
  attended: boolean;
  trendDirection: string;
  problemsSolved: number;
  totalProblems: number;
  finishTimeInSeconds: number;
  rating: number;
  ranking: number;
  contest: {
    title: string;
    startTime: number;
  };
}

export interface Submission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface TopicTag {
  name: string;
  slug: string;
}

export interface DailyProblem {
  date: string;
  link: string;
  question: {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: TopicTag[];
    acRate: number;
    content: string;
    isPaidOnly: boolean;
  };
}

export interface ProblemListItem {
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: number;
  isPaidOnly: boolean;
  topicTags: TopicTag[];
  questionId: string;
}

export interface ProblemListResult {
  total: number;
  questions: ProblemListItem[];
}

export interface ProblemDetail extends ProblemListItem {
  content: string;
  sampleTestCase: string;
  metaData: string;
  hints: string[];
}

export interface OfficialSolution {
  id: string;
  title: string;
  content: string;
  contentTypeId: string;
}

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        starRating
        realName
        aboutMe
        userAvatar
        countryName
      }
    }
  }
`;

export async function getUserProfile(username: string): Promise<LeetCodeProfile> {
  const cacheKey = `profile:${username}`;
  const cached = getCache<LeetCodeProfile>(cacheKey);
  if (cached) return cached;

  const data = await query<{ matchedUser: LeetCodeProfile | null }>(
    'getUserProfile',
    USER_PROFILE_QUERY,
    { username }
  );

  if (!data.matchedUser) {
    throw new LeetCodeError(
      `LeetCode user "${username}" not found or profile is private`,
      'USER_NOT_FOUND',
      404
    );
  }

  setCache(cacheKey, data.matchedUser, 600);
  return data.matchedUser;
}

// ─────────────────────────────────────────────
// SOLVED STATISTICS
// ─────────────────────────────────────────────

const USER_SOLVED_QUERY = `
  query getUserSolved($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

export async function getUserSolved(username: string): Promise<LeetCodeSolved> {
  const cacheKey = `solved:${username}`;
  const cached = getCache<LeetCodeSolved>(cacheKey);
  if (cached) return cached;

  const data = await query<{ matchedUser: { submitStatsGlobal: { acSubmissionNum: SubmissionStat[]; totalSubmissionNum: SubmissionStat[] } } | null }>(
    'getUserSolved',
    USER_SOLVED_QUERY,
    { username }
  );

  if (!data.matchedUser) {
    throw new LeetCodeError(`User "${username}" not found`, 'USER_NOT_FOUND', 404);
  }

  const ac = data.matchedUser.submitStatsGlobal.acSubmissionNum;
  const total = data.matchedUser.submitStatsGlobal.totalSubmissionNum;

  const result: LeetCodeSolved = {
    solvedProblem: ac.find(s => s.difficulty === 'All')?.count ?? 0,
    easySolved: ac.find(s => s.difficulty === 'Easy')?.count ?? 0,
    mediumSolved: ac.find(s => s.difficulty === 'Medium')?.count ?? 0,
    hardSolved: ac.find(s => s.difficulty === 'Hard')?.count ?? 0,
    totalSubmissionNum: total,
    acSubmissionNum: ac,
  };

  setCache(cacheKey, result, 600);
  return result;
}

// ─────────────────────────────────────────────
// SKILL STATS
// ─────────────────────────────────────────────

const USER_SKILLS_QUERY = `
  query getUserSkills($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
  }
`;

export async function getUserSkills(username: string): Promise<LeetCodeSkills> {
  const cacheKey = `skills:${username}`;
  const cached = getCache<LeetCodeSkills>(cacheKey);
  if (cached) return cached;

  const data = await query<{ matchedUser: { tagProblemCounts: LeetCodeSkills } | null }>(
    'getUserSkills',
    USER_SKILLS_QUERY,
    { username }
  );

  if (!data.matchedUser) {
    throw new LeetCodeError(`User "${username}" not found`, 'USER_NOT_FOUND', 404);
  }

  const result = data.matchedUser.tagProblemCounts;
  setCache(cacheKey, result, 600);
  return result;
}

// ─────────────────────────────────────────────
// LANGUAGE STATS
// ─────────────────────────────────────────────

const USER_LANGUAGES_QUERY = `
  query getUserLanguages($username: String!) {
    matchedUser(username: $username) {
      languageProblemCount {
        languageName
        problemsSolved
      }
    }
  }
`;

export async function getUserLanguages(username: string): Promise<LanguageStat[]> {
  const cacheKey = `languages:${username}`;
  const cached = getCache<LanguageStat[]>(cacheKey);
  if (cached) return cached;

  const data = await query<{ matchedUser: { languageProblemCount: LanguageStat[] } | null }>(
    'getUserLanguages',
    USER_LANGUAGES_QUERY,
    { username }
  );

  if (!data.matchedUser) {
    throw new LeetCodeError(`User "${username}" not found`, 'USER_NOT_FOUND', 404);
  }

  const result = data.matchedUser.languageProblemCount;
  setCache(cacheKey, result, 600);
  return result;
}

// ─────────────────────────────────────────────
// SUBMISSION CALENDAR
// ─────────────────────────────────────────────

const USER_CALENDAR_QUERY = `
  query getUserCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        submissionCalendar
        totalActiveDays
        streak
      }
    }
  }
`;

export async function getUserCalendar(
  username: string,
  year?: number
): Promise<LeetCodeCalendar> {
  const cacheKey = `calendar:${username}:${year ?? 'current'}`;
  const cached = getCache<LeetCodeCalendar>(cacheKey);
  if (cached) return cached;

  const data = await query<{ matchedUser: { userCalendar: LeetCodeCalendar } | null }>(
    'getUserCalendar',
    USER_CALENDAR_QUERY,
    { username, year: year ?? null }
  );

  if (!data.matchedUser) {
    throw new LeetCodeError(`User "${username}" not found`, 'USER_NOT_FOUND', 404);
  }

  const result = data.matchedUser.userCalendar;
  setCache(cacheKey, result, 300);
  return result;
}

// ─────────────────────────────────────────────
// CONTEST RANKING
// ─────────────────────────────────────────────

const USER_CONTEST_QUERY = `
  query getUserContest($username: String!) {
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
      totalParticipants
    }
    userContestRankingHistory(username: $username) {
      attended
      trendDirection
      problemsSolved
      totalProblems
      finishTimeInSeconds
      rating
      ranking
      contest {
        title
        startTime
      }
    }
  }
`;

export async function getUserContest(username: string): Promise<{
  contestDetails: ContestRanking | null;
  contestHistory: ContestHistoryEntry[];
}> {
  const cacheKey = `contest:${username}`;
  const cached = getCache<{ contestDetails: ContestRanking | null; contestHistory: ContestHistoryEntry[] }>(cacheKey);
  if (cached) return cached;

  const data = await query<{
    userContestRanking: ContestRanking | null;
    userContestRankingHistory: ContestHistoryEntry[] | null;
  }>('getUserContest', USER_CONTEST_QUERY, { username });

  const result = {
    contestDetails: data.userContestRanking,
    contestHistory: (data.userContestRankingHistory ?? []).filter(h => h.attended),
  };

  setCache(cacheKey, result, 600);
  return result;
}

// ─────────────────────────────────────────────
// RECENT ACCEPTED SUBMISSIONS
// ─────────────────────────────────────────────

const USER_SUBMISSIONS_QUERY = `
  query getRecentSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

export async function getUserSubmissions(
  username: string,
  limit: number = 10
): Promise<Submission[]> {
  const cacheKey = `submissions:${username}:${limit}`;
  const cached = getCache<Submission[]>(cacheKey);
  if (cached) return cached;

  const data = await query<{ recentAcSubmissionList: Submission[] }>(
    'getRecentSubmissions',
    USER_SUBMISSIONS_QUERY,
    { username, limit }
  );

  const result = data.recentAcSubmissionList ?? [];
  setCache(cacheKey, result, 300);
  return result;
}

// ─────────────────────────────────────────────
// DAILY PROBLEM
// ─────────────────────────────────────────────

const DAILY_PROBLEM_QUERY = `
  query getDailyProblem {
    activeDailyCodingChallengeQuestion {
      date
      link
      question {
        questionId
        title
        titleSlug
        difficulty
        topicTags {
          name
          slug
        }
        acRate
        content
        isPaidOnly
      }
    }
  }
`;

export async function getDailyProblem(): Promise<DailyProblem> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `daily:${today}`;
  const cached = getCache<DailyProblem>(cacheKey);
  if (cached) return cached;

  const data = await query<{ activeDailyCodingChallengeQuestion: DailyProblem }>(
    'getDailyProblem',
    DAILY_PROBLEM_QUERY
  );

  if (!data.activeDailyCodingChallengeQuestion) {
    throw new LeetCodeError('Daily problem not available', 'NO_DAILY_PROBLEM', 404);
  }

  // Cache until midnight UTC
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const ttlSeconds = Math.floor((midnight.getTime() - now.getTime()) / 1000);

  setCache(cacheKey, data.activeDailyCodingChallengeQuestion, ttlSeconds > 0 ? ttlSeconds : 60);
  return data.activeDailyCodingChallengeQuestion;
}

// ─────────────────────────────────────────────
// PROBLEM LIST WITH FILTERS
// ─────────────────────────────────────────────

const PROBLEM_LIST_QUERY = `
  query getProblemList(
    $categorySlug: String
    $limit: Int
    $skip: Int
    $filters: QuestionListFilterInput
  ) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        questionId
        title
        titleSlug
        difficulty
        acRate
        isPaidOnly
        topicTags {
          name
          slug
        }
      }
    }
  }
`;

export interface ProblemListParams {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
  limit?: number;
  skip?: number;
  searchQuery?: string;
}

export async function getProblemList(params: ProblemListParams = {}): Promise<ProblemListResult> {
  const { difficulty, tags, limit = 20, skip = 0, searchQuery } = params;

  const cacheKey = `problems:${JSON.stringify(params)}`;
  const cached = getCache<ProblemListResult>(cacheKey);
  if (cached) return cached;

  const filters: Record<string, unknown> = {};
  if (difficulty) filters.difficulty = difficulty;
  if (tags && tags.length > 0) filters.tags = tags;
  if (searchQuery) filters.searchKeywords = searchQuery;

  const data = await query<{ problemsetQuestionList: ProblemListResult }>(
    'getProblemList',
    PROBLEM_LIST_QUERY,
    {
      categorySlug: '',
      limit: Math.min(limit, 50),
      skip,
      filters,
    }
  );

  const result = data.problemsetQuestionList;
  setCache(cacheKey, result, 300);
  return result;
}

// ─────────────────────────────────────────────
// SINGLE PROBLEM DETAIL
// ─────────────────────────────────────────────

const PROBLEM_DETAIL_QUERY = `
  query getProblemDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      difficulty
      acRate
      isPaidOnly
      content
      sampleTestCase
      metaData
      hints
      topicTags {
        name
        slug
      }
    }
  }
`;

export async function getProblemDetail(titleSlug: string): Promise<ProblemDetail> {
  const cacheKey = `problem:${titleSlug}`;
  const cached = getCache<ProblemDetail>(cacheKey);
  if (cached) return cached;

  const data = await query<{ question: ProblemDetail | null }>(
    'getProblemDetail',
    PROBLEM_DETAIL_QUERY,
    { titleSlug }
  );

  if (!data.question) {
    throw new LeetCodeError(
      `Problem "${titleSlug}" not found`,
      'PROBLEM_NOT_FOUND',
      404
    );
  }

  setCache(cacheKey, data.question, 3600);
  return data.question;
}

// ─────────────────────────────────────────────
// OFFICIAL SOLUTION
// ─────────────────────────────────────────────

const OFFICIAL_SOLUTION_QUERY = `
  query getOfficialSolution($titleSlug: String!) {
    ugcArticle: ugcArticleOfficialSolution(titleSlug: $titleSlug) {
      id
      title
      content
      contentTypeId
    }
  }
`;

export async function getOfficialSolution(titleSlug: string): Promise<OfficialSolution | null> {
  const cacheKey = `solution:${titleSlug}`;
  const cached = getCache<OfficialSolution | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const data = await query<{ ugcArticle: OfficialSolution | null }>(
      'getOfficialSolution',
      OFFICIAL_SOLUTION_QUERY,
      { titleSlug }
    );

    const result = data.ugcArticle ?? null;
    setCache(cacheKey, result, 3600);
    return result;
  } catch {
    // Official solutions are often unavailable — return null gracefully
    return null;
  }
}

// ─────────────────────────────────────────────
// USER PROGRESS (beat percentage)
// ─────────────────────────────────────────────

const USER_PROGRESS_QUERY = `
  query getUserProgress($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      profile {
        ranking
      }
    }
    allQuestionsCount {
      difficulty
      count
    }
  }
`;

export interface UserProgress {
  solvedByDifficulty: { difficulty: string; count: number }[];
  totalByDifficulty: { difficulty: string; count: number }[];
  ranking: number;
}

export async function getUserProgress(username: string): Promise<UserProgress> {
  const cacheKey = `progress:${username}`;
  const cached = getCache<UserProgress>(cacheKey);
  if (cached) return cached;

  const data = await query<{
    matchedUser: {
      submitStatsGlobal: { acSubmissionNum: { difficulty: string; count: number; submissions: number }[] };
      profile: { ranking: number };
    } | null;
    allQuestionsCount: { difficulty: string; count: number }[];
  }>('getUserProgress', USER_PROGRESS_QUERY, { username });

  if (!data.matchedUser) {
    throw new LeetCodeError(`User "${username}" not found`, 'USER_NOT_FOUND', 404);
  }

  const result: UserProgress = {
    solvedByDifficulty: data.matchedUser.submitStatsGlobal.acSubmissionNum.map(s => ({
      difficulty: s.difficulty,
      count: s.count,
    })),
    totalByDifficulty: data.allQuestionsCount,
    ranking: data.matchedUser.profile.ranking,
  };

  setCache(cacheKey, result, 600);
  return result;
}
